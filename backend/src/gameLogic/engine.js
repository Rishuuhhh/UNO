import { randomInt } from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['red', 'blue', 'green', 'yellow'];
const NUMBER_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTION_VALUES = ['skip', 'reverse', 'draw2'];

// ─── buildDeck ────────────────────────────────────────────────────────────────

/**
 * Builds a standard 108-card UNO deck with unique IDs per card.
 * @returns {import('../types.ts').Card[]}
 */
export function buildDeck() {
  const cards = [];

  for (const color of COLORS) {
    // One 0 card per color
    cards.push({ id: `${color}-0-0`, color, value: '0' });

    // Two each of 1–9 per color
    for (const value of NUMBER_VALUES.slice(1)) {
      cards.push({ id: `${color}-${value}-a`, color, value });
      cards.push({ id: `${color}-${value}-b`, color, value });
    }

    // Two each of skip, reverse, draw2 per color
    for (const value of ACTION_VALUES) {
      cards.push({ id: `${color}-${value}-a`, color, value });
      cards.push({ id: `${color}-${value}-b`, color, value });
    }
  }

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `wild-${i}`, color: 'wild', value: 'wild' });
  }

  // 4 Wild Draw 4 cards
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `wild4-${i}`, color: 'wild', value: 'wild4' });
  }

  return cards;
}

// ─── shuffleDeck ─────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle using crypto.randomInt for unbiased randomness.
 * Returns a new shuffled array (does not mutate input).
 * @param {import('../types.ts').Card[]} cards
 * @returns {import('../types.ts').Card[]}
 */
