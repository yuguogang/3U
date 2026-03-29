"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { ChevronDown, Copy, Loader2, LogOut, Wallet } from "lucide-react";
import { DEVICES, SignatureScenarios } from "3u-aura-common";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/query.client";
import {
  useAuthSignatureMessageMutation,
  useAuthSigninBySignatureMutation,
} from "@/queries/auth.query";
import {
  useUserProfileQuery,
  userProfileQueryFn,
} from "@/queries/user.query";
import {
  normalizeReferralCode,
  PENDING_REFERRAL_CODE_STORAGE_KEY,
  resolvePendingReferralCode,
} from "@/lib/referral";
import { promotionChainId } from "@/lib/promotion-contracts";
import { useAuthStore } from "@/store/auth.store";

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}****${addr.slice(-4)}`;
}

function isSameAddress(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

function getChainLabel(chainId?: number) {
  if (chainId === 97) {
    return "BSC Testnet";
  }

  if (chainId === 56) {
    return "BNB Smart Chain";
  }

  return "Unknown network";
}

export function WalletButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const signMessage = useSignMessage();

  const {
    isAuthenticated,
    authAddress,
    hasHydrated,
    logout,
    setAuthAddress,
    setToken,
    setUser,
  } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const autoLoginAttemptedForAddressRef = useRef<string | null>(null);
  const wasConnectedRef = useRef(false);

  const signatureMessageMutation = useAuthSignatureMessageMutation();
  const signinMutation = useAuthSigninBySignatureMutation();
  const injectedConnector =
    connectors.find((connector) => connector.type === "injected") ??
    connectors[0] ??
    null;
  const liveStatusMessage = !isConnected
    ? "Wallet disconnected"
    : chainId !== promotionChainId
      ? "Wallet connected on the wrong network"
      : isSigning
        ? "Signature request in progress"
        : isAuthenticated
          ? "Wallet connected and authenticated"
          : "Wallet connected. Signature required to continue";

  const { data: userProfile } = useUserProfileQuery(
    isAuthenticated && hasHydrated,
  );
  const referralCodeFromUrl = normalizeReferralCode(searchParams.get("ref"));

  useEffect(() => {
    if (!referralCodeFromUrl || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      PENDING_REFERRAL_CODE_STORAGE_KEY,
      referralCodeFromUrl,
    );
  }, [pathname, referralCodeFromUrl]);

  useEffect(() => {
    if (userProfile && isAuthenticated) {
      setUser(userProfile);
    }
  }, [userProfile, isAuthenticated, setUser]);

  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected && wasConnectedRef.current && isAuthenticated) {
      logout();
      setIsMenuOpen(false);
      autoLoginAttemptedForAddressRef.current = null;
      wasConnectedRef.current = false;
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  }, [isAuthenticated, isConnected, logout]);

  useEffect(() => {
    if (!hasHydrated || !isConnected || !address || !isAuthenticated) {
      return;
    }

    if (isSameAddress(authAddress, address)) {
      return;
    }

    logout();
    setIsMenuOpen(false);
    autoLoginAttemptedForAddressRef.current = null;
    queryClient.removeQueries({ queryKey: ["profile"] });
  }, [address, authAddress, hasHydrated, isAuthenticated, isConnected, logout]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isConnected || !address) {
      autoLoginAttemptedForAddressRef.current = null;
      return;
    }
    if (isAuthenticated || isSigning) return;
    if (autoLoginAttemptedForAddressRef.current === address) return;

    autoLoginAttemptedForAddressRef.current = address;
    void handleLogin();
  }, [address, hasHydrated, isAuthenticated, isConnected, isSigning]);

  async function handleConnect() {
    if (!injectedConnector) {
      console.error("Injected wallet connector is unavailable");
      return;
    }

    try {
      await connectAsync({ connector: injectedConnector });
    } catch (error) {
      console.error("Wallet connect failed:", error);
    }
  }

  async function handleDisconnect() {
    setIsMenuOpen(false);

    try {
      await disconnectAsync();
    } catch (error) {
      console.error("Wallet disconnect failed:", error);
    } finally {
      logout();
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  }

  async function handleCopyAddress() {
    if (!address || typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Copy address failed:", error);
    }
  }

  async function handleSwitchNetwork() {
    if (!switchChainAsync) {
      return;
    }

    try {
      await switchChainAsync({ chainId: promotionChainId });
    } catch (error) {
      console.error("Network switch failed:", error);
    }
  }

  async function handleLogin(displayName?: string) {
    if (!address || isSigning || isAuthenticated) return;

    setIsSigning(true);
    try {
      const pendingReferralCode =
        resolvePendingReferralCode(referralCodeFromUrl);
      const { message } = await signatureMessageMutation.mutateAsync({
        address,
        scenario: SignatureScenarios.SIGNIN,
      });
      const signature = await signMessage.mutateAsync({ message });
      const res = await signinMutation.mutateAsync({
        address,
        name: displayName || shortenAddress(address),
        chain: chainId,
        message,
        signature,
        device: DEVICES.BROWSER,
        referralCode: pendingReferralCode ?? undefined,
      });

      setToken(res.accessToken);
      setAuthAddress(address);

      try {
        const userData = await queryClient.fetchQuery({
          queryKey: ["profile"],
          queryFn: userProfileQueryFn,
        });
        if (userData) {
          setUser(userData);
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(PENDING_REFERRAL_CODE_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsSigning(false);
    }
  }

  if (!hasHydrated) {
    return (
      <div
        aria-hidden={true}
        className="h-9 w-[120px] animate-pulse rounded-xl bg-[var(--shell-control)]"
      />
    );
  }

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className={cn(
          "goldmint-toolbar-pill flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all duration-200",
          "hover:scale-[1.02] active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        disabled={isConnecting}
        aria-label="Connect wallet"
        aria-busy={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleSwitchNetwork}
        disabled={chainId === promotionChainId || isSwitchingChain}
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl border px-2.5 text-sm font-medium transition-all",
          chainId === promotionChainId
            ? "goldmint-toolbar-pill hover:brightness-[1.05]"
            : "border-aura-error/30 bg-aura-error/10 text-aura-error hover:bg-aura-error/20",
        )}
        aria-label={`Current network: ${getChainLabel(chainId)}`}
      >
        <span className="hidden text-xs font-medium sm:inline">
          {getChainLabel(chainId)}
        </span>
        <span className="text-xs font-medium sm:hidden">
          {chainId === promotionChainId ? "BSC" : "Switch"}
        </span>
        {isSwitchingChain ? (
          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown
            className={cn(
              "h-3 w-3 flex-shrink-0",
              chainId === promotionChainId
                ? "text-[var(--shell-text-soft)]"
                : "text-aura-error/70",
            )}
          />
        )}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={
            isAuthenticated
              ? () => setIsMenuOpen((current) => !current)
              : () => handleLogin(shortenAddress(address))
          }
          disabled={isSigning}
          className={cn(
            "goldmint-toolbar-pill flex h-9 items-center gap-2 rounded-xl px-2.5 text-sm font-medium transition-all hover:brightness-[1.05]",
            isSigning && "opacity-60",
          )}
          aria-label={isAuthenticated ? "Account options" : "Sign in with wallet"}
          aria-busy={isSigning}
        >
          {isSigning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0 text-[var(--toolbar-pill-text)]" />
              <span className="hidden text-xs font-medium text-[var(--toolbar-pill-text)] sm:inline">
                Signing...
              </span>
            </>
          ) : (
            <>
              <span className="hidden font-mono text-xs sm:inline">
                {shortenAddress(address)}
              </span>
              <span className="font-mono text-[11px] sm:hidden">
                {address.slice(0, 4)}...
              </span>
              {isAuthenticated ? (
                <ChevronDown className="h-3 w-3 flex-shrink-0 text-[var(--toolbar-pill-text)]" />
              ) : null}
            </>
          )}
        </button>

        {isAuthenticated && isMenuOpen ? (
          <div className="absolute right-0 z-50 mt-2 w-40 rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface-strong)] p-1.5 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={handleCopyAddress}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--shell-copy)] transition hover:bg-[var(--shell-control-hover)]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy address
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--shell-copy)] transition hover:bg-[var(--shell-control-hover)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        ) : null}
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {liveStatusMessage}
      </span>
    </div>
  );
}
