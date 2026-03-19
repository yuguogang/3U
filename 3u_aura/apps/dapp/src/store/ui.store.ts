import { create } from "zustand";

interface UIState {
  showActionMenu: boolean;
  setShowActionMenu: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showActionMenu: false,
  setShowActionMenu: (show) => set({ showActionMenu: show }),
}));
