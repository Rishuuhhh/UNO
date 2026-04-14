// Shared TypeScript interfaces for the UNO multiplayer game

// ─── Card ────────────────────────────────────────────────────────────────────

export interface Card {
  id: string; // unique per deck instance, e.g. "red-5-a"
  color: "red" | "blue" | "green" | "yellow" | "wild";
  value:
    | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    | "skip" | "reverse" | "draw2"
    | "wild" | "wild4";
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string;           // socket id or stable reconnect id
  displayName: string;
  hand: Card[];
  isHost: boolean;
  isConnected: boolean;
  unoCalled: boolean;
  reconnectToken: string | null;
  disconnectedAt: number | null; // epoch ms
}

// ─── GameState ───────────────────────────────────────────────────────────────

export interface GameState {
  roomCode: string;
  status: "lobby" | "playing" | "finished";
  players: Player[];           // ordered turn array
  currentTurnIndex: number;    // index into players[]
  direction: 1 | -1;           // 1 = clockwise, -1 = counter-clockwise
  currentColor: "red" | "blue" | "green" | "yellow";
  currentValue: string;        // top card's value
  drawPile: Card[];
  discardPile: Card[];         // last element is top card
  pendingDrawCount: number;    // accumulated draw2/wild4 stack (0 if not stacking)
  drawnCardPending: boolean;   // true when current player drew and may optionally play it
  createdAt: number;
  updatedAt: number;
}

// Payload sent to each individual client — hands of other players are stripped
export interface ClientGameState extends Omit<GameState, "players"> {
  players: Array<Omit<Player, "hand"> & { handCount: number }>;
  myHand: Card[]; // only the receiving player's own cards
}

// ─── MongoDB Room Document ───────────────────────────────────────────────────

export type SerializedGameState = Record<string, unknown>;

export interface RoomDocument {
  _id: string;          // roomCode
  status: "lobby" | "playing" | "finished";
  hostId: string;
  players: Array<{ id: string; displayName: string; isConnected: boolean }>;
  gameState: SerializedGameState | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Socket Event Payloads — Client → Server ─────────────────────────────────

export interface CreateRoomPayload {
  displayName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  displayName: string;
}

export type LeaveRoomPayload = Record<string, never>;

export interface RejoinRoomPayload {
  token: string;
}

export type StartGamePayload = Record<string, never>;

export interface PlayCardPayload {
  cardId: string;
  chosenColor?: "red" | "blue" | "green" | "yellow";
}

export type DrawCardPayload = Record<string, never>;

export type UnoCallPayload = Record<string, never>;

export interface ChallengeUnoPayload {
  targetPlayerId: string;
}

export interface ChatMessagePayload {
  text: string;
}

// ─── Socket Event Payloads — Server → Client ─────────────────────────────────

export interface LobbyPlayer {
  id: string;
  displayName: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface RoomCreatedPayload {
  roomCode: string;
  lobbyState: {
    players: LobbyPlayer[];
    hostId: string;
  };
}

export interface LobbyUpdatedPayload {
  players: LobbyPlayer[];
  hostId: string;
}

export interface GameStartedPayload {
  myHand: Card[];
  gameState: ClientGameState;
}

export interface GameStateUpdatePayload {
  delta: Partial<GameState>;
}

export interface GameOverPayload {
  winnerId: string;
  winnerName: string;
  scores: Record<string, number>;
  finalCounts: Record<string, number>;
}

export interface ActionErrorPayload {
  message: string;
}

export interface RoomErrorPayload {
  message: string;
}

export interface ChatErrorPayload {
  message: string;
}

export interface RateLimitErrorPayload {
  message: string;
}

export interface ServerErrorPayload {
  message: string;
}

// ─── Socket Event Maps ────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  leave_room: (payload: LeaveRoomPayload) => void;
  rejoin_room: (payload: RejoinRoomPayload) => void;
  start_game: (payload: StartGamePayload) => void;
  play_card: (payload: PlayCardPayload) => void;
  draw_card: (payload: DrawCardPayload) => void;
  uno_call: (payload: UnoCallPayload) => void;
  challenge_uno: (payload: ChallengeUnoPayload) => void;
  chat_message: (payload: ChatMessagePayload) => void;
}

export interface ServerToClientEvents {
  room_created: (payload: RoomCreatedPayload) => void;
  lobby_updated: (payload: LobbyUpdatedPayload) => void;
  game_started: (payload: GameStartedPayload) => void;
  game_state_update: (payload: GameStateUpdatePayload) => void;
  game_over: (payload: GameOverPayload) => void;
  action_error: (payload: ActionErrorPayload) => void;
  room_error: (payload: RoomErrorPayload) => void;
  chat_error: (payload: ChatErrorPayload) => void;
  rate_limit_error: (payload: RateLimitErrorPayload) => void;
  server_error: (payload: ServerErrorPayload) => void;
}
