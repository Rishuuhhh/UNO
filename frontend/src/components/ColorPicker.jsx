import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  { 
    name: 'red', 
    label: 'Red', 
    bg: 'linear-gradient(135deg, #ef4444, #dc2626)', 
    glow: 'rgba(239,68,68,0.6)',
    icon: '🔴'
  },
  { 
    name: 'blue', 
    label: 'Blue', 
    bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
    glow: 'rgba(59,130,246,0.6)',
    icon: '🔵'
  },
  { 
    name: 'green', 
    label: 'Green', 
    bg: 'linear-gradient(135deg, #22c55e, #16a34a)', 
    glow: 'rgba(34,197,94,0.6)',
    icon: '🟢'
  },
  { 
    name: 'yellow', 
    label: 'Yellow', 
    bg: 'linear-gradient(135deg, #eab308, #ca8a04)', 
    glow: 'rgba(234,179,8,0.6)',
    icon: '🟡'
  },
];

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export default function ColorPicker({ onColorSelect, onClose }) {
  const isMobile = useIsMobile();
  const [selectedColor, setSelectedColor] = useState(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (COLORS[index]) {
          onColorSelect(COLORS[index].name);
        }
      } else if (e.key === 'Enter' && selectedColor) {
        onColorSelect(selectedColor);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onColorSelect, onClose, selectedColor]);

  const buttonSize = isMobile ? 72 : 88;
  const gridCols = isMobile ? 2 : 2; // Keep 2x2 grid for both

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      initial={{ backdropFilter: 'blur(0px)', background: 'rgba(0,0,0,0)' }}
      animate={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.6)' }}
      exit={{ backdropFilter: 'blur(0px)', background: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClose}
      data-testid="color-picker-overlay"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        data-testid="color-picker"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25, 
          mass: 0.8 
        }}
        className="glass-strong rounded-2xl p-6 w-full max-w-sm mx-auto"
        style={{
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white mb-1">
            Choose Color
          </h3>
          <p className="text-sm text-white/60">
            Select the next color to play
          </p>
        </div>

        {/* Color Grid */}
        <div 
          className="grid gap-3 mb-4"
          style={{ 
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          }}
        >
          {COLORS.map(({ name, label, bg, glow, icon }, i) => (
            <motion.button
              key={name}
              onClick={() => onColorSelect(name)}
              onMouseEnter={() => setSelectedColor(name)}
              onFocus={() => setSelectedColor(name)}
              className="focus-ring relative rounded-xl overflow-hidden transition-smooth touch-target"
              style={{
                background: bg,
                width: buttonSize,
                height: buttonSize,
                boxShadow: selectedColor === name 
                  ? `0 0 20px ${glow}, 0 8px 25px rgba(0,0,0,0.3)`
                  : '0 4px 15px rgba(0,0,0,0.2)',
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: `0 0 25px ${glow}, 0 10px 30px rgba(0,0,0,0.4)`,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.95,
                transition: { duration: 0.1 }
              }}
              initial={{ 
                opacity: 0, 
                scale: 0.8, 
                rotate: -10 
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0 
              }}
              transition={{ 
                delay: i * 0.08,
                type: 'spring',
                stiffness: 400,
                damping: 25
              }}
              aria-label={`Select ${label} color (${i + 1})`}
            >
              {/* Shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                style={{ borderRadius: 'inherit' }}
              />
              
              {/* Color icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-2xl filter drop-shadow-lg"
                  style={{ fontSize: isMobile ? 20 : 24 }}
                >
                  {icon}
                </span>
              </div>

              {/* Color name */}
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span 
                  className="text-xs font-semibold text-white drop-shadow-lg"
                  style={{ fontSize: isMobile ? 10 : 12 }}
                >
                  {label}
                </span>
              </div>

              {/* Selection indicator */}
              {selectedColor === name && (
                <motion.div
                  className="absolute inset-0 border-2 border-white rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}

              {/* Keyboard shortcut indicator */}
              <div className="absolute top-1 right-1">
                <span 
                  className="text-xs font-bold text-white/70 bg-black/30 rounded px-1"
                  style={{ fontSize: isMobile ? 8 : 10 }}
                >
                  {i + 1}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-xs text-white/50">
            {isMobile ? 'Tap a color' : 'Click a color or press 1-4'}
          </p>
        </div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-smooth focus-ring"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close color picker"
        >
          <span className="text-white/70 text-lg leading-none">×</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
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
