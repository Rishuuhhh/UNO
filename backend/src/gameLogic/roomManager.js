// ─── Room Manager ─────────────────────────────────────────────────────────────
// Stateful singleton managing all active rooms in memory.
// Does NOT use Socket.IO directly — returns results/errors for the socket handler.

import { randomUUID } from 'crypto';
import {
  buildDeck,
  shuffleDeck,
  dealCards,
  isValidMove,
  isWild4Legal,
  applyCardEffect,
  nextTurn,
  checkWin,
  calculateScore,
  drawCard as engineDrawCard,
} from './engine.js';

// ─── In-memory state ──────────────────────────────────────────────────────────

/** @type {Map<string, object>} roomCode → room */
const rooms = new Map();

/** @type {Map<string, string>} socketId → roomCode */
const socketToRoom = new Map();

// ─── MongoDB model (injectable for testing) ───────────────────────────────────

let RoomModel = null;

/**
 * Inject a MongoDB model (or mock) for persistence.
 * If not set, persistence is silently skipped.
 * @param {object} model
 */
export function setRoomModel(model) {
  RoomModel = model;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a unique 6-character alphanumeric room code (A-Z, 0-9).
 * @returns {string}
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

/**
 * Returns the room for a given socket, or throws a room_error.
 * @param {string} socketId
 * @returns {object}
 */
export function getPlayerRoom(socketId) {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) throw { type: 'room_error', message: 'Room not found' };
  const room = rooms.get(roomCode);
  if (!room) throw { type: 'room_error', message: 'Room not found' };
  return room;
}

/**
 * Attempts to persist a room to MongoDB. Logs errors but never throws.
 * @param {object} room
 */
async function persistRoom(room) {
  if (!RoomModel) return;
  try {
    await RoomModel.findOneAndUpdate(
      { _id: room.roomCode },
      {
        _id: room.roomCode,
        status: room.status,
        hostId: room.hostId,
        players: room.players.map(p => ({
          id: p.id,
          displayName: p.displayName,
          isConnected: p.isConnected,
        })),
        gameState: room.gameState,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[RoomManager] MongoDB persist error:', err.message);
  }
}

// ─── Task 8.1: createRoom ─────────────────────────────────────────────────────

/**
 * Creates a new room with the caller as host.
 * Requirements: 1.1, 1.9
 *
 * @param {string} socketId
 * @param {string} displayName
 * @returns {{ roomCode: string, room: object }}
 */
export async function createRoom(socketId, displayName) {
  const roomCode = generateRoomCode();

  const player = {
    id: socketId,
    displayName,
    isHost: true,
    isConnected: true,
    unoCalled: false,
    reconnectToken: randomUUID(),
    disconnectedAt: null,
    hand: [],
  };

  const room = {
    roomCode,
    status: 'lobby',
    hostId: socketId,
    players: [player],
    gameState: null,
  };

  rooms.set(roomCode, room);
  socketToRoom.set(socketId, roomCode);

  await persistRoom(room);

  return { roomCode, room };
}

// ─── Task 8.2: joinRoom ───────────────────────────────────────────────────────

/**
 * Adds a player to an existing room.
 * Requirements: 1.2, 1.3, 1.4, 1.5
 *
 * @param {string} socketId
 * @param {string} roomCode
 * @param {string} displayName
 * @returns {object} updated room
 */
export async function joinRoom(socketId, roomCode, displayName) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) throw { type: 'room_error', message: 'Room not found' };
  if (room.players.length >= 10) throw { type: 'room_error', message: 'Room is full' };
  if (room.status === 'playing') throw { type: 'room_error', message: 'Game already in progress' };

  const player = {
    id: socketId,
    displayName,
    isHost: false,
    isConnected: true,
    unoCalled: false,
    reconnectToken: randomUUID(),
    disconnectedAt: null,
    hand: [],
  };

  room.players.push(player);
  socketToRoom.set(socketId, room.roomCode);

  await persistRoom(room);

  return room;
}

// ─── Task 8.3: leaveRoom ──────────────────────────────────────────────────────

/**
 * Removes a player from their room.
 * Reassigns host if needed; deletes room if empty.
 * Requirements: 1.6, 1.7, 1.8
 *
 * @param {string} socketId
 * @returns {{ room: object|null, deleted: boolean }}
 */
