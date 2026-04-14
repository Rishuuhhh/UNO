import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen overlay shown while reconnecting or rejoining.
 * Props:
 *   reconnecting  — bool: socket dropped, counting down
 *   rejoining     — bool: socket back, waiting for server rejoin confirmation
 *   countdown     — number: seconds remaining before giving up
 *   onGiveUp      — fn: called when user manually gives up
 */
export default function ReconnectOverlay({ reconnecting, rejoining, countdown, onGiveUp }) {
  const visible = reconnecting || rejoining;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="reconnect-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10, 10, 20, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 24,
            color: '#fff',
          }}
        >
          {/* Spinner */}
          <div style={{
            width: 48, height: 48,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }} />
          <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>

          {/* Status text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              {rejoining ? 'Rejoining game…' : 'Connection lost'}
            </p>
            {reconnecting && (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                Reconnecting… giving up in{' '}
                <span style={{ color: countdown <= 10 ? '#ef4444' : '#a5b4fc', fontWeight: 700 }}>
                  {countdown}s
                </span>
              </p>
            )}
            {rejoining && (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                Restoring your session…
              </p>
            )}
          </div>

          {/* Countdown ring */}
          {reconnecting && (
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke={countdown <= 10 ? '#ef4444' : '#6366f1'}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdown / 60)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <span style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800,
                color: countdown <= 10 ? '#ef4444' : '#fff',
              }}>
                {countdown}
              </span>
            </div>
          )}

          {/* Give up button */}
          {reconnecting && (
            <button
              onClick={onGiveUp}
              style={{
                marginTop: 8,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                padding: '8px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Leave game
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
