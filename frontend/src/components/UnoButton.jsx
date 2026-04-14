import React from 'react';

/**
 * Prominent UNO call button shown when the player has exactly 1 card.
 * @param {boolean} visible - renders the button only when true
 * @param {function} onUnoCall - called when the button is clicked
 */
export default function UnoButton({ visible, onUnoCall }) {
  if (!visible) return null;

  return (
    <button
      className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-2xl uppercase tracking-widest px-8 py-4 rounded-full shadow-lg transition-transform"
      onClick={onUnoCall}
      data-testid="uno-button"
    >
      UNO!
    </button>
  );
}
