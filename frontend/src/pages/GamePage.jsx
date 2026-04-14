import React, { useState, useEffect, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
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

  // Pending wild card waiting for color selection
  const [pendingWildCard, setPendingWildCard] = useState(null);
  // Dismissible error toast
  const [toastError, setToastError] = useState(null);

  const myId = socket?.id;

  // Show error toast whenever store error changes
  useEffect(() => {
    if (error) {
      setToastError(error);
    }
  }, [error]);

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
    socket.emit('draw_card', {});
  }, [socket, myTurn]);

  const handleUnoCall = useCallback(() => {
    if (!socket) return;
    socket.emit('uno_call', {});
  }, [socket]);

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
      <div
        className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6"
        data-testid="game-over-screen"
      >
        <h1 className="text-4xl font-bold text-yellow-400">Game Over!</h1>
        <p className="text-2xl font-semibold">{winnerName} wins!</p>

        {scores && (
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">Scores</h2>
            <ul className="space-y-2">
              {Object.entries(scores).map(([playerId, score]) => {
                const player = (gameState.players ?? players).find((p) => p.id === playerId);
                const name = player?.displayName ?? playerId;
                return (
                  <li key={playerId} className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="font-bold text-yellow-300">{score} pts</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {finalCounts && (
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">Cards remaining</h2>
            <ul className="space-y-2">
              {Object.entries(finalCounts).map(([playerId, count]) => {
                const player = (gameState.players ?? players).find((p) => p.id === playerId);
                const name = player?.displayName ?? playerId;
                return (
                  <li key={playerId} className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span>{count} cards</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl"
          onClick={() => window.location.href = '/'}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // ── Main game board ─────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen bg-gray-900 text-white overflow-hidden" data-testid="game-page">
      {/* Error toast */}
      {toastError && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-800 border border-red-500 text-red-100 rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg"
          role="alert"
          data-testid="error-toast"
        >
          <span className="text-sm">{toastError}</span>
          <button
            className="text-red-300 hover:text-white font-bold text-lg leading-none"
            onClick={dismissToast}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

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

            {/* Draw pile button */}
            <button
              className="flex flex-col items-center gap-1 cursor-pointer"
              onClick={handleDrawCard}
              disabled={!myTurn}
              data-testid="draw-pile"
              aria-label="Draw a card"
            >
              <div className="w-16 h-24 bg-blue-900 border-2 border-blue-400 rounded-lg flex items-center justify-center text-blue-300 text-xs font-bold">
                DRAW
              </div>
              <span className="text-gray-400 text-xs">
                {gameState?.drawPile?.length ?? 0} left
              </span>
            </button>
          </GameBoard>

          {/* Player hand at the bottom */}
          <div className="bg-gray-800 border-t border-gray-700 p-3">
            <PlayerHand
              cards={myHand}
              playableCardIds={playableCardIds}
              onPlayCard={handlePlayCard}
            />
          </div>
        </div>

        {/* Chat panel on the right (desktop only) */}
        <div className="hidden lg:flex w-72 border-l border-gray-700">
          <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
