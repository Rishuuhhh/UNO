/**
 * Socket event handler and payload validation middleware.
 */

import { randomUUID } from 'crypto';
import { rateLimiter } from './rateLimiter.js';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  rejoinRoom,
  startGame,
  playCard,
  drawCard,
  unoCall,
  challengeUno,
  handleDisconnect,
} from '../gameLogic/roomManager.js';
import { sanitizeStateForPlayer } from '../gameLogic/engine.js';

// ─── Session token validation ─────────────────────────────────────────────────

/**
 * Checks that the socket has a valid session token.
 * Disconnects the socket if missing.
 * @param {object} socket
 * @returns {boolean} true if valid
 */
function requireSessionToken(socket) {
  if (!socket.data.sessionToken) {
    socket.disconnect(true);
    return false;
  }
  return true;
}

// ─── Error handler helper ─────────────────────────────────────────────────────

/**
 * Emits the appropriate error event based on the typed error thrown by Room Manager.
 * @param {object} socket
 * @param {unknown} err
 */
function handleRoomManagerError(socket, err) {
  if (err && typeof err === 'object' && err.type) {
    socket.emit(err.type, { message: err.message });
  } else {
    socket.emit('server_error', { message: 'An unexpected error occurred' });
  }
}

// ─── Lobby state helper ───────────────────────────────────────────────────────

/**
 * Builds the lobby_updated payload from a room.
 * @param {object} room
 * @returns {{ players: object[], hostId: string }}
 */
function buildLobbyPayload(room) {
  return {
    players: room.players.map(p => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      isConnected: p.isConnected,
    })),
    hostId: room.hostId,
  };
}

// ─── registerSocketHandlers ───────────────────────────────────────────────────

