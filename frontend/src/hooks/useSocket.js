import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useGameStore from '../store/gameStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Reconnection overlay countdown duration in seconds
const RECONNECT_TIMEOUT_S = 60;

// ─── Singleton socket instance ────────────────────────────────────────────────
// Created once for the lifetime of the app so navigating between pages
// does NOT create a new connection and lose room/game state.
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

export function useSocket(navigate) {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(RECONNECT_TIMEOUT_S);
  const countdownRef = useRef(null);
  const navigateRef = useRef(navigate);

  // Keep navigateRef in sync with the latest navigate function
  useEffect(() => {
    navigateRef.current = navigate;
  });

  const { reset } = useGameStore.getState();

  // Determine if it's the current player's turn
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
    // ── Connection lifecycle ────────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true);
      stopCountdown();
    };

    const onDisconnect = () => {
      setConnected(false);
      startCountdown();
    };

    const onReconnect = () => {
      setConnected(true);
      stopCountdown();
    };

    // ── Server → Client events ──────────────────────────────────────────────
    const onRoomCreated = ({ roomCode, lobbyState }) => {
      const store = useGameStore.getState();
      store.setRoomCode(roomCode);
      if (lobbyState?.players) {
        store.setPlayers(lobbyState.players);
      }
      if (navigateRef.current) {
        navigateRef.current(`/`);
      }
    };

    const onLobbyUpdated = ({ players }) => {
      useGameStore.getState().setPlayers(players ?? []);
    };

    const onGameStarted = ({ myHand, gameState, roomCode: rc }) => {
      const store = useGameStore.getState();
      store.setGameState(gameState);
      store.setMyHand(myHand ?? []);
      store.setMyTurn(resolveMyTurn(gameState, socket.id));
      const code = rc ?? store.roomCode;
      if (navigateRef.current && code) {
        navigateRef.current(`/game/${code}`);
      }
    };

    const onGameStateUpdate = ({ delta }) => {
      const store = useGameStore.getState();
      const current = store.gameState ?? {};
      const updated = { ...current, ...delta };
      store.setGameState(updated);
      if (delta?.myHand !== undefined) {
        store.setMyHand(delta.myHand);
      }
      store.setMyTurn(resolveMyTurn(updated, socket.id));
    };

    const onGameOver = (payload) => {
      const store = useGameStore.getState();
      store.setGameState({ ...(store.gameState ?? {}), ...payload, status: 'finished' });
      store.setMyTurn(false);
    };

    const onActionError = ({ message }) => useGameStore.getState().setError(message);
    const onRoomError = ({ message }) => useGameStore.getState().setError(message);
    const onChatError = ({ message }) => useGameStore.getState().setError(message);
    const onRateLimitError = ({ message }) => useGameStore.getState().setError(message);
    const onChatMessage = (message) => useGameStore.getState().addChatMessage(message);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('room_created', onRoomCreated);
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

  return {
    socket,
    connected,
    reconnecting,
    reconnectCountdown,
  };
}

export default useSocket;
