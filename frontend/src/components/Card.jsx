import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Physics presets ──────────────────────────────────────────────────────────
const SPRING_SNAPPY  = { type: 'spring', stiffness: 480, damping: 28, mass: 0.8 };
const SPRING_BOUNCY  = { type: 'spring', stiffness: 340, damping: 20, mass: 1 };
const SPRING_GENTLE  = { type: 'spring', stiffness: 220, damping: 26, mass: 1 };
const EASE_OUT_BACK  = [0.34, 1.56, 0.64, 1];   // overshoot then settle
const EASE_PHYSICAL  = [0.25, 0.46, 0.45, 0.94]; // natural deceleration

// ─── Color config ─────────────────────────────────────────────────────────────
const COLOR_CONFIG = {
  red: {
    outer:   'from-red-600 via-red-500 to-red-700',
    glow:    '0 0 22px rgba(239,68,68,0.9), 0 0 45px rgba(239,68,68,0.4), 0 8px 28px rgba(0,0,0,0.65)',
    dimGlow: '0 4px 14px rgba(0,0,0,0.55)',
    border:  'rgba(255,150,150,0.45)',
    shine:   'rgba(255,200,200,0.2)',
    symbolColor: '#7f1d1d',
  },
  blue: {
    outer:   'from-blue-600 via-blue-500 to-blue-700',
    glow:    '0 0 22px rgba(59,130,246,0.9), 0 0 45px rgba(59,130,246,0.4), 0 8px 28px rgba(0,0,0,0.65)',
    dimGlow: '0 4px 14px rgba(0,0,0,0.55)',
    border:  'rgba(150,180,255,0.45)',
    shine:   'rgba(180,210,255,0.2)',
    symbolColor: '#1e3a8a',
  },
  green: {
    outer:   'from-green-600 via-green-500 to-green-700',
    glow:    '0 0 22px rgba(34,197,94,0.9), 0 0 45px rgba(34,197,94,0.4), 0 8px 28px rgba(0,0,0,0.65)',
    dimGlow: '0 4px 14px rgba(0,0,0,0.55)',
    border:  'rgba(150,255,180,0.45)',
    shine:   'rgba(180,255,200,0.2)',
    symbolColor: '#14532d',
  },
  yellow: {
    outer:   'from-yellow-400 via-yellow-300 to-yellow-500',
    glow:    '0 0 22px rgba(234,179,8,0.95), 0 0 45px rgba(234,179,8,0.45), 0 8px 28px rgba(0,0,0,0.65)',
    dimGlow: '0 4px 14px rgba(0,0,0,0.55)',
    border:  'rgba(255,240,100,0.55)',
    shine:   'rgba(255,255,200,0.28)',
    symbolColor: '#7c4a00',
  },
  wild: {
    outer:   'from-gray-900 via-gray-800 to-gray-900',
    glow:    '0 0 22px rgba(168,85,247,0.85), 0 0 45px rgba(168,85,247,0.35), 0 8px 28px rgba(0,0,0,0.65)',
    dimGlow: '0 4px 14px rgba(0,0,0,0.55)',
    border:  'rgba(200,150,255,0.45)',
    shine:   'rgba(200,180,255,0.18)',
    symbolColor: '#fff',
  },
};

const VALUE_DISPLAY = {
  skip:    { symbol: '⊘' },
  reverse: { symbol: '↺' },
  draw2:   { symbol: '+2' },
  wild:    { symbol: '★' },
  wild4:   { symbol: '+4' },
};

