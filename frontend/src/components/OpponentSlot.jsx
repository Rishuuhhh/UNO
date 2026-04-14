import React from 'react';

/**
 * Renders an opponent's display name and face-down card count.
 * @param {object} player - { displayName, handCount }
 * @param {boolean} isCurrentTurn - highlights when it's this player's turn
 */
export default function OpponentSlot({ player, isCurrentTurn = false }) {
  if (!player) return null;

  const turnClasses = isCurrentTurn
    ? 'ring-2 ring-yellow-400 bg-gray-700'
    : 'bg-gray-800';

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 ${turnClasses}`}
      data-testid="opponent-slot"
    >
      <span className="text-white font-semibold text-sm truncate max-w-[80px]">
        {player.displayName}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(player.handCount ?? 0, 7) }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-9 bg-blue-900 border border-blue-400 rounded"
          />
        ))}
        {(player.handCount ?? 0) > 7 && (
          <span className="text-white text-xs self-end">+{player.handCount - 7}</span>
        )}
      </div>
      <span className="text-gray-400 text-xs">{player.handCount ?? 0} cards</span>
    </div>
  );
}