export function shuffleDeck(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── dealCards ───────────────────────────────────────────────────────────────

/**
 * Deals numCards from the front of drawPile to each player.
 * Returns a new gameState (immutable — does not mutate input).
 * @param {import('../types.ts').GameState} gameState
 * @param {number} numCards
 * @returns {import('../types.ts').GameState}
 */
export function dealCards(gameState, numCards) {
  const drawPile = [...gameState.drawPile];
  const players = gameState.players.map(p => ({ ...p, hand: [...p.hand] }));

  for (let i = 0; i < numCards; i++) {
    for (const player of players) {
      const card = drawPile.shift();
      if (card) {
        player.hand.push(card);
      }
    }
  }

  return { ...gameState, drawPile, players };
}

// ─── isValidMove ─────────────────────────────────────────────────────────────

/**
 * Returns true if the card can legally be played on the current game state.
 *
 * Rules:
 * - Wild / Wild_Draw_4: always valid (Wild_Draw_4 legality checked separately by isWild4Legal)
 * - Number cards (0-9): valid if color matches currentColor OR value matches currentValue
 * - Skip / Reverse / Draw_2: valid if color matches currentColor OR top card is same type (value matches)
 *
 * @param {import('../types.ts').Card} card
 * @param {import('../types.ts').GameState} gameState
 * @returns {boolean}
 */
export function isValidMove(card, gameState) {
  // Wild and Wild_Draw_4 are always valid plays
  if (card.value === 'wild' || card.value === 'wild4') return true;

  // All other cards (numbers, skip, reverse, draw2): color match OR value match
  return card.color === gameState.currentColor || card.value === gameState.currentValue;
}

// ─── isWild4Legal ─────────────────────────────────────────────────────────────

/**
 * Wild Draw 4 is only legal if the player holds no cards matching currentColor.
 * @param {import('../types.ts').Card} card
 * @param {import('../types.ts').GameState} gameState
 * @returns {boolean}
 */
export function isWild4Legal(card, gameState) {
  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  return !currentPlayer.hand.some(c => c.color === gameState.currentColor);
}

// ─── applyCardEffect ─────────────────────────────────────────────────────────

/**
 * Applies the effect of a played card to the game state.
 * Returns a new game state (immutable).
 * @param {import('../types.ts').Card} card
 * @param {import('../types.ts').GameState} gameState
 * @param {string} [chosenColor]
 * @returns {import('../types.ts').GameState}
 */
export function applyCardEffect(card, gameState, chosenColor) {
  let state = {
    ...gameState,
    currentColor: card.color === 'wild' ? chosenColor : card.color,
    currentValue: card.value,
  };

  const n = state.players.length;

  switch (card.value) {
    case 'skip':
      state = nextTurn(state);
      state = nextTurn(state);
      break;
    case 'reverse':
      if (n === 2) {
        // Acts as skip in 2-player game
        state = nextTurn(state);
        state = nextTurn(state);
      } else {
        state = { ...state, direction: /** @type {1 | -1} */ (state.direction * -1) };
        state = nextTurn(state);
      }
      break;
    case 'draw2': {
      const nextIdx = (state.currentTurnIndex + state.direction + n) % n;
      const drawPile = [...state.drawPile];
      const players = state.players.map((p, i) => {
        if (i !== nextIdx) return p;
        const drawn = drawPile.splice(0, 2);
        return { ...p, hand: [...p.hand, ...drawn] };
      });
      state = { ...state, drawPile, players };
      state = nextTurn(state);
      state = nextTurn(state);
      break;
    }
    case 'wild4': {
      const nextIdx = (state.currentTurnIndex + state.direction + n) % n;
      const drawPile = [...state.drawPile];
      const players = state.players.map((p, i) => {
        if (i !== nextIdx) return p;
        const drawn = drawPile.splice(0, 4);
        return { ...p, hand: [...p.hand, ...drawn] };
      });
      state = { ...state, drawPile, players };
      state = nextTurn(state);
      state = nextTurn(state);
      break;
    }
    default:
      state = nextTurn(state);
      break;
  }

  return state;
}

// ─── nextTurn ─────────────────────────────────────────────────────────────────

/**
 * Advances the turn index by one step in the current direction.
 * Returns a new game state (immutable).
 * @param {import('../types.ts').GameState} gameState
 * @returns {import('../types.ts').GameState}
 */
export function nextTurn(gameState) {
  const n = gameState.players.length;
  const currentTurnIndex =
    (gameState.currentTurnIndex + gameState.direction + n) % n;
  return { ...gameState, currentTurnIndex };
}

// ─── checkWin ─────────────────────────────────────────────────────────────────

/**
 * Returns the id of the winning player if any player has an empty hand, else null.
 * @param {import('../types.ts').GameState} gameState
 * @returns {string | null}
 */
export function checkWin(gameState) {
  const winner = gameState.players.find(p => p.hand.length === 0);
  return winner ? winner.id : null;
}

// ─── calculateScore ───────────────────────────────────────────────────────────

/**
 * Calculates scores: for each player, sum of point values of all OTHER players' remaining cards.
 * Number cards = face value; Skip/Reverse/Draw2 = 20; Wild/Wild4 = 50.
 * @param {import('../types.ts').Player[]} players
 * @returns {Map<string, number>}
 */
export function calculateScore(players) {
  const cardPoints = (card) => {
    if (['skip', 'reverse', 'draw2'].includes(card.value)) return 20;
    if (['wild', 'wild4'].includes(card.value)) return 50;
    return parseInt(card.value, 10);
  };

  const scores = new Map();
  for (const player of players) {
    const score = players
      .filter(p => p.id !== player.id)
      .flatMap(p => p.hand)
      .reduce((sum, card) => sum + cardPoints(card), 0);
    scores.set(player.id, score);
  }
  return scores;
}

// ─── drawCard ─────────────────────────────────────────────────────────────────

/**
 * Draws one card from the draw pile for the current player.
 * If the draw pile is empty, reshuffles the discard pile (minus the top card) into a new draw pile.
 * If both piles are empty after reshuffling, returns the game state unchanged.
 * Returns a new game state (immutable — does not mutate input).
 * @param {import('../types.ts').GameState} gameState
 * @returns {import('../types.ts').GameState}
 */
export function drawCard(gameState) {
  let drawPile = [...gameState.drawPile];
  let discardPile = [...gameState.discardPile];

  // Reshuffle discard pile into draw pile if draw pile is empty
  if (drawPile.length === 0) {
    if (discardPile.length <= 1) {
      // Both piles effectively empty — return unchanged
      return gameState;
    }
    const topCard = discardPile[discardPile.length - 1];
    const toShuffle = discardPile.slice(0, discardPile.length - 1);
    drawPile = shuffleDeck(toShuffle);
    discardPile = [topCard];
  }

  // Edge case: still empty after reshuffle attempt
  if (drawPile.length === 0) {
    return gameState;
  }

  const [drawnCard, ...remainingDrawPile] = drawPile;
  const players = gameState.players.map((p, i) => {
    if (i !== gameState.currentTurnIndex) return p;
    return { ...p, hand: [...p.hand, drawnCard] };
  });

  return { ...gameState, drawPile: remainingDrawPile, discardPile, players };
}

// ─── sanitizeStateForPlayer ───────────────────────────────────────────────────

/**
 * Strips other players' hands from the game state, replacing them with handCount.
 * @param {import('../types.ts').GameState} gameState
 * @param {string} playerId
 * @returns {import('../types.ts').ClientGameState}
 */
export function sanitizeStateForPlayer(gameState, playerId) {
  const players = gameState.players.map(p => {
    const { hand, ...rest } = p;
    return { ...rest, handCount: hand.length };
  });

  const myHand = gameState.players.find(p => p.id === playerId)?.hand ?? [];
  const { players: _players, ...stateWithoutPlayers } = gameState;

  return {
    ...stateWithoutPlayers,
    players,
    myHand,
    turnStartedAt: gameState.turnStartedAt ?? null,
    turnTimeLimit: gameState.turnTimeLimit ?? 30,
    gameStartedAt: gameState.gameStartedAt ?? null,
    gameTimeLimit: gameState.gameTimeLimit ?? 600,
    round: gameState.round ?? 1,
    totalRounds: gameState.totalRounds ?? 3,
  };
}