/**
 * Registers all Socket.IO event handlers on the given socket.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSocketHandlers(io, socket) {

  // ── create_room ──────────────────────────────────────────────────────────────
  socket.on('create_room', async (payload) => {
    const validation = validatePayload('create_room', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const { roomCode, room } = await createRoom(socket.id, payload.displayName);

      // Generate and store session token
      socket.data.sessionToken = randomUUID();

      await socket.join(roomCode);

      socket.emit('room_created', {
        roomCode,
        sessionToken: socket.data.sessionToken,
        lobbyState: buildLobbyPayload(room),
      });

      io.to(roomCode).emit('lobby_updated', buildLobbyPayload(room));
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── join_room ────────────────────────────────────────────────────────────────
  socket.on('join_room', async (payload) => {
    const validation = validatePayload('join_room', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const room = await joinRoom(socket.id, payload.roomCode, payload.displayName);

      // Generate and store session token
      socket.data.sessionToken = randomUUID();

      await socket.join(room.roomCode);

      socket.emit('join_room_success', {
        sessionToken: socket.data.sessionToken,
        roomCode: room.roomCode,
      });

      io.to(room.roomCode).emit('lobby_updated', buildLobbyPayload(room));
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── leave_room ───────────────────────────────────────────────────────────────
  socket.on('leave_room', async (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('leave_room', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const { room, deleted } = await leaveRoom(socket.id);

      // Get the room code before leaving the Socket.IO room
      const roomCode = room ? room.roomCode : null;

      socket.leave(roomCode);

      if (!deleted && room) {
        io.to(room.roomCode).emit('lobby_updated', buildLobbyPayload(room));
      }
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── rejoin_room ──────────────────────────────────────────────────────────────
  socket.on('rejoin_room', async (payload) => {
    const validation = validatePayload('rejoin_room', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const room = rejoinRoom(socket.id, payload.token);

      socket.data.sessionToken = randomUUID();

      await socket.join(room.roomCode);

      const gameState = room.gameState;
      if (gameState) {
        const clientState = sanitizeStateForPlayer(gameState, socket.id);
        socket.emit('game_state_update', { delta: { ...clientState, roomCode: room.roomCode } });
      } else {
        socket.emit('join_room_success', {
          sessionToken: socket.data.sessionToken,
          roomCode: room.roomCode,
        });
        io.to(room.roomCode).emit('lobby_updated', buildLobbyPayload(room));
      }
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── start_game ───────────────────────────────────────────────────────────────
  socket.on('start_game', async (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('start_game', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const room = await startGame(socket.id);
      const gameState = room.gameState;

      // Send each player their sanitized game state
      for (const player of gameState.players) {
        const clientState = sanitizeStateForPlayer(gameState, player.id);
        io.to(player.id).emit('game_started', {
          myHand: clientState.myHand,
          gameState: clientState,
        });
      }
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── play_card ────────────────────────────────────────────────────────────────
  socket.on('play_card', async (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('play_card', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const { room, winner, scores } = await playCard(socket.id, payload.cardId, payload.chosenColor);
      const gameState = room.gameState;

      if (winner) {
        // Calculate final hand counts
        const finalCounts = {};
        for (const p of gameState.players) {
          finalCounts[p.id] = p.hand ? p.hand.length : 0;
        }

        io.to(room.roomCode).emit('game_over', {
          winnerId: winner.id,
          winnerName: winner.displayName,
          scores,
          finalCounts,
        });
      } else {
        // Broadcast sanitized state to each player
        for (const player of gameState.players) {
          const clientState = sanitizeStateForPlayer(gameState, player.id);
          io.to(player.id).emit('game_state_update', { delta: clientState });
        }
      }
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── draw_card ────────────────────────────────────────────────────────────────
  socket.on('draw_card', async (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('draw_card', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const { room } = await drawCard(socket.id);
      const gameState = room.gameState;

      for (const player of gameState.players) {
        const clientState = sanitizeStateForPlayer(gameState, player.id);
        io.to(player.id).emit('game_state_update', { delta: clientState });
      }
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── uno_call ─────────────────────────────────────────────────────────────────
  socket.on('uno_call', (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('uno_call', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const room = unoCall(socket.id);
      io.to(room.roomCode).emit('game_state_update', { delta: { players: room.players } });
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── challenge_uno ────────────────────────────────────────────────────────────
  socket.on('challenge_uno', async (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('challenge_uno', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    if (!rateLimiter.checkAction(socket.id)) {
      socket.emit('rate_limit_error', { message: 'Rate limit exceeded' });
      return;
    }

    try {
      const { room } = await challengeUno(socket.id, payload.targetPlayerId);
      io.to(room.roomCode).emit('game_state_update', { delta: { players: room.players } });
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── chat_message ─────────────────────────────────────────────────────────────
  socket.on('chat_message', (payload) => {
    if (!requireSessionToken(socket)) return;

    const validation = validatePayload('chat_message', payload);
    if (!validation.valid) {
      socket.emit('action_error', { message: 'Invalid payload' });
      return;
    }

    // Validate text length
    if (typeof payload.text !== 'string' || payload.text.length < 1 || payload.text.length > 200) {
      socket.emit('chat_error', { message: 'Message too long' });
      return;
    }

    // Apply chat rate limit
    if (!rateLimiter.checkChat(socket.id)) {
      socket.emit('chat_error', { message: 'Rate limit exceeded' });
      return;
    }

    // Find the sender's display name from their room
    try {
      // Get the room via socketToRoom mapping (imported indirectly via roomManager)
      // We broadcast to the room using socket.rooms (Socket.IO tracks joined rooms)
      const rooms = [...socket.rooms].filter(r => r !== socket.id);
      const roomCode = rooms[0];
      if (!roomCode) {
        socket.emit('room_error', { message: 'Not in a room' });
        return;
      }

      io.to(roomCode).emit('chat_message', {
        senderId: socket.id,
        text: payload.text,
        timestamp: Date.now(),
      });
    } catch (err) {
      handleRoomManagerError(socket, err);
    }
  });

  // ── disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { room } = handleDisconnect(socket.id);
    rateLimiter.cleanup(socket.id);

    if (room) {
      if (room.gameState) {
        // Game in progress — broadcast updated game state
        for (const player of room.gameState.players) {
          if (player.isConnected) {
            const clientState = sanitizeStateForPlayer(room.gameState, player.id);
            io.to(player.id).emit('game_state_update', { delta: clientState });
          }
        }
      } else {
        // In lobby — broadcast lobby update
        io.to(room.roomCode).emit('lobby_updated', buildLobbyPayload(room));
      }
    }
  });
}

// ─── validatePayload ─────────────────────────────────────────────────────────

/**
 * Validate the payload for a given socket event.
 * @param {string} event - The socket event name
 * @param {unknown} payload - The payload to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePayload(event, payload) {
  const p = payload != null && typeof payload === 'object' ? payload : {};

  switch (event) {
    case 'create_room':
      if (typeof p.displayName !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      return { valid: true };

    case 'join_room':
      if (typeof p.roomCode !== 'string' || typeof p.displayName !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      return { valid: true };

    case 'leave_room':
      return { valid: true };

    case 'rejoin_room':
      if (typeof p.token !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      return { valid: true };

    case 'start_game':
      return { valid: true };

    case 'play_card': {
      if (typeof p.cardId !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      // chosenColor is optional, but if present must be a string
      if ('chosenColor' in p && typeof p.chosenColor !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      return { valid: true };
    }

    case 'draw_card':
      return { valid: true };

    case 'uno_call':
      return { valid: true };

    case 'challenge_uno':
      if (typeof p.targetPlayerId !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      return { valid: true };

    case 'chat_message':
      if (typeof p.text !== 'string') {
        return { valid: false, error: 'Invalid payload' };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}