// ─── Card back ────────────────────────────────────────────────────────────────
function CardBack({ small }) {
  const W = small ? 40 : 64;
  const H = small ? 56 : 96;
  return (
    <div style={{
      width: W, height: H, borderRadius: small ? 8 : 12,
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      boxShadow: '0 6px 22px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.1)',
      border: '1.5px solid rgba(150,130,255,0.3)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: small ? 3 : 4, borderRadius: small ? 5 : 8,
        border: '1.5px solid rgba(255,255,255,0.12)',
        backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontWeight: 900, fontSize: small ? 10 : 16, color: '#fff',
          textShadow: '0 0 12px rgba(200,180,255,0.9)',
          letterSpacing: 1, transform: 'rotate(-15deg)',
        }}>UNO</span>
      </div>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: small ? 8 : 12,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Wild rainbow oval ────────────────────────────────────────────────────────
function WildOval({ small }) {
  const s = small ? 26 : 42;
  return (
    <div style={{
      width: s, height: s * 1.4, borderRadius: '50%',
      background: 'conic-gradient(from 0deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6,#ef4444)',
      boxShadow: '0 0 14px rgba(255,255,255,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: s * 0.55, height: s * 0.55 * 1.4, borderRadius: '50%',
        background: '#111',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: small ? 8 : 13 }}>★</span>
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function Card({
  card, playable = false, onClick,
  draggable = false, animate = false,
  small = false, faceDown = false,
}) {
  if (!card) return null;

  const cfg  = COLOR_CONFIG[card.color] ?? COLOR_CONFIG.wild;
  const vd   = VALUE_DISPLAY[card.value] ?? { symbol: card.value };
  const isWild   = card.color === 'wild';
  const W = small ? 40 : 64;
  const H = small ? 56 : 96;
  const R = small ? 8 : 12;
  const cFont = small ? 8 : 11;
  const mFont = small ? 13 : 22;

  const cardFront = (
    <div
      style={{
        width: W, height: H, borderRadius: R,
        position: 'relative', overflow: 'hidden',
        cursor: playable ? 'pointer' : 'default',
        opacity: !playable && !faceDown ? 0.5 : 1,
        boxShadow: playable ? cfg.glow : cfg.dimGlow,
        border: `1.5px solid ${cfg.border}`,
        userSelect: 'none', flexShrink: 0,
        transition: 'opacity 0.2s ease, box-shadow 0.25s ease',
      }}
      data-testid="card"
      data-card-id={card.id}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.outer}`} />

      {/* Noise texture */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundSize: 'cover', mixBlendMode: 'overlay',
      }} />

      {/* Inner inset border */}
      <div style={{
        position: 'absolute', inset: small ? 3 : 4, borderRadius: R - 3,
        border: '1.5px solid rgba(255,255,255,0.18)', pointerEvents: 'none',
      }} />

      {/* Center symbol */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isWild ? <WildOval small={small} /> : (
          <div style={{
            width: W * 0.62, height: H * 0.58, borderRadius: '50%',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.68))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-25deg)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}>
            <span style={{
              transform: 'rotate(25deg)', fontSize: mFont,
              fontWeight: 900, color: cfg.symbolColor,
              textShadow: '0 1px 2px rgba(0,0,0,0.18)',
              lineHeight: 1, letterSpacing: -0.5,
            }}>{vd.symbol}</span>
          </div>
        )}
      </div>

      {/* Corner labels */}
      {['top', 'bottom'].map((pos) => (
        <div key={pos} style={{
          position: 'absolute',
          ...(pos === 'top' ? { top: small ? 3 : 5, left: small ? 4 : 6 } : { bottom: small ? 3 : 5, right: small ? 4 : 6, transform: 'rotate(180deg)' }),
        }}>
          <span style={{ fontSize: cFont, fontWeight: 900, color: card.color === 'yellow' ? '#7c4a00' : '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)', lineHeight: 1 }}>
            {vd.symbol}
          </span>
        </div>
      ))}

      {/* Specular shine */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: R,
        background: `linear-gradient(135deg, ${cfg.shine} 0%, transparent 52%)`,
        pointerEvents: 'none',
      }} />

      {/* Playable pulse ring */}
      {playable && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: R + 2,
          border: '2px solid rgba(255,255,255,0.65)',
          pointerEvents: 'none',
          animation: 'playable-ring 1.8s ease-in-out infinite',
        }} />
      )}
    </div>
  );

  return (
    <motion.div
      style={{ display: 'inline-block', flexShrink: 0 }}
      onClick={playable && onClick ? () => onClick(card) : undefined}
      draggable={draggable}
      onDragStart={draggable ? (e) => e.dataTransfer.setData('cardId', card.id) : undefined}
      // Entrance: arc in from below with slight rotation
      initial={animate ? { y: 80, opacity: 0, scale: 0.6, rotate: -12 } : false}
      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
      transition={animate ? { ...SPRING_BOUNCY, delay: 0 } : SPRING_GENTLE}
      // Hover: lift + slight tilt, feels physical
      whileHover={playable ? {
        y: -20, scale: 1.14, rotate: 4,
        transition: { ...SPRING_SNAPPY },
      } : {}}
      // Tap: compress + counter-rotate like pressing a real card
      whileTap={playable ? {
        scale: 0.88, rotate: -4, y: -4,
        transition: { duration: 0.1, ease: EASE_PHYSICAL },
      } : {}}
    >
      <AnimatePresence mode="wait" initial={false}>
        {faceDown ? (
          <motion.div
            key="back"
            initial={{ rotateY: 90, scale: 0.95 }}
            animate={{ rotateY: 0, scale: 1 }}
            exit={{ rotateY: -90, scale: 0.95 }}
            transition={{ duration: 0.22, ease: EASE_PHYSICAL }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <CardBack small={small} />
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ rotateY: -90, scale: 0.95 }}
            animate={{ rotateY: 0, scale: 1 }}
            exit={{ rotateY: 90, scale: 0.95 }}
            transition={{ duration: 0.22, ease: EASE_PHYSICAL }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {cardFront}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