export async function leaveRoom(socketId) {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) return { room: null, deleted: false };

  const room = rooms.get(roomCode);
  socketToRoom.delete(socketId);

  if (!room) return { room: null, deleted: false };

  room.players = room.players.filter(p => p.id !== socketId);

  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return { room: null, deleted: true };
  }

  // Reassign host if the host left
  if (room.hostId === socketId) {
    room.players[0].isHost = true;
    room.hostId = room.players[0].id;
  }

  await persistRoom(room);

  return { room, deleted: false };
}

// ─── Task 8.4: startGame ──────────────────────────────────────────────────────

/**
 * Starts the game for a room.
 * Requirements: 2.3, 2.4, 2.6
 *
 * @param {string} socketId
 * @returns {object} updated room with gameState
 */
export async function startGame(socketId) {
  const room = getPlayerRoom(socketId);

  if (room.hostId !== socketId) {
    throw { type: 'room_error', message: 'Only the host can start the game' };
  }
  if (room.players.length < 2) {
    throw { type: 'room_error', message: 'At least 2 players are required to start' };
  }

  const deck = shuffleDeck(buildDeck());

  // Build initial game state with shuffled deck as draw pile
  let gameState = {
    roomCode: room.roomCode,
    status: 'playing',
    players: room.players.map(p => ({ ...p, hand: [] })),
    currentTurnIndex: 0,
    direction: 1,
    currentColor: 'red',
    currentValue: '0',
    drawPile: deck,
    discardPile: [],
    pendingDrawCount: 0,
    drawnCardPending: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Deal 7 cards to each player
  gameState = dealCards(gameState, 7);

  // Place initial discard card — re-draw if Wild_Draw_4
  let initialCard;
  do {
    initialCard = gameState.drawPile.shift();
  } while (initialCard && initialCard.value === 'wild4');

  if (!initialCard) {
    throw { type: 'room_error', message: 'Failed to place initial discard card' };
  }

  gameState.discardPile = [initialCard];
  gameState.currentColor = initialCard.color === 'wild' ? 'red' : initialCard.color;
  gameState.currentValue = initialCard.value;

  room.status = 'playing';
  room.gameState = gameState;

  // Sync player hands from gameState back to room.players
  room.players = gameState.players;

  await persistRoom(room);

  return room;
}

// ─── Task 8.5: playCard ───────────────────────────────────────────────────────

/**
 * Plays a card from the current player's hand.
 * Requirements: 3.1-3.8, 4.1-4.9, 6.1-6.4
 *
 * @param {string} socketId
 * @param {string} cardId
 * @param {string|undefined} chosenColor
 * @returns {{ room: object, winner: object|null, scores: object|null }}
 */
export async function playCard(socketId, cardId, chosenColor) {
  const room = getPlayerRoom(socketId);
  const gameState = room.gameState;

  const currentPlayer = gameState.players[gameState.currentTurnIndex];

  // Validate it's the player's turn
  if (currentPlayer.id !== socketId) {
    throw { type: 'action_error', message: 'Not your turn' };
  }

  // Validate card is in hand
  const card = currentPlayer.hand.find(c => c.id === cardId);
  if (!card) {
    throw { type: 'action_error', message: 'Card not in hand' };
  }

  // Validate move is legal
  if (!isValidMove(card, gameState)) {
    throw { type: 'action_error', message: 'Invalid card play' };
  }

  // Wild / Wild_Draw_4 require a chosen color
  if ((card.value === 'wild' || card.value === 'wild4') && !chosenColor) {
    throw { type: 'action_error', message: 'Color selection required' };
  }

  // Wild_Draw_4 legality check
  if (card.value === 'wild4' && !isWild4Legal(card, gameState)) {
    throw { type: 'action_error', message: 'Illegal Wild Draw 4: you have a matching color card' };
  }

  // Remove card from hand, add to discard pile
  let newGameState = {
    ...gameState,
    players: gameState.players.map((p, i) => {
      if (i !== gameState.currentTurnIndex) return p;
      return { ...p, hand: p.hand.filter(c => c.id !== cardId), unoCalled: false };
    }),
    discardPile: [...gameState.discardPile, card],
    updatedAt: Date.now(),
  };

  // Apply card effect (advances turn, applies draw penalties, etc.)
  newGameState = applyCardEffect(card, newGameState, chosenColor);

  // Check for win
  const winnerId = checkWin(newGameState);

  if (winnerId) {
    const winnerPlayer = newGameState.players.find(p => p.id === winnerId);
    const scoresMap = calculateScore(newGameState.players);
    const scores = {};
    for (const [id, score] of scoresMap) {
      scores[id] = score;
    }

    newGameState.status = 'finished';
    room.status = 'lobby';
    room.gameState = newGameState;
    room.players = newGameState.players;

    await persistRoom(room);

    return {
      room,
      winner: { id: winnerId, displayName: winnerPlayer.displayName },
      scores,
    };
  }

  room.gameState = newGameState;
  room.players = newGameState.players;

  await persistRoom(room);

  return { room, winner: null, scores: null };
}

// ─── Task 8.6: drawCard ───────────────────────────────────────────────────────

/**
 * Draws a card for the current player.
 * Requirements: 3.6, 3.7
 *
 * @param {string} socketId
 * @returns {{ room: object, drawnCard: object }}
 */
export async function drawCard(socketId) {
  const room = getPlayerRoom(socketId);
  const gameState = room.gameState;

  const currentPlayer = gameState.players[gameState.currentTurnIndex];

  if (currentPlayer.id !== socketId) {
    throw { type: 'action_error', message: 'Not your turn' };
  }

  const stateBefore = gameState;
  const stateAfter = engineDrawCard(gameState);

  // Determine which card was drawn by comparing hands
  const handBefore = stateBefore.players[stateBefore.currentTurnIndex].hand;
  const handAfter = stateAfter.players[stateAfter.currentTurnIndex].hand;
  const drawnCard = handAfter.find(c => !handBefore.some(hc => hc.id === c.id)) || null;

  // Reset unoCalled for the drawing player (Requirement 5.5)
  // and advance the turn after drawing
  const stateWithReset = {
    ...stateAfter,
    players: stateAfter.players.map((p, i) => {
      if (i !== stateAfter.currentTurnIndex) return p;
      return { ...p, unoCalled: false };
    }),
  };

  // Advance turn after drawing — in standard UNO you draw one card then pass
  const stateWithNextTurn = nextTurn(stateWithReset);

  room.gameState = { ...stateWithNextTurn, updatedAt: Date.now() };
  room.players = stateWithNextTurn.players;

  await persistRoom(room);

  return { room, drawnCard };
}

// ─── Task 8.7: unoCall ────────────────────────────────────────────────────────

/**
 * Sets unoCalled = true for the calling player.
 * Requirements: 5.1, 5.2
 *
 * @param {string} socketId
 * @returns {object} updated room
 */
export function unoCall(socketId) {
  const room = getPlayerRoom(socketId);

  room.players = room.players.map(p => {
    if (p.id !== socketId) return p;
    return { ...p, unoCalled: true };
  });

  // Also update in gameState if game is in progress
  if (room.gameState) {
    room.gameState = {
      ...room.gameState,
      players: room.gameState.players.map(p => {
        if (p.id !== socketId) return p;
        return { ...p, unoCalled: true };
      }),
      updatedAt: Date.now(),
    };
  }

  return room;
}

// ─── Task 8.8: challengeUno ───────────────────────────────────────────────────

/**
 * Challenges a player's UNO call.
 * Requirements: 5.3, 5.4
 *
 * @param {string} socketId - the challenger
 * @param {string} targetPlayerId - the player being challenged
 * @returns {{ room: object, penalized: boolean }}
 */
export async function challengeUno(socketId, targetPlayerId) {
  const room = getPlayerRoom(socketId);
  const gameState = room.gameState;

  const targetPlayer = gameState
    ? gameState.players.find(p => p.id === targetPlayerId)
    : room.players.find(p => p.id === targetPlayerId);

  if (!targetPlayer) {
    throw { type: 'action_error', message: 'Player not found' };
  }

  const hand = targetPlayer.hand ?? [];

  if (hand.length === 1 && !targetPlayer.unoCalled) {
    // Penalize: draw 2 cards
    let newGameState = room.gameState;
    if (newGameState) {
      // Draw 2 cards for the target player from the draw pile
      const drawPile = [...newGameState.drawPile];
      const drawn = drawPile.splice(0, 2);

      newGameState = {
        ...newGameState,
        drawPile,
        players: newGameState.players.map(p => {
          if (p.id !== targetPlayerId) return p;
          return { ...p, hand: [...p.hand, ...drawn] };
        }),
        updatedAt: Date.now(),
      };

      room.gameState = newGameState;
      room.players = newGameState.players;
    } else {
      // No active game state — penalize in room.players
      room.players = room.players.map(p => {
        if (p.id !== targetPlayerId) return p;
        return { ...p, hand: [...(p.hand ?? []), ...Array(2).fill({ id: 'penalty', color: 'red', value: '0' })] };
      });
    }

    await persistRoom(room);
    return { room, penalized: true };
  }

  if (targetPlayer.unoCalled) {
    throw { type: 'action_error', message: 'UNO was called correctly' };
  }

  // Target has more than 1 card — challenge is invalid but no penalty
  throw { type: 'action_error', message: 'UNO was called correctly' };
}

// ─── Task 8.16: handleDisconnect ──────────────────────────────────────────────

/**
 * Marks a player as disconnected, starts a 60s removal timer and a 15s auto-draw
 * timer if it is their turn.
 * Requirements: 8.1, 8.3, 8.4
 *
 * @param {string} socketId
 * @returns {{ room: object|null }}
 */
export function handleDisconnect(socketId) {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) return { room: null };

  const room = rooms.get(roomCode);
  if (!room) return { room: null };

  const playerIndex = room.players.findIndex(p => p.id === socketId);
  if (playerIndex === -1) return { room: null };

  const now = Date.now();

  // Mark player as disconnected
  room.players[playerIndex] = {
    ...room.players[playerIndex],
    isConnected: false,
    disconnectedAt: now,
  };

  // Also update in gameState if game is in progress
  if (room.gameState) {
    room.gameState = {
      ...room.gameState,
      players: room.gameState.players.map(p => {
        if (p.id !== socketId) return p;
        return { ...p, isConnected: false, disconnectedAt: now };
      }),
      updatedAt: now,
    };

    // Start 15s auto-draw timer if it's the disconnected player's turn
    const currentPlayer = room.gameState.players[room.gameState.currentTurnIndex];
    if (currentPlayer && currentPlayer.id === socketId) {
      const autoDrawTimer = setTimeout(async () => {
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom || !currentRoom.gameState) return;
        const cp = currentRoom.gameState.players[currentRoom.gameState.currentTurnIndex];
        if (!cp || cp.id !== socketId || cp.isConnected) return;
        // Auto-draw on behalf of disconnected player
        try {
          await drawCard(socketId);
        } catch (_) {
          // ignore errors during auto-draw
        }
      }, 15000);

      // Store timer reference on the player for cancellation on rejoin
      room.players[playerIndex] = {
        ...room.players[playerIndex],
        _autoDrawTimer: autoDrawTimer,
      };
    }
  }

  // Start 60s removal timer
  const removalTimer = setTimeout(async () => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom) return;
    const p = currentRoom.players.find(pl => pl.id === socketId);
    if (!p || p.isConnected) return; // already reconnected
    await leaveRoom(socketId);
  }, 60000);

  room.players[playerIndex] = {
    ...room.players[playerIndex],
    _removalTimer: removalTimer,
  };

  return { room };
}

