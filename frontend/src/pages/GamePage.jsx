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
