# UNO Multiplayer

A real-time multiplayer UNO card game for 2–10 players, built with Node.js + Socket.IO on the backend and React + Tailwind CSS + Framer Motion on the frontend.

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Framer Motion** - Production-ready motion library for animations
- **Zustand** - Lightweight state management
- **Socket.IO Client** - Real-time communication
- **Web Audio API** - Procedural sound generation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.IO** - Real-time bidirectional event-based communication
- **Mongoose** - MongoDB object modeling (optional)
- **Vitest** - Fast unit testing framework

### Development & Testing
- **Vitest** - Unit and integration testing
- **fast-check** - Property-based testing
- **React Testing Library** - Component testing utilities
- **ESLint** - Code linting and formatting

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

- **Modern Professional UI** - Clean, responsive design with glassmorphism effects
- **Mobile-First Design** - Optimized for all devices with touch-friendly controls
- **Enhanced Sound System** - Procedural audio with volume control and mute options
- **Smooth Animations** - Consistent spring-based animations with reduced motion support
- **Real-time multiplayer gameplay** - Play with friends in real-time using WebSockets
- **Room-based lobbies** - Create or join game rooms with unique codes
- **Complete UNO rules** - All standard UNO cards and rules implemented
- **In-game chat** - Communicate with other players (desktop sidebar, mobile modal)
- **Settings panel** - Control sound, volume, and game preferences
- **Accessibility features** - Keyboard navigation, screen reader support, focus management
- **Responsive layout** - Adaptive UI for mobile, tablet, and desktop
- **Turn timer** - Visual countdown with audio warnings
- **Enhanced card animations** - Smooth card play, draw, and hand management
- **Professional color scheme** - Modern dark theme with accent colors

## UI/UX Improvements

### Mobile Optimizations
- **Touch-friendly controls** - Larger tap targets and gesture support
- **Responsive card sizing** - Cards scale appropriately for screen size
- **Mobile chat modal** - Full-screen chat interface for mobile devices
- **Optimized layouts** - Adaptive opponent arrangements and spacing
- **Safe area support** - Proper handling of notches and rounded corners

### Enhanced Animations
- **Consistent timing** - Unified animation system with spring physics
- **Performance optimized** - Reduced motion support and efficient rendering
- **Visual feedback** - Clear hover states, loading indicators, and transitions
- **Card interactions** - Smooth play, draw, and selection animations

### Sound System
- **Volume control** - Adjustable master volume with mute toggle
- **Audio debouncing** - Prevents overlapping sounds and audio clipping
- **Enhanced sound design** - Richer tones with harmonics and better timing
- **Accessibility** - Audio cues for game state changes and user actions

### Professional Design
- **Modern color palette** - Carefully chosen colors with proper contrast
- **Glassmorphism effects** - Subtle transparency and blur effects
- **Consistent spacing** - Unified design system with proper hierarchy
- **Typography** - Inter font family for better readability
