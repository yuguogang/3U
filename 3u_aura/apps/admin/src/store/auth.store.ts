import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClientUser } from "3u-aura-common";

interface AuthState {
  accessToken: null | string;
  authAddress: null | string;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  setAuthAddress: (address: null | string) => void;
  setHasHydrated: (hydrated: boolean) => void;
  setToken: (token: string) => void;
  setUser: (user: ClientUser | null) => void;
  logout: () => void;
  user: ClientUser | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      authAddress: null,
      hasHydrated: false,
      isAuthenticated: false,
      setAuthAddress(address) {
        set({ authAddress: address });
      },
      setHasHydrated(hydrated) {
        set({ hasHydrated: hydrated });
      },
      setToken(token) {
        set({ accessToken: token, isAuthenticated: true });
      },
      setUser(user) {
        set({ user });
      },
      logout() {
        set({
          accessToken: null,
          authAddress: null,
          isAuthenticated: false,
          user: null,
        });
      },
      user: null,
    }),
    {
      name: "admin-auth-store",
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          return;
        }
        if (state?.accessToken && !state.isAuthenticated) {
          state.setToken(state.accessToken);
        }
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        authAddress: state.authAddress,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);

export function useAdminSessionReady() {
  return useAuthStore((state) => state.hasHydrated && state.isAuthenticated);
}
