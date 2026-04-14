import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';

function LobbyPage() {
  const navigate = useNavigate();
  const { socket } = useSocket(navigate);
  const { roomCode, players, error } = useGameStore();

  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Determine if the current socket is the host (first player in list)
  const myId = socket?.id;
  const isHost = players.length > 0 && players[0]?.id === myId;
  const canStart = players.length >= 2;

  const handleCreate = (e) => {
    e.preventDefault();
    if (createName.trim() && socket) {
      socket.emit('create_room', { displayName: createName.trim() });
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinName.trim() && joinCode.trim() && socket) {
      socket.emit('join_room', {
        roomCode: joinCode.trim().toUpperCase(),
        displayName: joinName.trim(),
      });
    }
  };

  const handleStart = () => {
    if (socket && isHost && canStart) {
      socket.emit('start_game', { roomCode });
    }
  };

  // ── Waiting room ────────────────────────────────────────────────────────────
  if (roomCode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2">Lobby</h1>

          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Room Code</p>
            <p className="text-4xl font-mono font-bold tracking-widest text-yellow-400" data-testid="room-code">
              {roomCode}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">
              Players ({players.length}/10)
            </h2>
            <ul className="space-y-2" data-testid="player-list">
              {players.map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center gap-2 bg-gray-700 rounded-lg px-4 py-2"
                  data-testid={`player-item-${player.id}`}
                >
                  {index === 0 && (
                    <span
                      className="text-yellow-400 text-lg"
                      title="Host"
                      data-testid="host-indicator"
                      aria-label="Host"
                    >
                      ★
                    </span>
                  )}
                  <span className="font-medium">{player.displayName}</span>
                  {player.id === myId && (
                    <span className="ml-auto text-xs text-gray-400">(you)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!canStart}
              data-testid="start-game-button"
              className="w-full py-3 rounded-xl font-bold text-lg transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-green-600 hover:bg-green-500 disabled:bg-green-800"
            >
              {canStart ? 'Start Game' : 'Waiting for players…'}
            </button>
          )}

          {!isHost && (
            <p className="text-center text-gray-400 text-sm mt-2">
              Waiting for the host to start the game…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Join / Create forms ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-4xl font-bold">UNO Multiplayer</h1>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-lg p-3 w-full max-w-md text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Create Room */}
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Create a Room</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your display name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            maxLength={20}
            required
            aria-label="Display name for creating a room"
            className="bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={!createName.trim()}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed
              text-gray-900 font-bold py-2 rounded-lg transition-colors"
          >
            Create Room
          </button>
        </form>
      </div>

      {/* Join Room */}
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6}
            required
            aria-label="Room code"
            className="bg-gray-700 rounded-lg px-4 py-2 font-mono uppercase outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Your display name"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            maxLength={20}
            required
            aria-label="Display name for joining a room"
            className="bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!joinName.trim() || !joinCode.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white font-bold py-2 rounded-lg transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default LobbyPage;
