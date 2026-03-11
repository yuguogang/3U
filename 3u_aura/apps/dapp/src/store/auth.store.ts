import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClientUser } from "3u-aura-common";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: ClientUser | null;
  authAddress: string | null;
  hasHydrated: boolean;
  setToken: (token: string) => void;
  setAuthAddress: (address: string | null) => void;
  setUser: (user: ClientUser | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      isAuthenticated: false,
      user: null,
      authAddress: null,
      hasHydrated: false,

      setToken(token) {
        set({
          accessToken: token,
          isAuthenticated: true,
        });
      },

      setAuthAddress(address) {
        set({ authAddress: address });
      },

      setUser(user) {
        set({ user });
      },

      setHasHydrated(hydrated) {
        set({ hasHydrated: hydrated });
      },

      logout() {
        set({
          accessToken: null,
          isAuthenticated: false,
          user: null,
          authAddress: null,
        });
      },
    }),
    {
      name: "auth-store", // localStorage
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        authAddress: state.authAddress,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        // 兜底：有 token 但 isAuthenticated 没恢复时，强制同步一次
        if (state?.accessToken && !state.isAuthenticated) {
          state.setToken(state.accessToken);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
