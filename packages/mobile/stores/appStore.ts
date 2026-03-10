import { create } from 'zustand';

interface AppState {
  // TODO: Phase 2 - User state
  // user: User | null;
  // setUser: (user: User | null) => void;

  // Offline state (Phase 7)
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),
}));
