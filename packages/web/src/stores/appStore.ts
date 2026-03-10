import { create } from 'zustand';

interface AppState {
  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // TODO: Phase 2 - User state
  // user: User | null;
  // setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
