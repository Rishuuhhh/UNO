import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from './Card';

const SPRING_LAYOUT = { type: 'spring', stiffness: 280, damping: 24, mass: 0.8 };

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

export default function PlayerHand({ cards = [], playableCardIds = new Set(), onPlayCard }) {
  const prevIdsRef = useRef(new Set());
  const containerRef = useRef(null);
  const isMobile = useIsMobile();

  const currentIds = new Set(cards.map((c) => c.id));
  const newIds = new Set([...currentIds].filter((id) => !prevIdsRef.current.has(id)));
  prevIdsRef.current = currentIds;

  const total = cards.length;
  
  // Responsive calculations
  const maxAngle = isMobile ? Math.min(1.8 * total, 20) : Math.min(2.5 * total, 28);
  const cardOverlap = isMobile 
    ? (total > 10 ? -24 : total > 6 ? -16 : -8)
    : (total > 8 ? -20 : total > 5 ? -10 : -6);
  
  // Calculate container width to prevent overflow
  const containerWidth = isMobile 
    ? Math.min(window.innerWidth - 32, total * 32 + 48)
    : Math.min(window.innerWidth - 64, total * 48 + 64);

  return (
    <div className="relative w-full flex justify-center">
      {/* Hand container */}
      <div
        ref={containerRef}
        className={`
          flex flex-row items-end justify-center 
          ${isMobile ? 'py-2 px-3' : 'py-3 px-4'}
          overflow-x-auto scrollbar-hide
        `}
        style={{ 
          touchAction: 'pan-x',
          minHeight: isMobile ? 80 : 112,
          maxWidth: containerWidth,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        data-testid="player-hand"
      >
        <AnimatePresence initial={false}>
          {cards.map((card, i) => {
            const mid = (total - 1) / 2;
            const normalizedPos = total > 1 ? (i - mid) / Math.max(mid, 1) : 0;
            const angle = normalizedPos * maxAngle;
            const yOffset = total > 1 ? Math.abs(normalizedPos) * (isMobile ? 1.5 : 2.5) : 0;
            const isPlayable = playableCardIds.has(card.id);
            
            return (
              <motion.div
                key={card.id}
                layout
                layoutId={card.id}
                initial={{ 
                  y: 80, 
                  opacity: 0, 
                  scale: 0.7, 
                  rotate: angle - 10,
                  zIndex: i 
                }}
                animate={{ 
                  y: -yOffset, 
                  opacity: 1, 
                  scale: 1, 
                  rotate: angle,
                  zIndex: isPlayable ? total + 10 : i
                }}
                exit={{
                  y: -150, 
                  opacity: 0, 
                  scale: 0.6, 
                  rotate: angle + 20,
                  transition: { 
                    duration: 0.3, 
                    ease: [0.4, 0, 0.2, 1] 
                  },
                }}
                transition={SPRING_LAYOUT}
                whileHover={isPlayable ? {
                  y: -yOffset - 12,
                  scale: 1.08,
                  rotate: angle * 0.7,
                  zIndex: total + 20,
                  transition: { 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 20 
                  }
                } : {}}
                style={{
                  marginLeft: i === 0 ? 0 : cardOverlap,
                  transformOrigin: 'bottom center',
                  position: 'relative',
                }}
                className="touch-manipulation"
              >
              <Card
                  card={card}
                  playable={isPlayable}
                  onClick={onPlayCard}
                  mobile={isMobile}
                  animate={newIds.has(card.id)}
                  className={isPlayable ? 'hover:shadow-lg' : ''}
                />
                
                {/* Playable indicator for mobile */}
                {isPlayable && isMobile && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Card count indicator for mobile */}
      {isMobile && total > 0 && (
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="glass px-3 py-1 rounded-full">
            <span className="text-xs font-semibold text-white/80">
              {total} card{total !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>
      )}

      {/* Scroll indicators for mobile */}
      {isMobile && total > 6 && (
        <>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="w-8 h-16 bg-gradient-to-r from-black/20 to-transparent rounded-r-lg" />
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="w-8 h-16 bg-gradient-to-l from-black/20 to-transparent rounded-l-lg" />
          </div>
        </>
      )}
    </div>
  );
}
