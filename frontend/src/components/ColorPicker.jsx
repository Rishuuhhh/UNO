import React from 'react';

const COLORS = [
  { name: 'red', label: 'Red', bg: 'bg-red-500 hover:bg-red-400' },
  { name: 'blue', label: 'Blue', bg: 'bg-blue-500 hover:bg-blue-400' },
  { name: 'green', label: 'Green', bg: 'bg-green-500 hover:bg-green-400' },
  { name: 'yellow', label: 'Yellow', bg: 'bg-yellow-400 hover:bg-yellow-300' },
];

/**
 * Modal overlay with 4 color buttons for Wild / Wild_Draw_4 card plays.
 * @param {function} onColorSelect - called with the chosen color string
 * @param {function} onClose - called when the overlay backdrop is clicked
 */
export default function ColorPicker({ onColorSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      onClick={onClose}
      data-testid="color-picker-overlay"
    >
      <div
        className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="color-picker"
      >
        <h2 className="text-white font-bold text-lg">Choose a color</h2>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(({ name, label, bg }) => (
            <button
              key={name}
              className={`w-24 h-24 rounded-xl text-white font-bold text-base transition-transform hover:scale-105 ${bg}`}
              onClick={() => onColorSelect(name)}
              data-testid={`color-option-${name}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
