import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { useSound } from '../hooks/useSound';
import GameBoard from '../components/GameBoard';
import PlayerHand from '../components/PlayerHand';
import DiscardPile from '../components/DiscardPile';
import OpponentSlot from '../components/OpponentSlot';
import ColorPicker from '../components/ColorPicker';
import UnoButton from '../components/UnoButton';
import ChatPanel from '../components/ChatPanel';

const WILD_VALUES = new Set(['wild', 'wild4']);

export default function GamePage() {
  const { socket } = useSocket();
  const { gameState, myHand, players, myTurn, chatMessages, error } = useGameStore();
  const setError = useGameStore((s) => s.setError);
  const { play } = useSound();

  // Pending wild card waiting for color selection
  const [pendingWildCard, setPendingWildCard] = useState(null);
  // Dismissible error toast
  const [toastError, setToastError] = useState(null);
  // Incremented each draw to trigger animation
  const [drawAnimKey, setDrawAnimKey] = useState(0);
  // Turn timer countdown
  const [secondsLeft, setSecondsLeft] = useState(30);
  const timeWarnedRef = useRef(false);
  // Track previous discard top for playCard sound
  const prevDiscardTopRef = useRef(null);
  // Track previous myTurn for turnChange sound
  const prevMyTurnRef = useRef(false);

  const myId = socket?.id;

  // Show error toast whenever store error changes
  useEffect(() => {
    if (error) {
      setToastError(error);
    }
  }, [error]);

  // Sound: playCard when discard pile top changes
  useEffect(() => {
    const topCard = gameState?.discardPile?.[gameState.discardPile.length - 1];
    const topId = topCard?.id ?? null;
    if (topId && topId !== prevDiscardTopRef.current) {
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
