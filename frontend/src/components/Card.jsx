import React from 'react';
import { motion } from 'framer-motion';

// Enhanced animation presets
const SPRING_SMOOTH = { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 };
const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 20, mass: 0.6 };

// Responsive card sizing
const getCardSize = (small, mobile) => {
  if (small) return mobile ? { w: 32, h: 48 } : { w: 40, h: 60 };
  return mobile ? { w: 48, h: 72 } : { w: 64, h: 96 };
};

// Enhanced color configuration with better contrast and accessibility
const COLOR_CONFIG = {
  red: {
    gradient: 'from-red-500 via-red-600 to-red-700',
    glow: '0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.3)',
    border: 'rgba(255,150,150,0.4)',
    shine: 'rgba(255,200,200,0.15)',
    symbolColor: '#7f1d1d',
    textColor: '#ffffff',
  },
  blue: {
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
    glow: '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)',
    border: 'rgba(150,180,255,0.4)',
    shine: 'rgba(180,210,255,0.15)',
    symbolColor: '#1e3a8a',
    textColor: '#ffffff',
  },
  green: {
    gradient: 'from-green-500 via-green-600 to-green-700',
    glow: '0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3)',
    border: 'rgba(150,255,180,0.4)',
    shine: 'rgba(180,255,200,0.15)',
    symbolColor: '#14532d',
    textColor: '#ffffff',
  },
  yellow: {
    gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
    glow: '0 0 20px rgba(234,179,8,0.7), 0 0 40px rgba(234,179,8,0.4)',
    border: 'rgba(255,240,100,0.5)',
    shine: 'rgba(255,255,200,0.2)',
    symbolColor: '#7c4a00',
    textColor: '#1a1a1a',
  },
  wild: {
    gradient: 'from-gray-800 via-gray-900 to-black',
    glow: '0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.3)',
    border: 'rgba(200,150,255,0.4)',
    shine: 'rgba(200,180,255,0.12)',
    symbolColor: '#ffffff',
    textColor: '#ffffff',
  },
};

// Enhanced value display with better symbols
const VALUE_DISPLAY = {
  skip: { symbol: '⊘', label: 'Skip' },
  reverse: { symbol: '↺', label: 'Reverse' },
  draw2: { symbol: '+2', label: 'Draw Two' },
  wild: { symbol: '★', label: 'Wild' },
  wild4: { symbol: '+4', label: 'Wild Draw Four' },
  0: { symbol: '0', label: 'Zero' },
  1: { symbol: '1', label: 'One' },
  2: { symbol: '2', label: 'Two' },
  3: { symbol: '3', label: 'Three' },
  4: { symbol: '4', label: 'Four' },
  5: { symbol: '5', label: 'Five' },
  6: { symbol: '6', label: 'Six' },
  7: { symbol: '7', label: 'Seven' },
  8: { symbol: '8', label: 'Eight' },
  9: { symbol: '9', label: 'Nine' },
};

