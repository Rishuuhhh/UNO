import React from 'react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  wild: 'bg-gray-700',
};

export default function Card({ card, playable = false, onClick, draggable = false, animate = false }) {
  if (!card) return null;

  const bgColor = COLOR_MAP[card.color] ?? 'bg-gray-700';
  const playableClasses = playable
    ? 'ring-4 ring-white cursor-pointer'
    : 'cursor-default';

  function handleDragStart(e) {
    e.dataTransfer.setData('cardId', card.id);
  }

  return (
    <motion.div
      className={`relative flex items-center justify-center w-16 h-24 rounded-lg text-white font-bold text-sm select-none ${bgColor} ${playableClasses}`}
      onClick={playable && onClick ? () => onClick(card) : undefined}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      data-testid="card"
      data-card-id={card.id}
      // entrance animation when card is added to hand
      initial={animate ? { y: 60, opacity: 0, scale: 0.7 } : false}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      // hover / tap only when playable
      whileHover={playable ? { y: -12, scale: 1.08 } : {}}
      whileTap={playable ? { scale: 0.95 } : {}}
    >
      <span className="text-center leading-tight px-1">{card.value}</span>
    </motion.div>
  );
}
