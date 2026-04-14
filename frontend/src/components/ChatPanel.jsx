import React, { useState, useRef, useEffect } from 'react';

const MAX_CHARS = 200;

/**
 * Chat panel with a scrollable message list and a text input.
 * @param {Array} messages - array of { senderId, displayName, text, timestamp }
 * @param {function} onSendMessage - called with the message string when submitted
 */
export default function ChatPanel({ messages = [], onSendMessage }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
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
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden" data-testid="chat-panel">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" data-testid="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-semibold text-blue-300">{msg.displayName ?? msg.senderId}: </span>
            <span className="text-gray-200">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-2 border-t border-gray-700">
        <input
          type="text"
          className="flex-1 bg-gray-800 text-white rounded px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Say something…"
          maxLength={MAX_CHARS}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          data-testid="chat-input"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded"
          data-testid="chat-send"
        >
          Send
        </button>
      </form>
    </div>
  );
}
