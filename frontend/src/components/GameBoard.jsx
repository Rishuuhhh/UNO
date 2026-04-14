import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import OpponentSlot from './OpponentSlot';
import GameBackground from './GameBackground';

export default function GameBoard({ gameState, myId, opponents = [], children }) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    function handleResize() { setIsDesktop(window.innerWidth >= 1024); }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentPlayer    = gameState?.players?.[gameState?.currentTurnIndex];
  const currentPlayerName = currentPlayer?.displayName ?? '…';
  const isMyTurn         = currentPlayer?.id === myId;
  const direction        = gameState?.direction === -1 ? '↺' : '↻';

  const cardVariants = {
    hidden:  { opacity: 0, y: 30, scale: 0.85 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.3 } },
  };

  const TurnIndicator = () => (
    <motion.div
      data-testid="turn-indicator"
      animate={isMyTurn ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ repeat: isMyTurn ? Infinity : 0, duration: 1.6 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 18px', borderRadius: 999,
        background: isMyTurn
          ? 'linear-gradient(135deg, rgba(234,179,8,0.9), rgba(251,146,60,0.85))'
          : 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(10px)',
        border: isMyTurn ? '1px solid rgba(234,179,8,0.6)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isMyTurn ? '0 0 20px rgba(234,179,8,0.4)' : 'none',
        color: isMyTurn ? '#1a0f00' : 'rgba(255,255,255,0.7)',
        fontWeight: 700, fontSize: 13,
      }}
    >
      <span style={{ fontSize: 16 }}>{direction}</span>
      <span>{isMyTurn ? '✦ Your turn!' : `${currentPlayerName}'s turn`}</span>
    </motion.div>
  );

  // Shared center area
  const CenterArea = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
      <TurnIndicator />
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {children}
      </div>
    </div>
  );

  // Opponents row
  const OpponentsRow = ({ gap = 12 }) => (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap, padding: '12px 16px', position: 'relative', zIndex: 1 }}>
      {opponents.map((opp, i) => (
        <motion.div key={opp.id} variants={cardVariants} initial="hidden" animate="visible">
          <OpponentSlot
            player={opp}
            index={i}
            isCurrentTurn={gameState?.players?.[gameState?.currentTurnIndex]?.id === opp.id}
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', color: '#fff' }}
      data-testid={isDesktop ? 'game-board-desktop' : 'game-board-mobile'}
    >
      {/* Animated canvas background */}
      <GameBackground />

      {/* Content above canvas */}
      <OpponentsRow gap={isDesktop ? 16 : 8} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <CenterArea />
      </div>
    </div>
  );
}
