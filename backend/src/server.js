/**
 * Server entry point.
 * Initializes Express, Socket.IO, MongoDB, and starts the HTTP server.
 * Requirements: 7.5, 1.9
 */

import { createServer } from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import { registerSocketHandlers } from './socket/socketHandler.js';

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── HTTP server ──────────────────────────────────────────────────────────────

const server = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') ?? []
      : '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

// ─── MongoDB ─────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/uno';

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[MongoDB] Connected to ${MONGODB_URI}`);
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    // Non-fatal: server continues without persistence
  }
}

// ─── Redis (optional) ────────────────────────────────────────────────────────

async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('[Redis] REDIS_URL not set — skipping Redis pub/sub');
    return;
  }

  try {
    // Dynamically import ioredis only if REDIS_URL is set
    const { default: Redis } = await import('ioredis');
    const publisher = new Redis(redisUrl);
    const subscriber = new Redis(redisUrl);

    publisher.on('connect', () => console.log('[Redis] Publisher connected'));
    subscriber.on('connect', () => console.log('[Redis] Subscriber connected'));
    publisher.on('error', (err) => console.error('[Redis] Publisher error:', err.message));
    subscriber.on('error', (err) => console.error('[Redis] Subscriber error:', err.message));

    // Subscribe to game state broadcast channel
    await subscriber.subscribe('game_state');
    subscriber.on('message', (channel, message) => {
      if (channel === 'game_state') {
        try {
          const { roomCode, event, payload } = JSON.parse(message);
          io.to(roomCode).emit(event, payload);
        } catch (err) {
          console.error('[Redis] Failed to parse message:', err.message);
        }
      }
    });

    console.log('[Redis] pub/sub connected');
  } catch (err) {
    console.error('[Redis] Failed to connect:', err.message);
  }
}

// ─── Start server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function start() {
  await connectMongoDB();
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
  });
}

// Only start if this is the main module (not imported for testing)
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  start().catch((err) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
}

export { app, server, io };
