/**
 * Token-bucket rate limiter per socket.
 * - 10 action tokens/second per socket
 * - 2 chat tokens/second per socket
 */

const ACTION_LIMIT = 10;   // tokens per second
const CHAT_LIMIT = 2;      // tokens per second
const WINDOW_MS = 1000;    // 1-second window

class RateLimiter {
  constructor() {
    // Map<socketId, { tokens: number, lastRefill: number }>
    this._actionBuckets = new Map();
    // Map<socketId, { tokens: number, lastRefill: number }>
    this._chatBuckets = new Map();
  }

  _getBucket(map, socketId, limit) {
    const now = Date.now();
    if (!map.has(socketId)) {
      map.set(socketId, { tokens: limit, lastRefill: now });
    }
    const bucket = map.get(socketId);
    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= WINDOW_MS) {
      const refills = Math.floor(elapsed / WINDOW_MS);
      bucket.tokens = Math.min(limit, bucket.tokens + refills * limit);
      bucket.lastRefill = bucket.lastRefill + refills * WINDOW_MS;
    }
    return bucket;
  }

  /**
   * Check if an action event is allowed for the given socket.
   * @param {string} socketId
   * @returns {boolean} true if allowed, false if rate limited
   */
  checkAction(socketId) {
    const bucket = this._getBucket(this._actionBuckets, socketId, ACTION_LIMIT);
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Check if a chat message is allowed for the given socket.
   * @param {string} socketId
   * @returns {boolean} true if allowed, false if rate limited
   */
  checkChat(socketId) {
    const bucket = this._getBucket(this._chatBuckets, socketId, CHAT_LIMIT);
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Remove tracking data for a socket (call on disconnect).
   * @param {string} socketId
   */
  cleanup(socketId) {
    this._actionBuckets.delete(socketId);
    this._chatBuckets.delete(socketId);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
export default RateLimiter;
