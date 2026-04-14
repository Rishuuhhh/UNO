import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

const COLOR_GLOW = {
  red:    '0 0 38px rgba(239,68,68,0.8),  0 0 75px rgba(239,68,68,0.28)',
  blue:   '0 0 38px rgba(59,130,246,0.8), 0 0 75px rgba(59,130,246,0.28)',
  green:  '0 0 38px rgba(34,197,94,0.8),  0 0 75px rgba(34,197,94,0.28)',
  yellow: '0 0 38px rgba(234,179,8,0.85), 0 0 75px rgba(234,179,8,0.32)',
  wild:   '0 0 38px rgba(168,85,247,0.8), 0 0 75px rgba(168,85,247,0.28)',
};

// Card lands with a physical arc: comes from above-right, rotates, settles
const LAND_TRANSITION = {
  type: 'spring', stiffness: 400, damping: 26, mass: 0.9,
};

export default function DiscardPile({ topCard }) {
  const glow = topCard ? (COLOR_GLOW[topCard.color] ?? COLOR_GLOW.wild) : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} data-testid="discard-pile">
      <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600 }}>
        Discard
      </span>

      <div style={{ position: 'relative', width: 64, height: 96 }}>
        {/* Drop shadow layers */}
        <div style={{ position: 'absolute', top: 5, left: 4, width: 64, height: 96, borderRadius: 12, background: 'rgba(0,0,0,0.45)', filter: 'blur(5px)' }} />
        <div style={{ position: 'absolute', top: 2, left: 2, width: 64, height: 96, borderRadius: 12, background: 'rgba(0,0,0,0.28)', filter: 'blur(2px)' }} />

        {/* Color glow ring — transitions smoothly between colors */}
        <motion.div
          animate={{ boxShadow: glow }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'absolute', inset: -5, borderRadius: 17, pointerEvents: 'none' }}
        />

        <AnimatePresence mode="wait">
          {topCard ? (
            <motion.div
              key={topCard.id}
              style={{ position: 'absolute', top: 0, left: 0 }}
              // Flies in from upper-right like a thrown card
              initial={{ x: 40, y: -50, opacity: 0, rotate: 25, scale: 0.75 }}
              animate={{ x: 0,  y: 0,   opacity: 1, rotate: 0,  scale: 1   }}
              exit={{   x: -20, y: 20,  opacity: 0, rotate: -12, scale: 0.8,
                transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
              transition={LAND_TRANSITION}
            >
              <Card card={topCard} playable={false} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                width: 64, height: 96, borderRadius: 12,
                border: '2px dashed rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>Empty</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
