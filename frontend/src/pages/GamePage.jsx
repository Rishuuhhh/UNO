import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { useSound } from '../hooks/useSound';
import GameBoard from '../components/GameBoard';
import PlayerHand from '../components/PlayerHand';
import DiscardPile from '../components/DiscardPile';
import Card from '../components/Card';
import OpponentSlot from '../components/OpponentSlot';
import ColorPicker from '../components/ColorPicker';
import UnoButton from '../components/UnoButton';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';

const WILD_VALUES = new Set(['wild', 'wild4']);

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export default function GamePage() {
  const { socket } = useSocket();
  const { gameState, myHand, players, myTurn, chatMessages, error } = useGameStore();
  const setError = useGameStore((s) => s.setError);
  const { play } = useSound();
  const isMobile = useIsMobile();

  // UI State
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [toastError, setToastError] = useState(null);
  const [drawAnimKey, setDrawAnimKey] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Refs
  const timeWarnedRef = useRef(false);
  const prevDiscardTopRef = useRef(null);
  const prevMyTurnRef = useRef(false);
  const lastTimeWarningRef = useRef(0);

  const myId = socket?.id;

  // Show error toast whenever store error changes
  useEffect(() => {
    if (error) {
      setToastError(error);
      play('error');
    }
  }, [error, play]);

  // Enhanced sound: playCard when discard pile top changes (with debouncing)
  useEffect(() => {
    const topCard = gameState?.discardPile?.[gameState.discardPile.length - 1];
    const topId = topCard?.id ?? null;
    if (topId && topId !== prevDiscardTopRef.current) {
      if (prevDiscardTopRef.current !== null) {
        play('playCard');
      }
      prevDiscardTopRef.current = topId;
    }
  }, [gameState?.discardPile, play]);

  // Enhanced sound: turnChange when myTurn becomes true
  useEffect(() => {
    if (myTurn && !prevMyTurnRef.current) {
      play('turnChange');
      timeWarnedRef.current = false;
    }
    prevMyTurnRef.current = myTurn;
  }, [myTurn, play]);

  // Sound: win on game_over
  useEffect(() => {
    if (gameState?.status === 'finished') {
      play('win');
    }
  }, [gameState?.status, play]);

  // Enhanced turn timer with better time warning
  useEffect(() => {
    const { turnStartedAt, turnTimeLimit } = gameState ?? {};
    if (!turnStartedAt || !turnTimeLimit) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartedAt) / 1000);
      const left = Math.max(0, turnTimeLimit - elapsed);
      setSecondsLeft(left);
      
      // Play warning sound only once when 10 seconds left
      if (left === 10 && !timeWarnedRef.current && myTurn) {
        const now = Date.now();
        if (now - lastTimeWarningRef.current > 5000) { // Debounce 5 seconds
          timeWarnedRef.current = true;
          lastTimeWarningRef.current = now;
          play('timeWarning');
        }
      }
    }, 1000); // Update every second for better UX

    return () => clearInterval(interval);
  }, [gameState?.turnStartedAt, gameState?.turnTimeLimit, myTurn, play]);

  const dismissToast = useCallback(() => {
    setToastError(null);
    setError(null);
  }, [setError]);

  // Determine playable card IDs based on current game state
  const playableCardIds = React.useMemo(() => {
    if (!myTurn || !gameState) return new Set();
    const { currentColor, currentValue } = gameState;
    return new Set(
      myHand
        .filter((card) => {
          if (WILD_VALUES.has(card.value)) return true;
          return card.color === currentColor || card.value === currentValue;
        })
        .map((c) => c.id)
    );
  }, [myTurn, gameState, myHand]);

  // Handle playing a card — show color picker for wilds, otherwise emit directly
  const handlePlayCard = useCallback(
    (card) => {
      if (!socket || !myTurn) return;
      if (WILD_VALUES.has(card.value)) {
        setPendingWildCard(card);
      } else {
        socket.emit('play_card', { cardId: card.id });
        play('buttonClick');
      }
    },
    [socket, myTurn, play]
  );

  // Handle wild card color selection
  const handleColorSelect = useCallback(
    (color) => {
      if (!socket || !pendingWildCard) return;
      socket.emit('play_card', { cardId: pendingWildCard.id, chosenColor: color });
      setPendingWildCard(null);
      play('buttonClick');
    },
    [socket, pendingWildCard, play]
  );

  // Handle draw card
  const handleDrawCard = useCallback(() => {
    if (!socket || !myTurn) return;
    socket.emit('draw_card');
    setDrawAnimKey((k) => k + 1);
    play('drawCard');
  }, [socket, myTurn, play]);

  // Handle UNO call
  const handleUnoCall = useCallback(() => {
    if (!socket) return;
    socket.emit('call_uno');
    play('unoCall');
  }, [socket, play]);

  // Get opponents (all players except me)
  const opponents = players.filter((p) => p.id !== myId);

  // Mobile-specific UI components
  const MobileHeader = () => (
    <div className="flex items-center justify-between p-4 glass-dark">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white">UNO</h1>
        {gameState?.round && (
          <span className="text-sm text-white/60">Round {gameState.round}</span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Chat toggle for mobile */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-smooth focus-ring"
        >
          <span className="text-white text-lg">💬</span>
        </button>
        
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-smooth focus-ring"
        >
          <span className="text-white text-lg">⚙️</span>
        </button>
      </div>
    </div>
  );

  // Enhanced error toast
  const ErrorToast = () => (
    <AnimatePresence>
      {toastError && (
        <motion.div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm mx-auto"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="glass-strong rounded-xl p-4 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-lg">⚠️</span>
                <span className="text-white font-medium">{toastError}</span>
              </div>
              <button
                onClick={dismissToast}
                className="text-white/60 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Turn timer component
  const TurnTimer = () => {
    if (!myTurn || !gameState?.turnTimeLimit) return null;
    
    const percentage = (secondsLeft / gameState.turnTimeLimit) * 100;
    const isUrgent = secondsLeft <= 10;
    
    return (
      <motion.div
        className={`fixed top-0 left-0 right-0 z-40 ${isMobile ? 'h-1' : 'h-2'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-full bg-black/20 h-full">
          <motion.div
            className={`h-full transition-colors duration-300 ${
              isUrgent ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
            animate={isUrgent ? { opacity: [1, 0.7, 1] } : {}}
            transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : {}}
          />
        </div>
        
        {/* Timer text */}
        <div className="absolute top-2 right-4">
          <span className={`text-sm font-bold ${isUrgent ? 'text-red-400' : 'text-white/80'}`}>
            {secondsLeft}s
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-game min-h-screen flex flex-col relative overflow-hidden">
      {/* Turn timer */}
      <TurnTimer />
      
      {/* Mobile header */}
      {isMobile && <MobileHeader />}
      
      {/* Error toast */}
      <ErrorToast />

      {/* Main game area */}
      <GameBoard gameState={gameState} myId={myId} opponents={opponents}>
        {/* Draw pile */}
        <motion.div
          key={drawAnimKey}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            onClick={handleDrawCard} 
            playable={myTurn}
            mobile={isMobile}
            className="cursor-pointer hover:scale-105 transition-transform"
          />
        </motion.div>

        {/* Discard pile */}
        <DiscardPile 
          cards={gameState?.discardPile ?? []} 
          mobile={isMobile}
        />
      </GameBoard>

      {/* Player hand */}
      <PlayerHand
        cards={myHand}
        playableCardIds={playableCardIds}
        onPlayCard={handlePlayCard}
      />

      {/* UNO button */}
      <UnoButton 
        onCall={handleUnoCall} 
        mobile={isMobile}
      />

      {/* Chat panel - desktop only, mobile uses modal */}
      {!isMobile && (
        <ChatPanel 
          messages={chatMessages} 
          onSendMessage={(text) => socket?.emit('chat_message', { text })}
        />
      )}

      {/* Mobile chat modal */}
      {isMobile && showChat && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowChat(false)}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl max-h-96"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ChatPanel 
              messages={chatMessages} 
              onSendMessage={(text) => socket?.emit('chat_message', { text })}
              mobile={true}
              onClose={() => setShowChat(false)}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Color picker modal */}
      <AnimatePresence>
        {pendingWildCard && (
          <ColorPicker
            onColorSelect={handleColorSelect}
            onClose={() => setPendingWildCard(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <SettingsPanel 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Desktop settings button */}
      {!isMobile && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 right-4 w-12 h-12 rounded-full glass hover:glass-strong flex items-center justify-center transition-smooth focus-ring z-30"
        >
          <span className="text-white text-lg">⚙️</span>
        </button>
      )}
    </div>
  );
}
      if (prevDiscardTopRef.current !== null) play('playCard');
      prevDiscardTopRef.current = topId;
    }
  }, [gameState?.discardPile, play]);

  // Sound: turnChange when myTurn becomes true
  useEffect(() => {
    if (myTurn && !prevMyTurnRef.current) {
      play('turnChange');
      timeWarnedRef.current = false;
    }
    prevMyTurnRef.current = myTurn;
  }, [myTurn, play]);

  // Sound: win on game_over
  useEffect(() => {
    if (gameState?.status === 'finished') {
      play('win');
    }
  }, [gameState?.status, play]);

  // Turn timer: compute secondsLeft from turnStartedAt
  useEffect(() => {
    const { turnStartedAt, turnTimeLimit } = gameState ?? {};
    if (!turnStartedAt || !turnTimeLimit) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartedAt) / 1000);
      const left = Math.max(0, turnTimeLimit - elapsed);
      setSecondsLeft(left);
      if (left <= 10 && !timeWarnedRef.current) {
        timeWarnedRef.current = true;
        play('timeWarning');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState?.turnStartedAt, gameState?.turnTimeLimit, play]);

  const dismissToast = useCallback(() => {
    setToastError(null);
    setError(null);
  }, [setError]);

  // Determine playable card IDs based on current game state
  const playableCardIds = React.useMemo(() => {
    if (!myTurn || !gameState) return new Set();
    const { currentColor, currentValue } = gameState;
    return new Set(
      myHand
        .filter((card) => {
          if (WILD_VALUES.has(card.value)) return true;
          return card.color === currentColor || card.value === currentValue;
        })
        .map((c) => c.id)
    );
  }, [myTurn, gameState, myHand]);

  // Handle playing a card — show color picker for wilds, otherwise emit directly
  const handlePlayCard = useCallback(
    (card) => {
      if (!socket || !myTurn) return;
      if (WILD_VALUES.has(card.value)) {
        setPendingWildCard(card);
      } else {
        socket.emit('play_card', { cardId: card.id });
      }
    },
    [socket, myTurn]
  );

  const handleColorSelect = useCallback(
    (color) => {
      if (!socket || !pendingWildCard) return;
      socket.emit('play_card', { cardId: pendingWildCard.id, chosenColor: color });
      setPendingWildCard(null);
    },
    [socket, pendingWildCard]
  );

  const handleDrawCard = useCallback(() => {
    if (!socket || !myTurn) return;
    setDrawAnimKey((k) => k + 1);
    play('drawCard');
    socket.emit('draw_card', {});
  }, [socket, myTurn, play]);

  const handleUnoCall = useCallback(() => {
    if (!socket) return;
    play('unoCall');
    socket.emit('uno_call', {});
  }, [socket, play]);

  const handleSendMessage = useCallback(
    (text) => {
      if (!socket) return;
      socket.emit('chat_message', { text });
    },
    [socket]
  );

  // Derive opponents (all players except me)
  const opponents = React.useMemo(
    () => (gameState?.players ?? players).filter((p) => p.id !== myId),
    [gameState, players, myId]
  );

  const topCard = gameState?.discardPile?.[gameState.discardPile.length - 1] ?? null;

  // ── Game-over screen ────────────────────────────────────────────────────────
  if (gameState?.status === 'finished') {
    const { winnerName, scores, finalCounts } = gameState;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ minHeight: '100vh', background: '#080810', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24, color: '#fff' }}
        data-testid="game-over-screen"
      >
        <motion.h1
          initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
          animate={{ scale: 1,   opacity: 1, rotate: 0  }}
          transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.1 }}
          style={{ fontSize: 42, fontWeight: 900, color: '#eab308', textShadow: '0 0 30px rgba(234,179,8,0.6)' }}
        >
          Game Over!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.22 }}
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          🏆 {winnerName} wins!
        </motion.p>

        {scores && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.32 }}
            style={{
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
              padding: '20px 28px', width: '100%', maxWidth: 360,
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Scores</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(scores).map(([playerId, score], i) => {
                const player = (gameState.players ?? players).find((p) => p.id === playerId);
                return (
                  <motion.li
                    key={playerId}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0   }}
                    transition={{ type: 'spring', stiffness: 340, damping: 24, delay: 0.38 + i * 0.06 }}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}
                  >
                    <span>{player?.displayName ?? playerId}</span>
                    <span style={{ fontWeight: 800, color: '#eab308' }}>{score} pts</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.5 }}
          whileHover={{ scale: 1.05, y: -3, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
          whileTap={{ scale: 0.93, transition: { duration: 0.1 } }}
          onClick={() => window.location.href = '/'}
          style={{
            background: 'linear-gradient(135deg,#eab308,#ca8a04)',
            color: '#1a0f00', fontWeight: 800, fontSize: 16,
            padding: '14px 40px', borderRadius: 14, border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(234,179,8,0.4)',
          }}
        >
          Back to Lobby
        </motion.button>
      </motion.div>
    );
  }

  // ── Main game board ─────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen text-white overflow-hidden" style={{ background: '#080810' }} data-testid="game-page">
      {/* Round display — top right */}
      {gameState?.round && (
        <div
          style={{
            position: 'absolute', top: 12, right: 16, zIndex: 10,
            background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            padding: '4px 12px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
          }}
          data-testid="round-display"
        >
          Round {gameState.round} / {gameState.totalRounds ?? 3}
        </div>
      )}
      {/* Error toast */}
      <AnimatePresence>
        {toastError && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -16,  scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl"
            style={{
              background: 'rgba(127,29,29,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239,68,68,0.4)',
              boxShadow: '0 0 20px rgba(239,68,68,0.3), 0 8px 24px rgba(0,0,0,0.5)',
            }}
            role="alert"
            data-testid="error-toast"
          >
            <span style={{ fontSize: 13, color: 'rgba(254,202,202,0.95)' }}>{toastError}</span>
            <motion.button
              onClick={dismissToast}
              whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
              aria-label="Dismiss error"
              style={{ color: 'rgba(252,165,165,0.7)', fontWeight: 900, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
            >×</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color picker modal */}
      {pendingWildCard && (
        <ColorPicker
          onColorSelect={handleColorSelect}
          onClose={() => setPendingWildCard(null)}
        />
      )}

      {/* UNO button */}
      <div className="absolute bottom-32 right-4 z-40">
        <UnoButton visible={myHand.length === 1} onUnoCall={handleUnoCall} />
      </div>

      {/* Main layout */}
      <div className="flex h-full">
        {/* Game board area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <GameBoard gameState={gameState} myId={myId} opponents={opponents}>
            {/* Discard pile */}
            <DiscardPile topCard={topCard} />

            {/* Draw pile */}
            <div className="flex flex-col items-center gap-2 relative">
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Draw</span>

              {/* Turn timer */}
              {gameState?.turnStartedAt && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{
                    width: 48, height: 6, borderRadius: 3,
                    background: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, (secondsLeft / (gameState.turnTimeLimit ?? 30)) * 100)}%`,
                      background: secondsLeft <= 10 ? '#ef4444' : '#22c55e',
                      borderRadius: 3,
                      transition: 'width 0.1s linear, background 0.3s',
                    }} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: secondsLeft <= 10 ? '#ef4444' : 'rgba(255,255,255,0.45)',
                  }}>{secondsLeft}s</span>
                </div>
              )}
              <div className="relative" style={{ width: 64, height: 96 }}>
                {/* Stack depth layers */}
                {[3, 2, 1].map((offset) => (
                  <div key={offset} style={{
                    position: 'absolute',
                    top: -offset * 1.5, left: offset * 1,
                    width: 64, height: 96, borderRadius: 12,
                    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                    border: '1.5px solid rgba(150,130,255,0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }} />
                ))}

                {/* Top card (clickable) */}
                <motion.div
                  style={{ position: 'absolute', top: 0, left: 0, cursor: myTurn ? 'pointer' : 'default' }}
                  onClick={handleDrawCard}
                  data-testid="draw-pile"
                  aria-label="Draw a card"
                  whileHover={myTurn ? { y: -10, scale: 1.08, transition: { type: 'spring', stiffness: 400, damping: 18 } } : {}}
                  whileTap={myTurn ? { scale: 0.93 } : {}}
                >
                  <Card
                    card={{ id: 'draw-back', color: 'wild', value: 'wild' }}
                    faceDown={true}
                    playable={false}
                  />
                  {/* Flying card on draw */}
                  <AnimatePresence>
                    {drawAnimKey > 0 && (
                      <motion.div
                        key={drawAnimKey}
                        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 50 }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                        animate={{ x: -20, y: 100, opacity: 0, scale: 0.7, rotate: -15 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      >
                        <Card card={{ id: 'fly', color: 'wild', value: 'wild' }} faceDown={true} playable={false} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
              <span className="text-white/40 text-[10px] font-semibold">
                {gameState?.drawPile?.length ?? 0} left
              </span>
            </div>
          </GameBoard>

          {/* Player hand at the bottom */}
          <div style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 12px',
            position: 'relative', zIndex: 2,
          }}>
            <PlayerHand
              cards={myHand}
              playableCardIds={playableCardIds}
              onPlayCard={handlePlayCard}
            />
          </div>
        </div>

        {/* Chat panel on the right (desktop only) */}
        <div className="hidden lg:flex w-72" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 2 }}>
          <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
