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
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '12px 28px',
            borderRadius: 999,
            border: '2px solid rgba(255,150,150,0.35)',
            boxShadow: '0 4px 20px rgba(239,68,68,0.5), 0 2px 8px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          UNO!
        </motion.button>
      )}
    </AnimatePresence>
  );
}
