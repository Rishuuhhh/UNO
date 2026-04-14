import { create } from 'zustand';

const initialState = {
  roomCode: null,      // string | null
  players: [],         // array of player objects
  myHand: [],          // array of card objects
  gameState: null,     // ClientGameState | null
  myTurn: false,       // boolean
  chatMessages: [],    // array of { senderId, text, timestamp }
  error: null,         // string | null
};

const useGameStore = create((set) => ({
  ...initialState,

  setRoomCode: (roomCode) => set({ roomCode }),

  setPlayers: (players) => set({ players }),

  setMyHand: (myHand) => set({ myHand }),

  setMyTurn: (myTurn) => set({ myTurn }),

  setGameState: (gameState) => set({ gameState }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}));

export default useGameStore;
