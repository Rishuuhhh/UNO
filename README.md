# UNO Multiplayer

A real-time multiplayer UNO card game for 2–10 players, built with Node.js + Socket.IO on the backend and React + Tailwind CSS + Framer Motion on the frontend.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand, React Router |
| Backend | Node.js, Express, Socket.IO, Mongoose |
| Testing | Vitest, fast-check (property-based), React Testing Library |
| Database | MongoDB (optional — graceful fallback if not running) |

## Project Structure

```
uno/
├── backend/          # Node.js server
│   └── src/
│       ├── gameLogic/    # Pure game engine (engine.js, roomManager.js, serializer.js)
│       ├── socket/       # Socket.IO handler, rate limiter
│       └── server.js     # Entry point
└── frontend/         # React SPA
    └── src/
        ├── components/   # Card, GameBoard, ColorPicker, UnoButton, ChatPanel, …
        ├── pages/        # LobbyPage, GamePage
        ├── hooks/        # useSocket
        └── store/        # Zustand gameStore
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (optional — the server runs without it, persistence is skipped)

### Quick Start

**Option 1: Use the startup script (Recommended)**
```bash
./start-dev.sh
```

**Option 2: Manual startup**

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run

Start the backend:

```bash
cd backend
node src/server.js
```

Start the frontend (in a separate terminal):

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Troubleshooting Black Screen Issues

If you see a black screen when starting the game, check the following:

### 1. Check Browser Console
Open your browser's developer tools (F12) and look for error messages in the console.

### 2. Verify Backend Server is Running
Make sure the backend server is running on port 3001:
- Check terminal output for "Listening on port 3001"
- Visit http://localhost:3001/health - should return `{"status":"ok"}`

### 3. Check Network Connection
The frontend tries to connect to the backend via WebSocket. If you see connection errors:
- Ensure both servers are running
- Check if port 3001 is available
- Verify no firewall is blocking the connection

### 4. Common Issues and Solutions

**Black screen with no errors:**
- Backend server not running → Start with `cd backend && npm run dev`
- Port conflict → Check if port 3001 is in use

**"Connection Failed" message:**
- Backend server not accessible → Verify server is running and accessible
- Wrong server URL → Check VITE_SERVER_URL environment variable

**Loading screen stuck:**
- Network timeout → Check internet connection and server status
- CORS issues → Verify backend CORS configuration

**Canvas/WebGL errors:**
- Browser compatibility → Try a different browser
- Hardware acceleration disabled → Enable in browser settings

### 5. Debug Mode
The app now includes detailed logging. Check the browser console for:
- "Main.jsx loading..."
- "App component rendering..."
- "LobbyPage rendering..."
- Socket connection status messages

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend HTTP port |
| `MONGODB_URI` | `mongodb://localhost:27017/uno` | MongoDB connection string |
| `REDIS_URL` | — | Optional Redis pub/sub for horizontal scaling |
| `VITE_SERVER_URL` | `http://localhost:3001` | Backend URL used by the frontend |

## Running Tests

```bash
# Backend (180 tests — unit, property-based, integration)
cd backend && npm test

# Frontend (73 tests — component, store, integration)
cd frontend && npm test
```

## Features

- Create or join a room with a 6-character code
- Full UNO ruleset: Skip, Reverse, Draw 2, Wild, Wild Draw 4
- Real-time state sync via Socket.IO (server-authoritative)
- Card visibility isolation — you only see your own hand
- UNO call & challenge mechanic
- In-game chat with rate limiting
- Reconnection support (60-second grace window)
- Responsive layout: arc layout on desktop, bottom-deck on mobile
- Framer Motion card animations
