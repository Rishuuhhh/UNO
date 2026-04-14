import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Per-player color palette ─────────────────────────────────────────────────
const PALETTES = [
  { grad: ['#ef4444', '#ec4899'], glow: 'rgba(239,68,68,0.8)',   ring: '#ef4444' },
  { grad: ['#3b82f6', '#06b6d4'], glow: 'rgba(59,130,246,0.8)',  ring: '#3b82f6' },
  { grad: ['#22c55e', '#10b981'], glow: 'rgba(34,197,94,0.8)',   ring: '#22c55e' },
  { grad: ['#eab308', '#f97316'], glow: 'rgba(234,179,8,0.8)',   ring: '#eab308' },
  { grad: ['#a855f7', '#8b5cf6'], glow: 'rgba(168,85,247,0.8)',  ring: '#a855f7' },
  { grad: ['#f43f5e', '#fb7185'], glow: 'rgba(244,63,94,0.8)',   ring: '#f43f5e' },
  { grad: ['#14b8a6', '#06b6d4'], glow: 'rgba(20,184,166,0.8)',  ring: '#14b8a6' },
  { grad: ['#f59e0b', '#fbbf24'], glow: 'rgba(245,158,11,0.8)',  ring: '#f59e0b' },
];

// ─── Animated SVG ring ────────────────────────────────────────────────────────
function ActiveRing({ color, size }) {
  return (
    <motion.svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.3 }}
    >
      {/* Outer glow ring */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={size / 2 - 2}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="6 4"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
        opacity={0.9}
      />
      {/* Inner solid ring */}
      <circle
        cx={size / 2} cy={size / 2} r={size / 2 - 5}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.4}
      />
    </motion.svg>
  );
}

// ─── Mini face-down card fan ──────────────────────────────────────────────────
function CardFan({ count }) {
  const visible = Math.min(count, 5);
  const extra   = count - visible;

  return (
    <div style={{ position: 'relative', height: 28, width: Math.max(visible * 10 + 14, 28) }}>
      {Array.from({ length: visible }).map((_, i) => {
        const mid   = (visible - 1) / 2;
        const angle = visible > 1 ? ((i - mid) / mid) * 18 : 0;
        const yOff  = Math.abs(i - mid) * 1.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * 10,
              bottom: yOff,
              width: 16, height: 24,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)',
              border: '1px solid rgba(150,130,255,0.35)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'bottom center',
              zIndex: i,
            }}
          >
            {/* Mini UNO back pattern */}
            <div style={{
              position: 'absolute', inset: 1, borderRadius: 3,
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
            }} />
          </div>
        );
      })}
      {extra > 0 && (
        <span style={{
          position: 'absolute', right: -14, bottom: 0,
          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
        }}>+{extra}</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OpponentSlot({ player, isCurrentTurn = false, index = 0 }) {
  if (!player) return null;

  const palette  = PALETTES[index % PALETTES.length];
  const initials = (player.displayName ?? '??').slice(0, 2).toUpperCase();
  const count    = player.handCount ?? 0;
  const isUno    = count === 1;
  const AVATAR   = 44;
  const RING     = AVATAR + 14;

  return (
    <motion.div
      data-testid="opponent-slot"
      layout
      animate={isCurrentTurn
        ? { scale: 1.08, y: -2 }
        : { scale: 1,    y: 0  }
      }
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '10px 12px 8px',
        borderRadius: 16,
        background: isCurrentTurn
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        border: isCurrentTurn
          ? `1px solid ${palette.ring}55`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isCurrentTurn
          ? `0 0 20px ${palette.glow.replace('0.8', '0.25')}, 0 4px 16px rgba(0,0,0,0.4)`
          : '0 2px 8px rgba(0,0,0,0.3)',
        minWidth: 72,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Turn arrow bouncing above */}
      <AnimatePresence>
        {isCurrentTurn && (
          <motion.div
            key="arrow"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ y: { repeat: Infinity, duration: 0.7, ease: 'easeInOut' }, opacity: { duration: 0.2 } }}
            style={{
              position: 'absolute', top: -18, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 12, color: palette.ring,
              filter: `drop-shadow(0 0 4px ${palette.ring})`,
            }}
          >
            ▼
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar + ring container */}
      <div style={{ position: 'relative', width: RING, height: RING, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Animated SVG ring when active */}
        <AnimatePresence>
          {isCurrentTurn && (
            <ActiveRing key="ring" color={palette.ring} size={RING} />
          )}
        </AnimatePresence>

        {/* Glow behind avatar */}
        {isCurrentTurn && (
          <div style={{
            position: 'absolute',
            width: AVATAR, height: AVATAR,
            borderRadius: '50%',
            background: palette.glow.replace('0.8', '0.35'),
            filter: 'blur(8px)',
          }} />
        )}

        {/* Avatar circle */}
        <motion.div
          animate={isCurrentTurn
            ? { boxShadow: [`0 0 0px ${palette.ring}00`, `0 0 16px ${palette.ring}cc`, `0 0 0px ${palette.ring}00`] }
            : { boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }
          }
          transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.8 }}
          style={{
            width: AVATAR, height: AVATAR,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#fff',
            letterSpacing: 0.5,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            position: 'relative', zIndex: 1,
            flexShrink: 0,
          }}
        >
          {initials}
        </motion.div>
      </div>

      {/* Player name */}
      <motion.span
        animate={{ color: isCurrentTurn ? '#fff' : 'rgba(255,255,255,0.55)' }}
        transition={{ duration: 0.3 }}
        style={{
          fontSize: 11, fontWeight: 700,
          maxWidth: 80, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: 0.2,
        }}
      >
        {player.displayName}
      </motion.span>

      {/* Card fan */}
      <CardFan count={count} />

      {/* Card count badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isUno ? 'uno' : 'count'}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 10, fontWeight: 800,
            background: isUno
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'rgba(255,255,255,0.08)',
            color: isUno ? '#fff' : 'rgba(255,255,255,0.45)',
            boxShadow: isUno ? '0 0 12px rgba(239,68,68,0.6)' : 'none',
            letterSpacing: 0.3,
          }}
        >
          {isUno ? '🔴 UNO!' : `${count} cards`}
        </motion.div>
      </AnimatePresence>

      {/* Disconnected overlay */}
      {player.isConnected === false && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Away</span>
        </div>
      )}
    </motion.div>
  );
}
