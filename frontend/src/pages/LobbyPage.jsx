import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';

const SPRING = { type: 'spring', stiffness: 360, damping: 26, mass: 0.9 };
const EASE   = [0.25, 0.46, 0.45, 0.94];

function LobbyPage() {
  const navigate = useNavigate();
  const { socket, connected, reconnecting, connectionError } = useSocket(navigate);
  const { roomCode, players, error } = useGameStore();

  const [createName, setCreateName] = useState('');
  const [joinName,   setJoinName]   = useState('');
  const [joinCode,   setJoinCode]   = useState('');

  const myId    = socket?.id;
  const isHost  = players.length > 0 && players[0]?.id === myId;
  const canStart = players.length >= 2;

  // Show connection error screen
  if (connectionError && !connected) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f23',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, color: '#fff',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', maxWidth: 500 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20, color: '#ef4444' }}>
            Connection Failed
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
            Unable to connect to the game server
          </p>
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 12, padding: 16, marginBottom: 20,
            color: 'rgba(252,165,165,0.9)', fontSize: 14,
          }}>
            {connectionError}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 20 }}>
            Make sure the backend server is running on: {import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6', color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
            }}
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    );
  }

  // Show loading screen while socket is connecting
  if (!connected && !reconnecting) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f23',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, color: '#fff',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
            <span style={{ color: '#ef4444' }}>U</span>
            <span style={{ color: '#3b82f6' }}>N</span>
            <span style={{ color: '#eab308' }}>O</span>
          </h1>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Connecting to server...</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 }}>
            {import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}
          </p>
        </motion.div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  const handleCreate = (e) => {
    e.preventDefault();
    if (createName.trim() && socket) socket.emit('create_room', { displayName: createName.trim() });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinName.trim() && joinCode.trim() && socket)
      socket.emit('join_room', { roomCode: joinCode.trim().toUpperCase(), displayName: joinName.trim() });
  };

  const handleStart = () => {
    if (socket && isHost && canStart) socket.emit('start_game', { roomCode });
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, padding: '10px 16px',
    color: '#fff', fontSize: 14, outline: 'none', width: '100%',
    transition: 'border-color 0.18s ease',
  };

  // ── Waiting room ────────────────────────────────────────────────────────────
  if (roomCode) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f23',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={SPRING}
          style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24, padding: '36px 32px',
            width: '100%', maxWidth: 440,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)', color: '#fff',
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Lobby</h1>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Room Code</p>
            <motion.p
              data-testid="room-code"
              animate={{ textShadow: ['0 0 10px rgba(234,179,8,0.4)', '0 0 22px rgba(234,179,8,0.8)', '0 0 10px rgba(234,179,8,0.4)'] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ fontSize: 40, fontWeight: 900, letterSpacing: 10, color: '#eab308', fontFamily: 'monospace' }}
            >
              {roomCode}
            </motion.p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: EASE }}
                style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                  color: 'rgba(252,165,165,0.9)', fontSize: 13,
                }}
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginBottom: 24 }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
              Players ({players.length}/10)
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="player-list">
              <AnimatePresence>
                {players.map((player, index) => (
                  <motion.li
                    key={player.id}
                    data-testid={`player-item-${player.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0   }}
                    exit={{    opacity: 0, x:  20  }}
                    transition={{ ...SPRING, delay: index * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '10px 14px',
                    }}
                  >
                    {index === 0 && (
                      <span data-testid="host-indicator" aria-label="Host" style={{ color: '#eab308', fontSize: 16 }}>★</span>
                    )}
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{player.displayName}</span>
                    {player.id === myId && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>(you)</span>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {isHost ? (
            <motion.button
              onClick={handleStart}
              disabled={!canStart}
              data-testid="start-game-button"
              whileHover={canStart ? { scale: 1.03, y: -2, transition: { type: 'spring', stiffness: 500, damping: 20 } } : {}}
              whileTap={canStart ? { scale: 0.95, transition: { duration: 0.1 } } : {}}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14,
                background: canStart ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(34,197,94,0.2)',
                color: canStart ? '#fff' : 'rgba(255,255,255,0.35)',
                fontWeight: 800, fontSize: 16, border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
                boxShadow: canStart ? '0 4px 20px rgba(34,197,94,0.4)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              {canStart ? 'Start Game' : 'Waiting for players…'}
            </motion.button>
          ) : (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Waiting for the host to start…
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Create / Join ───────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f23',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16, gap: 20, color: '#fff',
    }}>
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}
      >
        <span style={{ color: '#ef4444' }}>U</span>
        <span style={{ color: '#3b82f6' }}>N</span>
        <span style={{ color: '#eab308' }}>O</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, fontSize: 24, marginLeft: 12 }}>Multiplayer</span>
      </motion.h1>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 10, padding: '10px 16px', width: '100%', maxWidth: 440,
              color: 'rgba(252,165,165,0.9)', fontSize: 13,
            }}
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ ...SPRING, delay: 0.08 }}
        style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          padding: '24px 28px', width: '100%', maxWidth: 440,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.85)' }}>Create a Room</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text" placeholder="Your display name"
            value={createName} onChange={(e) => setCreateName(e.target.value)}
            maxLength={20} required aria-label="Display name for creating a room"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(234,179,8,0.5)'}
            onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <motion.button
            type="submit" disabled={!createName.trim()}
            whileHover={createName.trim() ? { scale: 1.03, y: -2, transition: { type: 'spring', stiffness: 500, damping: 20 } } : {}}
            whileTap={createName.trim() ? { scale: 0.95, transition: { duration: 0.1 } } : {}}
            style={{
              background: createName.trim() ? 'linear-gradient(135deg,#eab308,#ca8a04)' : 'rgba(234,179,8,0.2)',
              color: createName.trim() ? '#1a0f00' : 'rgba(255,255,255,0.3)',
              fontWeight: 800, fontSize: 14, padding: '11px 0', borderRadius: 12,
              border: 'none', cursor: createName.trim() ? 'pointer' : 'not-allowed',
              boxShadow: createName.trim() ? '0 4px 16px rgba(234,179,8,0.35)' : 'none',
              transition: 'all 0.22s ease',
            }}
          >
            Create Room
          </motion.button>
        </form>
      </motion.div>

      {/* Join Room */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ ...SPRING, delay: 0.14 }}
        style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          padding: '24px 28px', width: '100%', maxWidth: 440,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.85)' }}>Join a Room</h2>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text" placeholder="Room code"
            value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6} required aria-label="Room code"
            style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 4 }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
            onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <input
            type="text" placeholder="Your display name"
            value={joinName} onChange={(e) => setJoinName(e.target.value)}
            maxLength={20} required aria-label="Display name for joining a room"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
            onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <motion.button
            type="submit" disabled={!joinName.trim() || !joinCode.trim()}
            whileHover={joinName.trim() && joinCode.trim() ? { scale: 1.03, y: -2, transition: { type: 'spring', stiffness: 500, damping: 20 } } : {}}
            whileTap={joinName.trim() && joinCode.trim() ? { scale: 0.95, transition: { duration: 0.1 } } : {}}
            style={{
              background: joinName.trim() && joinCode.trim() ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(59,130,246,0.2)',
              color: joinName.trim() && joinCode.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
              fontWeight: 800, fontSize: 14, padding: '11px 0', borderRadius: 12,
              border: 'none', cursor: joinName.trim() && joinCode.trim() ? 'pointer' : 'not-allowed',
              boxShadow: joinName.trim() && joinCode.trim() ? '0 4px 16px rgba(59,130,246,0.35)' : 'none',
              transition: 'all 0.22s ease',
            }}
          >
            Join Room
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default LobbyPage;
