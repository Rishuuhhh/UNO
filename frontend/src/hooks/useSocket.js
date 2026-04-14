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
    });
  }
  return _socket;
}

// ─── Session helpers ──────────────────────────────────────────────────────────
function saveSession(token, roomCode) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, roomCode }));
  } catch (_) {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {}
}

export function useSocket(navigate) {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(RECONNECT_TIMEOUT_S);
  const countdownRef = useRef(null);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  });

  const { reset } = useGameStore.getState();

  const resolveMyTurn = useCallback((gameState, socketId) => {
    if (!gameState || !socketId) return false;
    const currentPlayer = gameState.players?.[gameState.currentTurnIndex];
    return currentPlayer?.id === socketId;
  }, []);

  const startCountdown = useCallback(() => {
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
  }, [reset]);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setReconnecting(false);
    setReconnectCountdown(RECONNECT_TIMEOUT_S);
  }, []);

  useEffect(() => {
    // ── Connection lifecycle ──────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      stopCountdown();

      // Attempt to rejoin if we have a saved session
      const session = loadSession();
      if (session?.token) {
        socket.emit('rejoin_room', { token: session.token });
      }
    };

    const onDisconnect = () => {
      setConnected(false);
      startCountdown();
    };

    const onReconnect = () => {
      setConnected(true);
      stopCountdown();
    };

    // ── Room / lobby events ───────────────────────────────────────────────
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
      if (navigateRef.current) navigateRef.current('/');
    };

    const onLobbyUpdated = ({ players }) => {
      useGameStore.getState().setPlayers(players ?? []);
    };

    // ── Rejoin ────────────────────────────────────────────────────────────
    const onGameStateUpdate = ({ delta }) => {
      const store = useGameStore.getState();
      const current = store.gameState ?? {};
      const updated = { ...current, ...delta };
      store.setGameState(updated);

      // If we rejoined mid-game, navigate to the game page
      const session = loadSession();
      if (updated.status === 'playing' && session?.roomCode) {
        store.setRoomCode(session.roomCode);
        if (navigateRef.current) navigateRef.current(`/game/${session.roomCode}`);
      }

      if (delta?.myHand !== undefined) store.setMyHand(delta.myHand);
      store.setMyTurn(resolveMyTurn(updated, socket.id));
    };

    // ── Game events ───────────────────────────────────────────────────────
    const onGameStarted = ({ myHand, gameState, roomCode: rc }) => {
      const store = useGameStore.getState();
      store.setGameState(gameState);
      store.setMyHand(myHand ?? []);
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

    // ── Errors ────────────────────────────────────────────────────────────
    const onActionError = ({ message }) => useGameStore.getState().setError(message);
    const onRoomError = ({ message }) => {
      useGameStore.getState().setError(message);
      // If rejoin failed, clear stale session
      if (message === 'Invalid reconnect token') clearSession();
    };
    const onChatError = ({ message }) => useGameStore.getState().setError(message);
    const onRateLimitError = ({ message }) => useGameStore.getState().setError(message);
    const onChatMessage = (message) => useGameStore.getState().addChatMessage(message);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('room_created', onRoomCreated);
    socket.on('join_room_success', onJoinRoomSuccess);
    socket.on('lobby_updated', onLobbyUpdated);
    socket.on('game_started', onGameStarted);
    socket.on('game_state_update', onGameStateUpdate);
    socket.on('game_over', onGameOver);
    socket.on('action_error', onActionError);
    socket.on('room_error', onRoomError);
    socket.on('chat_error', onChatError);
    socket.on('rate_limit_error', onRateLimitError);
    socket.on('chat_message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('room_created', onRoomCreated);
      socket.off('join_room_success', onJoinRoomSuccess);
      socket.off('lobby_updated', onLobbyUpdated);
      socket.off('game_started', onGameStarted);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('game_over', onGameOver);
      socket.off('action_error', onActionError);
      socket.off('room_error', onRoomError);
      socket.off('chat_error', onChatError);
      socket.off('rate_limit_error', onRateLimitError);
      socket.off('chat_message', onChatMessage);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resolveMyTurn, startCountdown, stopCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  return { socket, connected, reconnecting, reconnectCountdown };
}

export default useSocket;
