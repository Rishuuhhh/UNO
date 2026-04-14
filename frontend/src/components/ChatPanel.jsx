import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CHARS = 200;

export default function ChatPanel({ messages = [], onSendMessage }) {
  const [input, setInput]     = useState('');
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSendMessage?.(text);
    setInput('');
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      data-testid="chat-panel"
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11, fontWeight: 700, letterSpacing: 2,
        color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
      }}>
        Chat
      </div>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}
        data-testid="chat-messages"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 16, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.8 }}
              style={{ fontSize: 12, lineHeight: 1.5 }}
            >
              <span style={{ fontWeight: 700, color: 'rgba(147,197,253,0.9)' }}>
                {msg.displayName ?? msg.senderId}:{' '}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>{msg.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', gap: 8, padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <motion.input
          type="text"
          placeholder="Say something…"
          maxLength={MAX_CHARS}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          data-testid="chat-input"
          animate={{
            boxShadow: focused
              ? '0 0 0 2px rgba(59,130,246,0.5), 0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 6px rgba(0,0,0,0.2)',
          }}
          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '7px 12px',
            color: '#fff', fontSize: 12, outline: 'none',
            transition: 'border-color 0.18s ease',
            borderColor: focused ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)',
          }}
        />
        <motion.button
          type="submit"
          data-testid="chat-send"
          whileHover={{ scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
          whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', fontWeight: 700, fontSize: 12,
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid rgba(150,180,255,0.3)',
            cursor: 'pointer', outline: 'none',
            boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
          }}
        >
          Send
        </motion.button>
      </form>
    </div>
  );
}