// Enhanced Wild Card Oval Component
function WildOval({ small, mobile }) {
  const size = getCardSize(small, mobile);
  const ovalW = size.w * 0.7;
  const ovalH = size.h * 0.5;
  
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: ovalW, height: ovalH }}
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, 
            #ef4444 0deg 90deg, 
            #3b82f6 90deg 180deg, 
            #22c55e 180deg 270deg, 
            #eab308 270deg 360deg
          )`,
          animation: 'spin 4s linear infinite',
        }}
      />
      
      {/* Inner content area */}
      <div 
        className="relative bg-gray-900 rounded-full flex items-center justify-center"
        style={{ 
          width: ovalW - 4, 
          height: ovalH - 4,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
        }}
      >
        <span 
          className="font-black text-white"
          style={{ 
            fontSize: small ? (mobile ? 10 : 12) : (mobile ? 14 : 18),
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}
        >
          ★
        </span>
      </div>
    </div>
  );
}

// Enhanced Card Back Component
function CardBack({ small, mobile }) {
  const size = getCardSize(small, mobile);
  const borderRadius = small ? 6 : 8;
  
  return (
    <div 
      className="relative overflow-hidden flex-shrink-0 transition-smooth"
      style={{
        width: size.w,
        height: size.h,
        borderRadius,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid rgba(150,130,255,0.3)',
      }}
    >
      {/* Pattern overlay */}
      <div 
        className="absolute inset-1 rounded"
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 2px,
            transparent 2px,
            transparent 6px
          )`
        }}
      />
      
      {/* UNO logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="font-black text-white opacity-20"
          style={{ 
            fontSize: small ? (mobile ? 8 : 10) : (mobile ? 12 : 16),
            letterSpacing: 1
          }}
        >
          UNO
        </span>
      </div>
    </div>
  );
}

// Main Card Component
export default function Card({ 
  card, 
  small = false, 
  playable = false, 
  onClick, 
  className = '',
  mobile = false 
}) {
  if (!card) return <CardBack small={small} mobile={mobile} />;

  const size = getCardSize(small, mobile);
  const borderRadius = small ? 6 : 8;
  const isWild = card.value === 'wild' || card.value === 'wild4';
  const color = isWild ? 'wild' : card.color;
  const config = COLOR_CONFIG[color];
  const valueDisplay = VALUE_DISPLAY[card.value] || { symbol: card.value, label: card.value };
  
  // Responsive font sizes
  const mainFontSize = small ? (mobile ? 12 : 16) : (mobile ? 18 : 24);
  const cornerFontSize = small ? (mobile ? 8 : 10) : (mobile ? 10 : 12);

  return (
    <motion.div
      className={`relative overflow-hidden flex-shrink-0 cursor-pointer select-none ${className}`}
      style={{
        width: size.w,
        height: size.h,
        borderRadius,
      }}
      onClick={playable && onClick ? () => onClick(card) : undefined}
      whileHover={playable ? { 
        scale: 1.05, 
        y: -4,
        transition: SPRING_BOUNCY 
      } : {}}
      whileTap={playable ? { 
        scale: 0.95,
        transition: { duration: 0.1 }
      } : {}}
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      transition={SPRING_SMOOTH}
      role="button"
      tabIndex={playable ? 0 : -1}
      aria-label={`${valueDisplay.label} ${isWild ? 'Wild' : color} card${playable ? ', playable' : ''}`}
      data-card-id={card.id}
    >
      {/* Main gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />

      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Inner border */}
      <div 
        className="absolute border border-white/20"
        style={{
          inset: 2,
          borderRadius: borderRadius - 2,
        }}
      />

      {/* Center symbol area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isWild ? (
          <WildOval small={small} mobile={mobile} />
        ) : (
          <div 
            className="flex items-center justify-center rounded-full bg-white/90 shadow-lg"
            style={{
              width: size.w * 0.6,
              height: size.h * 0.55,
              transform: 'rotate(-15deg)',
            }}
          >
            <span 
              className="font-black"
              style={{
                transform: 'rotate(15deg)',
                fontSize: mainFontSize,
                color: config.symbolColor,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                lineHeight: 1,
              }}
            >
              {valueDisplay.symbol}
            </span>
          </div>
        )}
      </div>

      {/* Corner labels */}
      {['top-left', 'bottom-right'].map((position) => (
        <div 
          key={position}
          className="absolute"
          style={{
            ...(position === 'top-left' 
              ? { top: 3, left: 4 } 
              : { bottom: 3, right: 4, transform: 'rotate(180deg)' }
            ),
          }}
        >
          <span 
            className="font-black"
            style={{
              fontSize: cornerFontSize,
              color: config.textColor,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              lineHeight: 1,
            }}
          >
            {valueDisplay.symbol}
          </span>
        </div>
      ))}

      {/* Shine effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius,
          background: `linear-gradient(135deg, ${config.shine} 0%, transparent 50%)`,
        }}
      />

      {/* Playable indicator */}
      {playable && (
        <>
          {/* Pulsing ring */}
          <div 
            className="absolute -inset-1 rounded-lg pointer-events-none playable-card"
            style={{
              border: '2px solid rgba(99, 102, 241, 0.8)',
              borderRadius: borderRadius + 2,
            }}
          />
          
          {/* Glow effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius,
              boxShadow: config.glow,
            }}
          />
        </>
      )}

      {/* Shimmer effect for special cards */}
      {isWild && (
        <div 
          className="absolute inset-0 pointer-events-none card-shimmer"
          style={{ borderRadius }}
        />
      )}
    </motion.div>
  );
}
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
