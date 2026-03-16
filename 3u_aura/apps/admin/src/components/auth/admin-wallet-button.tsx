"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, ShieldEllipsis } from "lucide-react";
import { useAccount, useChainId, useConnect, useSignMessage } from "wagmi";
import { DEVICES, SignatureScenarios } from "3u-aura-common";
import { queryClient } from "@/lib/query.client";
import {
  useAdminLogoutMutation,
  useAdminMeQuery,
  useAdminSigninMutation,
  useSignatureMessageMutation,
} from "@/queries/auth.query";
import { useAuthStore } from "@/store/auth.store";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isSameAddress(a?: null | string, b?: null | string) {
  if (!a || !b) {
    return false;
  }

  return a.toLowerCase() === b.toLowerCase();
}

export function AdminWalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const signMessage = useSignMessage();

  const {
    authAddress,
    hasHydrated,
    isAuthenticated,
    logout,
    setAuthAddress,
    setToken,
    setUser,
    user,
  } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const useAutomationInjectedWallet =
    process.env.NEXT_PUBLIC_E2E_INJECTED_WALLET === "true";

  const signatureMessageMutation = useSignatureMessageMutation();
  const signinMutation = useAdminSigninMutation();
  const logoutMutation = useAdminLogoutMutation();
  const adminMeQuery = useAdminMeQuery(hasHydrated && isAuthenticated);
  const automationConnector =
    connectors.find((connector) => connector.type === "injected") ?? null;

  useEffect(() => {
    if (adminMeQuery.data?.user) {
      setUser(adminMeQuery.data.user);
    }
  }, [adminMeQuery.data, setUser]);

  useEffect(() => {
    if (useAutomationInjectedWallet) {
      return;
    }

    if (adminMeQuery.error && isAuthenticated) {
      logout();
      queryClient.removeQueries({ queryKey: ["admin"] });
      setErrorMessage(adminMeQuery.error.message);
    }
  }, [adminMeQuery.error, isAuthenticated, logout, useAutomationInjectedWallet]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (useAutomationInjectedWallet) {
      return;
    }

    if (!isConnected && isAuthenticated) {
      logout();
      queryClient.removeQueries({ queryKey: ["admin"] });
      return;
    }

    if (address && isAuthenticated && !isSameAddress(authAddress, address)) {
      logout();
      queryClient.removeQueries({ queryKey: ["admin"] });
    }
  }, [
    address,
    authAddress,
    hasHydrated,
    isAuthenticated,
    isConnected,
    logout,
    useAutomationInjectedWallet,
  ]);

  async function handleAuthenticate(displayName?: string) {
    if (!address || isSigning) {
      return;
    }

    setErrorMessage(null);
    setIsSigning(true);

    try {
      const { message } = await signatureMessageMutation.mutateAsync({
        address,
        scenario: SignatureScenarios.SIGNIN,
      });
      const signature = await signMessage.mutateAsync({ message });
      const result = await signinMutation.mutateAsync({
        address,
        chain: chainId,
        device: DEVICES.BROWSER,
        name: displayName || shortenAddress(address),
        signature,
      });

      setToken(result.accessToken);
      setAuthAddress(address);
      setUser(result.user);

      await queryClient.invalidateQueries({ queryKey: ["admin", "auth"] });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Admin authentication failed",
      );
      logout();
    } finally {
      setIsSigning(false);
    }
  }

  async function handleLogout() {
    try {
      if (isAuthenticated) {
        await logoutMutation.mutateAsync();
      }
    } finally {
      logout();
      queryClient.removeQueries({ queryKey: ["admin"] });
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <ConnectButton.Custom>
        {({ account, openAccountModal, openConnectModal }) => {
          if (!account) {
            return (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-100 transition hover:bg-orange-500/25"
                data-testid="admin-wallet-connect-button"
                onClick={async () => {
                  if (useAutomationInjectedWallet) {
                    if (!automationConnector) {
                      setErrorMessage(
                        "Automation injected connector is unavailable",
                      );
                      return;
                    }

                    try {
                      setErrorMessage(null);
                      await connectAsync({ connector: automationConnector });
                    } catch (error) {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : "Wallet connect failed",
                      );
                    }
                    return;
                  }

                  openConnectModal();
                }}
                type="button"
              >
                <ShieldEllipsis className="h-4 w-4" />
                {useAutomationInjectedWallet && isConnecting
                  ? "Connecting..."
                  : "Connect Wallet"}
              </button>
            );
          }

          if (!isAuthenticated) {
            return (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSigning}
                data-testid="admin-wallet-signin-button"
                onClick={() => handleAuthenticate(account.displayName)}
                type="button"
              >
                <ShieldCheck className="h-4 w-4" />
                {isSigning ? "Signing..." : "Sign In as Admin"}
              </button>
            );
          }

          return (
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                data-testid="admin-wallet-account-button"
                onClick={openAccountModal}
                type="button"
              >
                {user?.walletAddress ? shortenAddress(user.walletAddress) : shortenAddress(account.address)}
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                data-testid="admin-wallet-signout-button"
                onClick={handleLogout}
                type="button"
              >
                Sign Out
              </button>
            </div>
          );
        }}
      </ConnectButton.Custom>
      {errorMessage ? (
        <p className="max-w-sm text-right text-xs text-rose-300">{errorMessage}</p>
      ) : null}
    </div>
  );
}
