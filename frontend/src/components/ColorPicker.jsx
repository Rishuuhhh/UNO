import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  { name: 'red',    label: 'Red',    bg: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.7)'   },
  { name: 'blue',   label: 'Blue',   bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', glow: 'rgba(59,130,246,0.7)'  },
  { name: 'green',  label: 'Green',  bg: 'linear-gradient(135deg,#22c55e,#16a34a)', glow: 'rgba(34,197,94,0.7)'   },
  { name: 'yellow', label: 'Yellow', bg: 'linear-gradient(135deg,#eab308,#ca8a04)', glow: 'rgba(234,179,8,0.7)'   },
];

const EASE_OUT_BACK = [0.34, 1.56, 0.64, 1];

export default function ColorPicker({ onColorSelect, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0)' }}
      initial={{ backdropFilter: 'blur(0px)', background: 'rgba(0,0,0,0)' }}
      animate={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.55)' }}
      exit={{ backdropFilter: 'blur(0px)', background: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClose}
      data-testid="color-picker-overlay"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        data-testid="color-picker"
        initial={{ scale: 0.7, opacity: 0, y: 30, rotate: -4 }}
        animate={{ scale: 1,   opacity: 1, y: 0,  rotate: 0  }}
        exit={{    scale: 0.75, opacity: 0, y: 20, rotate: 3,
          transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: 'spring', stiffness: 420, damping: 24, mass: 0.85 }}
        style={{
          background: 'rgba(15,15,25,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: '28px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
          Choose a color
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {COLORS.map(({ name, label, bg, glow }, i) => (
            <motion.button
              key={name}
              onClick={() => onColorSelect(name)}
              data-testid={`color-option-${name}`}
              // Stagger entrance
              initial={{ scale: 0, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 460, damping: 22, delay: i * 0.055 }}
              whileHover={{
                scale: 1.1, rotate: 3, y: -4,
                boxShadow: `0 0 24px ${glow}, 0 8px 20px rgba(0,0,0,0.4)`,
                transition: { type: 'spring', stiffness: 500, damping: 18 },
              }}
              whileTap={{ scale: 0.88, rotate: -3, transition: { duration: 0.1 } }}
              style={{
                width: 96, height: 96, borderRadius: 18,
                background: bg,
                border: '1.5px solid rgba(255,255,255,0.2)',
                boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
                color: '#fff', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', outline: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
