import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import OpponentSlot from './OpponentSlot';

/**
 * Layout container for the game board.
 * - Desktop (≥ 1024px): arc layout with opponents across the top
 * - Mobile (< 1024px): bottom-deck layout with opponents stacked at top
 *
 * @param {object} gameState - current game state
 * @param {string} myId - current player's socket id
 * @param {Array} opponents - array of opponent player objects
 * @param {React.ReactNode} children - center content (discard pile, draw pile, etc.)
 */
export default function GameBoard({ gameState, myId, opponents = [], children }) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine current player name and direction for the turn indicator
  const currentPlayer = gameState?.players?.[gameState?.currentTurnIndex];
  const currentPlayerName = currentPlayer?.displayName ?? '…';
  const isMyTurn = currentPlayer?.id === myId;
  const direction = gameState?.direction === -1 ? '↺' : '↻';

  // Staggered card-deal animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  };

  // Turn indicator bar
  const TurnIndicator = () => (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
        ${isMyTurn ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-200'}`}
      data-testid="turn-indicator"
    >
      <span className="text-lg" aria-label="direction">{direction}</span>
      <span>{isMyTurn ? 'Your turn!' : `${currentPlayerName}'s turn`}</span>
    </div>
  );

  if (isDesktop) {
    return (
      <div
        className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden"
        data-testid="game-board-desktop"
      >
        {/* Top: opponents in arc */}
        <div className="flex justify-center gap-4 pt-4 px-4 flex-wrap">
          {opponents.map((opp) => (
            <motion.div
              key={opp.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <OpponentSlot
                player={opp}
                isCurrentTurn={gameState?.players?.[gameState?.currentTurnIndex]?.id === opp.id}
              />
            </motion.div>
          ))}
        </div>

        {/* Center: turn indicator + main content */}
        <div className="flex flex-col flex-1 items-center justify-center gap-4 px-4">
          <TurnIndicator />
          <motion.div
            className="flex items-center justify-center gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {children}
          </motion.div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div
      className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden"
      data-testid="game-board-mobile"
    >
      {/* Top: opponents stacked */}
      <div className="flex justify-center gap-2 pt-3 px-3 flex-wrap">
        {opponents.map((opp) => (
          <motion.div
            key={opp.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <OpponentSlot
              player={opp}
              isCurrentTurn={gameState?.players?.[gameState?.currentTurnIndex]?.id === opp.id}
            />
          </motion.div>
        ))}
      </div>

      {/* Center: turn indicator + main content */}
      <div className="flex flex-col flex-1 items-center justify-center gap-3 px-3">
        <TurnIndicator />
        <motion.div
          className="flex items-center justify-center gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
