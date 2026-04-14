import React, { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Card from './Card';

export default function PlayerHand({ cards = [], playableCardIds = new Set(), onPlayCard }) {
  const prevIdsRef = useRef(new Set());

  // Track which card IDs are newly added this render
  const currentIds = new Set(cards.map((c) => c.id));
  const newIds = new Set([...currentIds].filter((id) => !prevIdsRef.current.has(id)));
  prevIdsRef.current = currentIds;

  return (
    <div
      className="flex flex-row gap-2 overflow-x-auto py-2 px-1"
      style={{ touchAction: 'pan-x' }}
      data-testid="player-hand"
    >
      <AnimatePresence initial={false}>
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            playable={playableCardIds.has(card.id)}
            onClick={onPlayCard}
            draggable={playableCardIds.has(card.id)}
            animate={newIds.has(card.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
