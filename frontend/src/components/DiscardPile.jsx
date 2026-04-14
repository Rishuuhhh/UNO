import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

/**
 * Renders the top discard card with a Framer Motion entrance animation (≤ 300ms).
 * @param {object} topCard - card object { id, color, value }
 */
export default function DiscardPile({ topCard }) {
  return (
    <div className="flex flex-col items-center gap-1" data-testid="discard-pile">
      <span className="text-gray-400 text-xs uppercase tracking-wide">Discard</span>
      <AnimatePresence mode="wait">
        {topCard && (
          <motion.div
            key={topCard.id}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card card={topCard} playable={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
