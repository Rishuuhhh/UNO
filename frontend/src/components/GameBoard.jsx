import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OpponentSlot from './OpponentSlot';
import GameBackground from './GameBackground';

// Hook to detect device type
function useDeviceType() {
  const [deviceType, setDeviceType] = useState(() => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

export default function GameBoard({ gameState, myId, opponents = [], children }) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  const currentPlayer = gameState?.players?.[gameState?.currentTurnIndex];
  const currentPlayerName = currentPlayer?.displayName ?? '…';
  const isMyTurn = currentPlayer?.id === myId;
  const direction = gameState?.direction === -1 ? '↺' : '↻';
  const round = gameState?.round || 1;

  // Enhanced turn indicator with better mobile design
  const TurnIndicator = () => (
    <motion.div
      data-testid="turn-indicator"
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md
        ${isMobile ? 'text-xs' : 'text-sm'}
        ${isMyTurn ? 'turn-active' : ''}
      `}
      style={{
        background: isMyTurn
          ? 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.8))'
          : 'rgba(255,255,255,0.08)',
        border: isMyTurn 
          ? '1px solid rgba(99,102,241,0.6)' 
          : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isMyTurn 
          ? '0 0 20px rgba(99,102,241,0.4), 0 4px 15px rgba(0,0,0,0.3)' 
          : '0 2px 10px rgba(0,0,0,0.2)',
        color: isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.8)',
        fontWeight: 600,
        minWidth: isMobile ? 'auto' : '200px',
        justifyContent: 'center',
      }}
      animate={isMyTurn ? { 
        scale: [1, 1.02, 1],
        boxShadow: [
          '0 0 20px rgba(99,102,241,0.4), 0 4px 15px rgba(0,0,0,0.3)',
          '0 0 30px rgba(99,102,241,0.6), 0 6px 20px rgba(0,0,0,0.4)',
          '0 0 20px rgba(99,102,241,0.4), 0 4px 15px rgba(0,0,0,0.3)'
        ]
      } : {}}
      transition={{ 
        repeat: isMyTurn ? Infinity : 0, 
        duration: 2,
        ease: 'easeInOut'
      }}
    >
      {/* Direction indicator */}
      <motion.span 
        className={isMobile ? 'text-sm' : 'text-lg'}
        animate={{ rotate: gameState?.direction === -1 ? -360 : 360 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {direction}
      </motion.span>
      
      {/* Turn text */}
      <span className="truncate">
        {isMyTurn ? (
          <span className="flex items-center gap-1">
            <span className="animate-pulse">✦</span>
            {isMobile ? 'Your turn!' : 'Your turn!'}
          </span>
        ) : (
          <span className="truncate">
            {isMobile ? currentPlayerName.slice(0, 8) + (currentPlayerName.length > 8 ? '...' : '') : `${currentPlayerName}'s turn`}
          </span>
        )}
      </span>
    </motion.div>
  );

  // Round indicator
  const RoundIndicator = () => (
    <motion.div
      className={`
        absolute top-4 right-4 glass rounded-lg px-3 py-1
        ${isMobile ? 'text-xs' : 'text-sm'}
      `}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <span className="text-white/60 font-medium">Round</span>
      <span className="text-white font-bold ml-1">{round}</span>
    </motion.div>
  );

  // Enhanced center area with responsive design
  const CenterArea = () => (
    <div className="flex flex-col items-center gap-4 relative z-10">
      <TurnIndicator />
      
      {/* Game elements (draw pile, discard pile, etc.) */}
      <div className={`
        flex items-center justify-center
        ${isMobile ? 'gap-4' : isTablet ? 'gap-6' : 'gap-8'}
      `}>
        {children}
      </div>
    </div>
  );

  // Responsive opponents layout
  const OpponentsArea = () => {
    const gap = isMobile ? 8 : isTablet ? 12 : 16;
    const maxOpponentsPerRow = isMobile ? 2 : isTablet ? 3 : 4;
    
    // Split opponents into rows for mobile
    const opponentRows = [];
    for (let i = 0; i < opponents.length; i += maxOpponentsPerRow) {
      opponentRows.push(opponents.slice(i, i + maxOpponentsPerRow));
    }

    return (
      <div className={`
        relative z-10 w-full
        ${isMobile ? 'px-2 py-3' : 'px-4 py-4'}
      `}>
        {opponentRows.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            className="flex justify-center flex-wrap mb-2"
            style={{ gap }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * 0.1 }}
          >
            {row.map((opponent, i) => (
              <motion.div
                key={opponent.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: (rowIndex * maxOpponentsPerRow + i) * 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25
                }}
              >
                <OpponentSlot
                  player={opponent}
                  index={rowIndex * maxOpponentsPerRow + i}
                  isCurrentTurn={currentPlayer?.id === opponent.id}
                  mobile={isMobile}
                />
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative flex flex-col flex-1 overflow-hidden text-white"
      data-testid={`game-board-${deviceType}`}
      style={{ minHeight: '100vh' }}
    >
      {/* Animated background */}
      <GameBackground />

      {/* Round indicator */}
      <RoundIndicator />

      {/* Opponents area */}
      <OpponentsArea />

      {/* Center game area */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <CenterArea />
      </div>

      {/* Mobile-specific UI enhancements */}
      {isMobile && (
        <>
          {/* Safe area indicators */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </>
      )}
    </div>
  );
}
