import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from './Card';

const SPRING_LAYOUT = { type: 'spring', stiffness: 300, damping: 28, mass: 0.9 };

export default function PlayerHand({ cards = [], playableCardIds = new Set(), onPlayCard }) {
  const prevIdsRef = useRef(new Set());

  const currentIds = new Set(cards.map((c) => c.id));
  const newIds     = new Set([...currentIds].filter((id) => !prevIdsRef.current.has(id)));
  prevIdsRef.current = currentIds;

  const total    = cards.length;
  const maxAngle = Math.min(2.8 * total, 28);

  return (
    <div
      className="flex flex-row items-end justify-center py-3 px-2 overflow-x-auto"
      style={{ touchAction: 'pan-x', minHeight: 112 }}
      data-testid="player-hand"
    >
      <AnimatePresence initial={false}>
        {cards.map((card, i) => {
          const mid    = (total - 1) / 2;
          const angle  = total > 1 ? ((i - mid) / Math.max(mid, 1)) * maxAngle : 0;
          const yOff   = total > 1 ? Math.abs(i - mid) * 2.5 : 0;
          const overlap = total > 8 ? -20 : total > 5 ? -10 : -6;

          return (
            <motion.div
              key={card.id}
              layout
              layoutId={card.id}
              // Cards slide in from below when added, out upward when played
              initial={{ y: 60, opacity: 0, scale: 0.7, rotate: angle - 8 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotate: angle }}
              exit={{
                y: -120, opacity: 0, scale: 0.5, rotate: angle + 15,
                transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
              }}
              transition={SPRING_LAYOUT}
              style={{
                marginLeft: i === 0 ? 0 : overlap,
                zIndex: i,
                transformOrigin: 'bottom center',
                translateY: yOff,
              }}
            >
              <Card
                card={card}
                playable={playableCardIds.has(card.id)}
                onClick={onPlayCard}
                draggable={playableCardIds.has(card.id)}
                animate={newIds.has(card.id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