// ─── Task 8.16: rejoinRoom ────────────────────────────────────────────────────

/**
 * Validates a reconnect token and restores the player's session.
 * Requirements: 8.2
 *
 * @param {string} newSocketId
 * @param {string} token
 * @returns {object} room
 */
export function rejoinRoom(newSocketId, token) {
  // Search all rooms for a player with this reconnect token
  for (const [roomCode, room] of rooms) {
    const playerIndex = room.players.findIndex(p => p.reconnectToken === token);
    if (playerIndex === -1) continue;

    const player = room.players[playerIndex];
    const oldSocketId = player.id;

    // Cancel pending timers
    if (player._removalTimer) {
      clearTimeout(player._removalTimer);
    }
    if (player._autoDrawTimer) {
      clearTimeout(player._autoDrawTimer);
    }

    // Update socket mapping
    socketToRoom.delete(oldSocketId);
    socketToRoom.set(newSocketId, roomCode);

    // Restore player session
    room.players[playerIndex] = {
      ...player,
      id: newSocketId,
      isConnected: true,
      disconnectedAt: null,
      _removalTimer: undefined,
      _autoDrawTimer: undefined,
    };

    // Update gameState players if game is in progress
    if (room.gameState) {
      room.gameState = {
        ...room.gameState,
        players: room.gameState.players.map(p => {
          if (p.id !== oldSocketId) return p;
          return {
            ...p,
            id: newSocketId,
            isConnected: true,
            disconnectedAt: null,
          };
        }),
        updatedAt: Date.now(),
      };
    }

    // Update hostId if the host reconnected
    if (room.hostId === oldSocketId) {
      room.hostId = newSocketId;
    }

    return room;
  }

  throw { type: 'room_error', message: 'Invalid reconnect token' };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { rooms, socketToRoom };
