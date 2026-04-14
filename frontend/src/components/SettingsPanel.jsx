import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';

export default function SettingsPanel({ isOpen, onClose }) {
  const { isEnabled, setEnabled, getVolume, setVolume } = useSound();
  const [soundEnabled, setSoundEnabled] = useState(isEnabled());
  const [volume, setVolumeState] = useState(getVolume());

  useEffect(() => {
    setSoundEnabled(isEnabled());
    setVolumeState(getVolume());
  }, [isEnabled, getVolume]);

  const handleSoundToggle = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    setEnabled(newEnabled);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        initial={{ backdropFilter: 'blur(0px)', background: 'rgba(0,0,0,0)' }}
        animate={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.6)' }}
        exit={{ backdropFilter: 'blur(0px)', background: 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-strong rounded-2xl p-6 w-full max-w-md mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-smooth focus-ring"
            >
              <span className="text-white/70 text-lg">×</span>
            </button>
          </div>

          {/* Sound Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Audio</h3>
              
              {/* Sound Toggle */}
              <div className="flex items-center justify-between mb-4">
                <label className="text-white/80 font-medium">Sound Effects</label>
                <button
                  onClick={handleSoundToggle}
                  className={`
                    relative w-12 h-6 rounded-full transition-smooth focus-ring
                    ${soundEnabled ? 'bg-green-500' : 'bg-gray-600'}
                  `}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: soundEnabled ? 26 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Volume Slider */}
              <div className={`transition-opacity ${soundEnabled ? 'opacity-100' : 'opacity-50'}`}>
                <label className="block text-white/80 font-medium mb-2">
                  Volume: {Math.round(volume * 100)}%
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={!soundEnabled}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer focus-ring"
                    style={{
                      background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Game Settings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Game</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white/80">Reduced Motion</label>
                  <button className="relative w-12 h-6 rounded-full bg-gray-600 transition-smooth focus-ring">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-white/80">Auto-sort Hand</label>
                  <button className="relative w-12 h-6 rounded-full bg-gray-600 transition-smooth focus-ring">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">About</h3>
              <p className="text-white/60 text-sm">
                UNO Multiplayer v1.0.0
              </p>
              <p className="text-white/40 text-xs mt-1">
                Built with React, Socket.IO, and ❤️
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}