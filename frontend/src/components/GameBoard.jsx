import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import OpponentSlot from './OpponentSlot';
import GameBackground from './GameBackground';

function useDeviceType() {
  const [deviceType, setDeviceType] = useState(() => {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setDeviceType(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return deviceType;
}

export default function GameBoard({ gameState, myId, opponents = [], children }) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  const currentPlayer     = gameState?.players?.[gameState?.currentTurnIndex];
  const currentPlayerName = currentPlayer?.displayName ?? '…';
  const isMyTurn          = currentPlayer?.id === myId;
  const direction         = gameState?.direction === -1 ? '↺' : '↻';
  const round             = gameState?.round || 1;

  return (
    <div
      className="relative flex flex-col flex-1 overflow-hidden text-white"
      data-testid={`game-board-${deviceType}`}
    >
      {/* Static background */}
      <GameBackground />

      {/* Round badge — top right, no animation */}
      <div
        className="absolute glass rounded-lg px-3 py-1 z-10"
        style={{ top: 12, right: isMobile ? 56 : 60, fontSize: isMobile ? 11 : 13 }}
      >
        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Round </span>
        <span style={{ color: '#fff', fontWeight: 700 }}>{round}</span>
      </div>

      {/* Opponents row */}
      <div
        className="relative z-10 w-full flex justify-center flex-wrap"
        style={{
          padding: isMobile ? '12px 8px 4px' : '16px 16px 4px',
          gap: isMobile ? 8 : isTablet ? 12 : 16,
        }}
      >
        {opponents.map((opponent, i) => (
          <OpponentSlot
            key={opponent.id}
            player={opponent}
            index={i}
            isCurrentTurn={currentPlayer?.id === opponent.id}
          />
        ))}
      </div>

      {/* Center area */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="flex flex-col items-center" style={{ gap: isMobile ? 12 : 16 }}>

          {/* Turn indicator — static, no looping animation */}
          <div
            data-testid="turn-indicator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: isMobile ? '6px 14px' : '7px 18px',
              borderRadius: 999,
              background: isMyTurn
                ? 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.75))'
                : 'rgba(255,255,255,0.07)',
              border: isMyTurn
                ? '1px solid rgba(99,102,241,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              boxShadow: isMyTurn
                ? '0 0 16px rgba(99,102,241,0.35), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.2)',
              color: isMyTurn ? '#fff' : 'rgba(255,255,255,0.75)',
              fontWeight: 600,
              fontSize: isMobile ? 12 : 13,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: isMobile ? 13 : 15 }}>{direction}</span>
            <span>
              {isMyTurn
                ? '✦ Your turn!'
                : `${isMobile && currentPlayerName.length > 10 ? currentPlayerName.slice(0, 10) + '…' : currentPlayerName}'s turn`}
            </span>
          </div>

          {/* Game elements (draw + discard piles) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 16 : isTablet ? 24 : 32,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
