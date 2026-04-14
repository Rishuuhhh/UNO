// ─── Serializer ───────────────────────────────────────────────────────────────
// Converts GameState ↔ MongoDB-compatible plain JSON

/**
 * Required fields for a valid GameState document.
 */
const REQUIRED_FIELDS = [
  'roomCode',
  'status',
  'players',
  'currentTurnIndex',
  'direction',
  'currentColor',
  'currentValue',
  'drawPile',
  'discardPile',
];

/**
 * Serializes a GameState object to a plain JSON-compatible object for MongoDB storage.
 * Returns a deep copy to avoid mutation issues.
 *
 * @param {import('../types.ts').GameState} gameState
 * @returns {Record<string, unknown>}
 */
export function serialize(gameState) {
  return JSON.parse(JSON.stringify(gameState));
}

/**
 * Deserializes a MongoDB document back to a GameState object.
 * Validates that all required fields are present.
 *
 * @param {Record<string, unknown>} doc
 * @returns {import('../types.ts').GameState}
 * @throws {Error} If any required field is missing
 */
export function deserialize(doc) {
  for (const field of REQUIRED_FIELDS) {
    if (doc[field] === undefined || doc[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return JSON.parse(JSON.stringify(doc));
}
