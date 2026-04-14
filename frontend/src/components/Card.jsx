import React from 'react';

const COLOR_MAP = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  wild: 'bg-gray-700',
};

/**
 * Renders a single UNO card.
 * @param {object} card - { id, color, value }
 * @param {boolean} playable - highlights the card when true
 * @param {function} onClick - called when the card is clicked
 * @param {boolean} draggable - enables drag-and-drop on desktop
 */
export default function Card({ card, playable = false, onClick, draggable = false }) {
  if (!card) return null;

  const bgColor = COLOR_MAP[card.color] ?? 'bg-gray-700';
  const playableClasses = playable ? 'ring-4 ring-white cursor-pointer hover:scale-105' : 'cursor-default';

  function handleDragStart(e) {
    e.dataTransfer.setData('cardId', card.id);
  }

  return (
    <div
      className={`relative flex items-center justify-center w-16 h-24 rounded-lg text-white font-bold text-sm select-none transition-transform ${bgColor} ${playableClasses}`}
      onClick={playable && onClick ? () => onClick(card) : undefined}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      data-testid="card"
      data-card-id={card.id}
    >
      <span className="text-center leading-tight px-1">{card.value}</span>
    </div>
  );
}
