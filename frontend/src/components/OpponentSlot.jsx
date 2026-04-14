import React from 'react';

const PALETTES = [
  { grad: ['#ef4444', '#ec4899'], ring: '#ef4444' },
  { grad: ['#3b82f6', '#06b6d4'], ring: '#3b82f6' },
  { grad: ['#22c55e', '#10b981'], ring: '#22c55e' },
  { grad: ['#eab308', '#f97316'], ring: '#eab308' },
  { grad: ['#a855f7', '#8b5cf6'], ring: '#a855f7' },
  { grad: ['#f43f5e', '#fb7185'], ring: '#f43f5e' },
  { grad: ['#14b8a6', '#06b6d4'], ring: '#14b8a6' },
  { grad: ['#f59e0b', '#fbbf24'], ring: '#f59e0b' },
];

function CardFan({ count }) {
  const visible = Math.min(count, 5);
  const extra   = count - visible;

  return (
    <div style={{ position: 'relative', height: 26, width: Math.max(visible * 9 + 12, 24) }}>
      {Array.from({ length: visible }).map((_, i) => {
        const mid   = (visible - 1) / 2;
        const angle = visible > 1 ? ((i - mid) / Math.max(mid, 1)) * 16 : 0;
        const yOff  = Math.abs(i - mid) * 1.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * 9,
              bottom: yOff,
              width: 14, height: 22,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)',
              border: '1px solid rgba(150,130,255,0.3)',
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'bottom center',
              zIndex: i,
            }}
          />
        );
      })}
      {extra > 0 && (
        <span style={{
          position: 'absolute', right: -12, bottom: 0,
          fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        }}>+{extra}</span>
      )}
    </div>
  );
}

export default function OpponentSlot({ player, isCurrentTurn = false, index = 0 }) {
  if (!player) return null;

  const palette  = PALETTES[index % PALETTES.length];
  const initials = (player.displayName ?? '??').slice(0, 2).toUpperCase();
  const count    = player.handCount ?? 0;
  const isUno    = count === 1;
  const AVATAR   = 40;

  return (
    <div
      data-testid="opponent-slot"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 10px 6px',
        borderRadius: 14,
        background: isCurrentTurn ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
        border: isCurrentTurn
          ? `1px solid ${palette.ring}60`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isCurrentTurn
          ? `0 0 14px ${palette.ring}30, 0 4px 12px rgba(0,0,0,0.35)`
          : '0 2px 8px rgba(0,0,0,0.25)',
        minWidth: 68,
        cursor: 'default',
        userSelect: 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s, background 0.3s',
      }}
    >
      {/* Active turn dot */}
      {isCurrentTurn && (
        <div style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 6, height: 6,
          borderRadius: '50%',
          background: palette.ring,
          boxShadow: `0 0 6px ${palette.ring}`,
        }} />
      )}

      {/* Avatar */}
      <div
        style={{
          width: AVATAR, height: AVATAR,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: '#fff',
          letterSpacing: 0.5,
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          border: isCurrentTurn ? `2px solid ${palette.ring}` : '2px solid transparent',
          boxShadow: isCurrentTurn
            ? `0 0 10px ${palette.ring}50`
            : '0 2px 6px rgba(0,0,0,0.4)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Player name */}
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: isCurrentTurn ? '#fff' : 'rgba(255,255,255,0.5)',
        maxWidth: 72, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'color 0.3s',
      }}>
        {player.displayName}
      </span>

      {/* Card fan */}
      <CardFan count={count} />

      {/* Card count badge */}
      <div style={{
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 9, fontWeight: 800,
        background: isUno ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.07)',
        color: isUno ? '#fff' : 'rgba(255,255,255,0.4)',
        boxShadow: isUno ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
        letterSpacing: 0.3,
        transition: 'background 0.3s',
      }}>
        {isUno ? 'UNO!' : `${count} cards`}
      </div>

      {/* Disconnected overlay */}
      {player.isConnected === false && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Away</span>
        </div>
      )}
    </div>
  );
}
