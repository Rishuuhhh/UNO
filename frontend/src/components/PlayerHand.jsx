import React from 'react';
import Card from './Card';

/**
 * Renders the current player's hand as interactive Card components.
 * @param {Array} cards - array of card objects
 * @param {Set} playableCardIds - Set of card IDs that can be played
 * @param {function} onPlayCard - called with a card when it is played
 */
export default function PlayerHand({ cards = [], playableCardIds = new Set(), onPlayCard }) {
  return (
    <div
      className="flex flex-row gap-2 overflow-x-auto py-2 px-1"
      style={{ touchAction: 'pan-x' }}
      data-testid="player-hand"
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          playable={playableCardIds.has(card.id)}
          onClick={onPlayCard}
          draggable={playableCardIds.has(card.id)}
        />
      ))}
    </div>
  );
}
