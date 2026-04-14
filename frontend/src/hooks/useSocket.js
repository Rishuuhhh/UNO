import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useGameStore from '../store/gameStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Reconnection overlay countdown duration in seconds
const RECONNECT_TIMEOUT_S = 60;

export function useSocket(navigate) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(RECONNECT_TIMEOUT_S);
  const countdownRef = useRef(null);
  const navigateRef = useRef(navigate);

  // Keep navigateRef in sync with the latest navigate function
  useEffect(() => {
    navigateRef.current = navigate;
  });

  const {
    setRoomCode,
    setPlayers,
    setMyHand,
    setMyTurn,
    setGameState,
    addChatMessage,
    setError,
    reset,
  } = useGameStore.getState();

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
        // Redirect to home after reconnection failure
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
    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ──────────────────────────────────────────────────

    socket.on('connect', () => {
      setConnected(true);
      stopCountdown();
    });

    socket.on('disconnect', () => {
      setConnected(false);
      startCountdown();
    });

    socket.on('reconnect', () => {
      setConnected(true);
      stopCountdown();
    });

    // ── Server → Client events ────────────────────────────────────────────────

    // Room created: set roomCode and initial player list, then navigate to game lobby
    socket.on('room_created', ({ roomCode, lobbyState }) => {
      const store = useGameStore.getState();
      store.setRoomCode(roomCode);
      if (lobbyState?.players) {
        store.setPlayers(lobbyState.players);
      }
      if (navigateRef.current) {
        navigateRef.current(`/game/${roomCode}`);
      }
    });

    // Lobby updated: refresh player list
    socket.on('lobby_updated', ({ players }) => {
      useGameStore.getState().setPlayers(players ?? []);
    });

    // Game started: set full game state, hand, and turn flag, then navigate to game
    socket.on('game_started', ({ myHand, gameState, roomCode: rc }) => {
      const store = useGameStore.getState();
      store.setGameState(gameState);
      store.setMyHand(myHand ?? []);
      store.setMyTurn(resolveMyTurn(gameState, socket.id));
      const code = rc ?? store.roomCode;
      if (navigateRef.current && code) {
        navigateRef.current(`/game/${code}`);
      }
    });

    // Game state update: apply delta to existing gameState
    socket.on('game_state_update', ({ delta }) => {
      const store = useGameStore.getState();
      const current = store.gameState ?? {};
      const updated = { ...current, ...delta };
      store.setGameState(updated);

      // Update hand if delta includes myHand
      if (delta?.myHand !== undefined) {
        store.setMyHand(delta.myHand);
      }

      store.setMyTurn(resolveMyTurn(updated, socket.id));
    });

    // Game over: update gameState with game-over info
    socket.on('game_over', (payload) => {
      const store = useGameStore.getState();
      store.setGameState({ ...(store.gameState ?? {}), ...payload, status: 'finished' });
      store.setMyTurn(false);
    });

    // Error events → store error state
    socket.on('action_error', ({ message }) => useGameStore.getState().setError(message));
    socket.on('room_error', ({ message }) => useGameStore.getState().setError(message));
    socket.on('chat_error', ({ message }) => useGameStore.getState().setError(message));
    socket.on('rate_limit_error', ({ message }) => useGameStore.getState().setError(message));

    // Chat message
    socket.on('chat_message', (message) => {
      useGameStore.getState().addChatMessage(message);
    });

    return () => {
      stopCountdown();
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    socket: socketRef.current,
    connected,
    reconnecting,
    reconnectCountdown,
  };
}

export default useSocket;
