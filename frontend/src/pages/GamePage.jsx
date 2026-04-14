import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useSocket, clearSession } from '../hooks/useSocket';
import { useSound } from '../hooks/useSound';
import GameBoard from '../components/GameBoard';
import PlayerHand from '../components/PlayerHand';
import DiscardPile from '../components/DiscardPile';
import ColorPicker from '../components/ColorPicker';
import UnoButton from '../components/UnoButton';
import ChatPanel from '../components/ChatPanel';
import SettingsPanel from '../components/SettingsPanel';
import ReconnectOverlay from '../components/ReconnectOverlay';

const WILD_VALUES = new Set(['wild', 'wild4']);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function GamePage() {
  const { socket, reconnecting, reconnectCountdown, rejoining } = useSocket();
  const { gameState, myHand, players, myTurn, chatMessages, error } = useGameStore();
  const setError = useGameStore((s) => s.setError);
  const { play } = useSound();
  const isMobile = useIsMobile();

  const [pendingWildCard, setPendingWildCard]   = useState(null);
  const [toastError, setToastError]             = useState(null);
  const [drawAnimKey, setDrawAnimKey]           = useState(0);
  const [secondsLeft, setSecondsLeft]           = useState(30);
  const [showSettings, setShowSettings]         = useState(false);
  const [showChat, setShowChat]                 = useState(false);

  const timeWarnedRef       = useRef(false);
  const prevDiscardTopRef   = useRef(null);
  const prevMyTurnRef       = useRef(false);
  const lastTimeWarningRef  = useRef(0);

  const myId = socket?.id;

  // ── Error toast ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) { setToastError(error); play('error'); }
  }, [error, play]);

  // ── Sound: card played ───────────────────────────────────────────────────────
  useEffect(() => {
    const topCard = gameState?.discardPile?.[gameState.discardPile.length - 1];
    const topId = topCard?.id ?? null;
    if (topId && topId !== prevDiscardTopRef.current) {
      if (prevDiscardTopRef.current !== null) play('playCard');
      prevDiscardTopRef.current = topId;
    }
  }, [gameState?.discardPile, play]);

  // ── Sound: turn change ───────────────────────────────────────────────────────
  useEffect(() => {
    if (myTurn && !prevMyTurnRef.current) {
      play('turnChange');
      timeWarnedRef.current = false;
    }
    prevMyTurnRef.current = myTurn;
  }, [myTurn, play]);

  // ── Sound: win ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState?.status === 'finished') play('win');
  }, [gameState?.status, play]);

  // ── Turn timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const { turnStartedAt, turnTimeLimit } = gameState ?? {};
    if (!turnStartedAt || !turnTimeLimit) return;
    const interval = setInterval(() => {
      const left = Math.max(0, turnTimeLimit - Math.floor((Date.now() - turnStartedAt) / 1000));
      setSecondsLeft(left);
      if (left === 10 && !timeWarnedRef.current && myTurn) {
        const now = Date.now();
        if (now - lastTimeWarningRef.current > 5000) {
          timeWarnedRef.current = true;
          lastTimeWarningRef.current = now;
          play('timeWarning');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState?.turnStartedAt, gameState?.turnTimeLimit, myTurn, play]);

  const dismissToast = useCallback(() => {
    setToastError(null);
    setError(null);
  }, [setError]);

  // ── Playable cards ───────────────────────────────────────────────────────────
  const playableCardIds = React.useMemo(() => {
    if (!myTurn || !gameState) return new Set();
    const { currentColor, currentValue } = gameState;
    return new Set(
      myHand
        .filter((c) => WILD_VALUES.has(c.value) || c.color === currentColor || c.value === currentValue)
        .map((c) => c.id)
    );
  }, [myTurn, gameState, myHand]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePlayCard = useCallback((card) => {
    if (!socket || !myTurn) return;
    if (WILD_VALUES.has(card.value)) {
      setPendingWildCard(card);
    } else {
      socket.emit('play_card', { cardId: card.id });
      play('buttonClick');
    }
  }, [socket, myTurn, play]);

  const handleColorSelect = useCallback((color) => {
    if (!socket || !pendingWildCard) return;
    socket.emit('play_card', { cardId: pendingWildCard.id, chosenColor: color });
    setPendingWildCard(null);
    play('buttonClick');
  }, [socket, pendingWildCard, play]);

  const handleDrawCard = useCallback(() => {
    if (!socket || !myTurn) return;
    socket.emit('draw_card', {});
    setDrawAnimKey((k) => k + 1);
    play('drawCard');
  }, [socket, myTurn, play]);

  const handleUnoCall = useCallback(() => {
    if (!socket) return;
    socket.emit('uno_call', {});
    play('unoCall');
  }, [socket, play]);

  const handleSendMessage = useCallback((text) => {
    if (!socket) return;
    socket.emit('chat_message', { text });
  }, [socket]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const opponents = React.useMemo(
    () => (gameState?.players ?? players).filter((p) => p.id !== myId),
    [gameState, players, myId]
  );
  const topCard = gameState?.discardPile?.[gameState.discardPile.length - 1] ?? null;

  // ── Game-over screen ─────────────────────────────────────────────────────────
  if (gameState?.status === 'finished') {
    const { winnerName, scores } = gameState;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh', background: '#0f0f23',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 24, padding: 24, color: '#fff',
        }}
        data-testid="game-over-screen"
      >
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.1 }}
          style={{ fontSize: 42, fontWeight: 900, color: '#eab308', textShadow: '0 0 30px rgba(234,179,8,0.6)' }}
        >
          Game Over!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          🏆 {winnerName} wins!
        </motion.p>
        {scores && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
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
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.38 + i * 0.06 }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => { window.location.href = '/'; }}
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

  // ── Main game layout ─────────────────────────────────────────────────────────
  return (
    <div
      className="relative h-screen text-white overflow-hidden flex flex-col"
      style={{ background: '#0f0f23' }}
      data-testid="game-page"
    >
      {/* Reconnect / rejoin overlay */}
      <ReconnectOverlay
        reconnecting={reconnecting}
        rejoining={rejoining}
        countdown={reconnectCountdown}
        onGiveUp={() => { clearSession(); window.location.href = '/'; }}
      />

      {/* Turn timer bar — top edge */}
      {myTurn && gameState?.turnTimeLimit && (
        <div className="absolute top-0 left-0 right-0 z-40" style={{ height: 3 }}>
          <div
            style={{
              height: '100%',
              width: `${(secondsLeft / gameState.turnTimeLimit) * 100}%`,
              background: secondsLeft <= 10 ? '#ef4444' : '#6366f1',
              transition: 'width 1s linear, background 0.3s',
            }}
          />
        </div>
      )}

      {/* Error toast */}
      <AnimatePresence>
        {toastError && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              top: isMobile ? 8 : 12,
              maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
              background: 'rgba(127,29,29,0.9)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239,68,68,0.4)',
              boxShadow: '0 0 20px rgba(239,68,68,0.3), 0 8px 24px rgba(0,0,0,0.5)',
            }}
            role="alert"
            data-testid="error-toast"
          >
            <span style={{ fontSize: 13, color: 'rgba(254,202,202,0.95)', flex: 1 }}>{toastError}</span>
            <button
              onClick={dismissToast}
              style={{ color: 'rgba(252,165,165,0.7)', fontWeight: 900, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color picker */}
      <AnimatePresence>
        {pendingWildCard && (
          <ColorPicker
            onColorSelect={handleColorSelect}
            onClose={() => setPendingWildCard(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Top-right action buttons */}
      <div
        className="absolute z-30 flex items-center gap-2"
        style={{ top: 10, right: 10 }}
      >
        {isMobile && (
          <button
            onClick={() => setShowChat(true)}
            className="glass rounded-full flex items-center justify-center"
            style={{ width: 34, height: 34, fontSize: 15 }}
            aria-label="Chat"
          >💬</button>
        )}
        <button
          onClick={() => setShowSettings(true)}
          className="glass rounded-full flex items-center justify-center"
          style={{ width: 34, height: 34, fontSize: 15 }}
          aria-label="Settings"
        >⚙️</button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Game board column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Board: opponents + center piles */}
          <GameBoard gameState={gameState} myId={myId} opponents={opponents}>

            {/* Discard pile */}
            <DiscardPile topCard={topCard} />

            {/* Draw pile */}
            <div className="flex flex-col items-center" style={{ gap: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Draw</span>

              {/* Timer bar */}
              {gameState?.turnStartedAt && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: isMobile ? 40 : 48, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, (secondsLeft / (gameState.turnTimeLimit ?? 30)) * 100)}%`,
                      background: secondsLeft <= 10 ? '#ef4444' : '#6366f1',
                      borderRadius: 2,
                      transition: 'width 1s linear, background 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: secondsLeft <= 10 ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                    {secondsLeft}s
                  </span>
                </div>
              )}

              {/* Draw pile stack */}
              {(() => {
                const W = isMobile ? 48 : 64;
                const H = isMobile ? 72 : 96;
                const R = isMobile ? 8 : 10;
                return (
                  <div style={{ position: 'relative', width: W, height: H }}>
                    {[3, 2, 1].map((offset) => (
                      <div key={offset} style={{
                        position: 'absolute',
                        top: -offset * 1.5, left: offset * 1,
                        width: W, height: H, borderRadius: R,
                        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                        border: '1px solid rgba(150,130,255,0.2)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      }} />
                    ))}
                    <motion.div
                      key={drawAnimKey}
                      style={{ position: 'absolute', top: 0, left: 0, cursor: myTurn ? 'pointer' : 'default' }}
                      onClick={handleDrawCard}
                      data-testid="draw-pile"
                      aria-label="Draw a card"
                      whileHover={myTurn ? { y: -6, scale: 1.05 } : {}}
                      whileTap={myTurn ? { scale: 0.94 } : {}}
                      animate={drawAnimKey > 0 ? { y: [0, -10, 0] } : {}}
                      transition={{ duration: 0.25 }}
                    >
                      <div style={{
                        width: W, height: H, borderRadius: R,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
                        border: `1.5px solid ${myTurn ? 'rgba(99,102,241,0.6)' : 'rgba(150,130,255,0.35)'}`,
                        boxShadow: myTurn
                          ? '0 0 16px rgba(99,102,241,0.45), 0 4px 16px rgba(0,0,0,0.6)'
                          : '0 4px 14px rgba(0,0,0,0.6)',
                        position: 'relative', overflow: 'hidden',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                      }}>
                        <div style={{
                          position: 'absolute', inset: 4, borderRadius: R - 3,
                          border: '1px solid rgba(255,255,255,0.08)',
                          backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 2px,transparent 2px,transparent 6px)',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontWeight: 900, fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.22)', letterSpacing: 1 }}>UNO</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}

              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600 }}>
                {gameState?.drawPile?.length ?? 0} left
              </span>
            </div>
          </GameBoard>

          {/* Player hand — fixed at bottom of board column */}
          <div style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: isMobile ? '4px 4px 8px' : '6px 8px 10px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
            // Safe area for notched phones
            paddingBottom: isMobile ? 'max(8px, env(safe-area-inset-bottom))' : 10,
          }}>
            <PlayerHand
              cards={myHand}
              playableCardIds={playableCardIds}
              onPlayCard={handlePlayCard}
            />
          </div>
        </div>

        {/* Chat sidebar — desktop only */}
        {!isMobile && (
          <div style={{
            width: 240,
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            zIndex: 2,
          }}>
            <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
          </div>
        )}
      </div>

      {/* UNO button — above the hand */}
      <div
        className="absolute z-40"
        style={{
          // Position above the hand area; hand is ~90px on mobile, ~110px on desktop
          bottom: isMobile ? 'calc(max(8px, env(safe-area-inset-bottom)) + 88px)' : 118,
          right: isMobile ? 10 : 16,
        }}
      >
        <UnoButton visible={myHand.length === 1} onUnoCall={handleUnoCall} />
      </div>

      {/* Mobile chat drawer */}
      <AnimatePresence>
        {isMobile && showChat && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowChat(false)}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden"
              style={{
                height: '55vh',
                background: 'rgba(15,15,35,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
