import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UnoButton({ visible, onUnoCall }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="uno-btn"
          onClick={onUnoCall}
          data-testid="uno-button"
          // Entrance: pop in from below with overshoot
          initial={{ scale: 0, opacity: 0, y: 30, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0,  rotate: 0   }}
          exit={{    scale: 0, opacity: 0, y: 20,  rotate: 10,
            transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
          transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.8 }}
          // Continuous pulse when visible
          whileInView={{ scale: [1, 1.07, 1] }}
          whileHover={{ scale: 1.12, rotate: 2, transition: { type: 'spring', stiffness: 500, damping: 18 } }}
          whileTap={{   scale: 0.88, rotate: -4, transition: { duration: 0.1 } }}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '14px 32px',
            borderRadius: 999,
            border: '2px solid rgba(255,150,150,0.4)',
            boxShadow: '0 0 24px rgba(239,68,68,0.7), 0 0 50px rgba(239,68,68,0.3), 0 8px 20px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            outline: 'none',
            animation: 'uno-pulse 1s ease-in-out infinite',
          }}
        >
          UNO!
        </motion.button>
      )}
    </AnimatePresence>
  );
}
