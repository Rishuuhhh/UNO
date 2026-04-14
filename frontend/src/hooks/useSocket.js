import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useGameStore from '../store/gameStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const RECONNECT_TIMEOUT_S = 60;
const SESSION_KEY = 'uno_session'; // { token, roomCode }

// ─── Singleton socket ─────────────────────────────────────────────────────────
let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  return _socket;
}

// ─── Session helpers ──────────────────────────────────────────────────────────
export function saveSession(token, roomCode) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ token, roomCode })); } catch (_) {}
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSocket(navigate) {
  const socket = getSocket();
  const [connected, setConnected]               = useState(socket.connected);
  const [reconnecting, setReconnecting]         = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(RECONNECT_TIMEOUT_S);
  const [connectionError, setConnectionError]   = useState(null);
  // true while we're waiting for the server to confirm a rejoin attempt
  const [rejoining, setRejoining]               = useState(false);

  const countdownRef  = useRef(null);
  const navigateRef   = useRef(navigate);
  const rejoiningRef  = useRef(false); // sync ref so event handlers can read it

  useEffect(() => { navigateRef.current = navigate; });

  const { reset } = useGameStore.getState();

  const resolveMyTurn = useCallback((gameState, socketId) => {
    if (!gameState || !socketId) return false;
    const cp = gameState.players?.[gameState.currentTurnIndex];
    return cp?.id === socketId;
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setReconnecting(false);
    setReconnectCountdown(RECONNECT_TIMEOUT_S);
  }, []);

  const startCountdown = useCallback(() => {
    stopCountdown();
    setReconnecting(true);
    setReconnectCountdown(RECONNECT_TIMEOUT_S);
    let remaining = RECONNECT_TIMEOUT_S;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setReconnectCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        clearSession();
        reset();
        window.location.href = '/';
      }
    }, 1000);
  }, [reset, stopCountdown]);

  useEffect(() => {
    // ── Connection lifecycle ──────────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
      stopCountdown();

      // Attempt rejoin if we have a saved session — do NOT clear session here
      const session = loadSession();
      if (session?.token) {
        setRejoining(true);
        rejoiningRef.current = true;
        socket.emit('rejoin_room', { token: session.token });
      }
    };

    const onDisconnect = () => {
      setConnected(false);
      setRejoining(false);
      rejoiningRef.current = false;
      // Only start countdown if we have a session worth preserving
      const session = loadSession();
      if (session?.token) {
        startCountdown();
      }
    };

    const onConnectError = (err) => {
      setConnectionError(err.message || 'Failed to connect to server');
    };

    // ── Room / lobby events ───────────────────────────────────────────────────
    const onRoomCreated = ({ roomCode, sessionToken, lobbyState }) => {
      const store = useGameStore.getState();
      store.setRoomCode(roomCode);
      if (lobbyState?.players) store.setPlayers(lobbyState.players);
      if (sessionToken) saveSession(sessionToken, roomCode);
      if (navigateRef.current) navigateRef.current('/');
    };

    const onJoinRoomSuccess = ({ roomCode, sessionToken }) => {
      const store = useGameStore.getState();
      store.setRoomCode(roomCode);
      if (sessionToken) saveSession(sessionToken, roomCode);
      // If we were rejoining a lobby, stop the rejoining state
      setRejoining(false);
      rejoiningRef.current = false;
      if (navigateRef.current) navigateRef.current('/');
    };

    const onLobbyUpdated = ({ players }) => {
      useGameStore.getState().setPlayers(players ?? []);
    };

    // ── game_state_update — handles both live updates and rejoin restoration ──
    const onGameStateUpdate = ({ delta }) => {
      const store = useGameStore.getState();
      const current = store.gameState ?? {};
      const updated = { ...current, ...delta };
      store.setGameState(updated);

      if (delta?.myHand !== undefined) store.setMyHand(delta.myHand);
      if (delta?.players)              store.setPlayers(delta.players);
      store.setMyTurn(resolveMyTurn(updated, socket.id));

      // If this was a rejoin response, navigate to the game
      if (rejoiningRef.current) {
        setRejoining(false);
        rejoiningRef.current = false;
        const session = loadSession();
        const roomCode = delta?.roomCode ?? session?.roomCode ?? updated?.roomCode;
        if (updated.status === 'playing' && roomCode) {
          store.setRoomCode(roomCode);
          if (navigateRef.current) navigateRef.current(`/game/${roomCode}`);
        }
      }
    };

    // ── Game events ───────────────────────────────────────────────────────────
    const onGameStarted = ({ myHand, gameState, roomCode: rc }) => {
      const store = useGameStore.getState();
      store.setGameState(gameState);
      store.setMyHand(myHand ?? []);
      if (gameState?.players) store.setPlayers(gameState.players);
      store.setMyTurn(resolveMyTurn(gameState, socket.id));
      const code = rc ?? store.roomCode;
      if (navigateRef.current && code) navigateRef.current(`/game/${code}`);
    };

    const onGameOver = (payload) => {
      const store = useGameStore.getState();
      store.setGameState({ ...(store.gameState ?? {}), ...payload, status: 'finished' });
      store.setMyTurn(false);
      clearSession();
    };

    const onRoundStarted = ({ myHand, gameState }) => {
      const store = useGameStore.getState();
      store.setGameState(gameState);
      store.setMyHand(myHand ?? []);
      if (gameState?.players) store.setPlayers(gameState.players);
      store.setMyTurn(resolveMyTurn(gameState, socket.id));
    };

    // ── Errors ────────────────────────────────────────────────────────────────
    const onActionError     = ({ message }) => useGameStore.getState().setError(message);
    const onRoomError       = ({ message }) => {
      useGameStore.getState().setError(message);
      if (message === 'Invalid reconnect token') {
        clearSession();
        setRejoining(false);
        rejoiningRef.current = false;
      }
    };
    const onChatError       = ({ message }) => useGameStore.getState().setError(message);
    const onRateLimitError  = ({ message }) => useGameStore.getState().setError(message);
    const onChatMessage     = (message)     => useGameStore.getState().addChatMessage(message);

    socket.on('connect',           onConnect);
    socket.on('disconnect',        onDisconnect);
    socket.on('connect_error',     onConnectError);
    socket.on('room_created',      onRoomCreated);
    socket.on('join_room_success', onJoinRoomSuccess);
    socket.on('lobby_updated',     onLobbyUpdated);
    socket.on('game_started',      onGameStarted);
    socket.on('game_state_update', onGameStateUpdate);
    socket.on('game_over',         onGameOver);
    socket.on('round_started',     onRoundStarted);
    socket.on('action_error',      onActionError);
    socket.on('room_error',        onRoomError);
    socket.on('chat_error',        onChatError);
    socket.on('rate_limit_error',  onRateLimitError);
    socket.on('chat_message',      onChatMessage);

    return () => {
      socket.off('connect',           onConnect);
      socket.off('disconnect',        onDisconnect);
      socket.off('connect_error',     onConnectError);
      socket.off('room_created',      onRoomCreated);
      socket.off('join_room_success', onJoinRoomSuccess);
      socket.off('lobby_updated',     onLobbyUpdated);
      socket.off('game_started',      onGameStarted);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('game_over',         onGameOver);
      socket.off('round_started',     onRoundStarted);
      socket.off('action_error',      onActionError);
      socket.off('room_error',        onRoomError);
      socket.off('chat_error',        onChatError);
      socket.off('rate_limit_error',  onRateLimitError);
      socket.off('chat_message',      onChatMessage);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resolveMyTurn, startCountdown, stopCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  return { socket, connected, reconnecting, reconnectCountdown, connectionError, rejoining };
}

export default useSocket;
