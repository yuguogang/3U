"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useChainId, useConnect, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  useUserProfileQuery,
  userProfileQueryFn,
} from "@/queries/user.query";
import { promotionChainId } from "@/lib/promotion-contracts";
import {
  useAuthSignatureMessageMutation,
  useAuthSigninBySignatureMutation,
} from "@/queries/auth.query";
import { queryClient } from "@/lib/query.client";
import { DEVICES, SignatureScenarios } from "3u-aura-common";

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}****${addr.slice(-4)}`;
}

function isSameAddress(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const signMessage = useSignMessage();

  const {
    isAuthenticated,
    authAddress,
    hasHydrated,
    setToken,
    setAuthAddress,
    setUser,
    logout,
  } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);
  const useAutomationInjectedWallet =
    process.env.NEXT_PUBLIC_E2E_INJECTED_WALLET === "true";
  const autoLoginAttemptedForAddressRef = useRef<string | null>(null);
  // 记录 wagmi 是否曾经连接过，用于区分"初始加载"和"真正断开"
  const wasConnectedRef = useRef(false);

  const signatureMessageMutation = useAuthSignatureMessageMutation();
  const signinMutation = useAuthSigninBySignatureMutation();
  const automationConnector =
    connectors.find((connector) => connector.type === "injected") ?? null;
  const liveStatusMessage = !isConnected
    ? "Wallet disconnected"
    : chainId !== promotionChainId
    ? "Wallet connected on the wrong network"
    : isSigning
    ? "Signature request in progress"
    : isAuthenticated
    ? "Wallet connected and authenticated"
    : "Wallet connected. Signature required to continue";

  // 当已登录时，获取用户信息
  const { data: userProfile } = useUserProfileQuery(
    isAuthenticated && hasHydrated,
  );

  // 同步用户信息到 store
  useEffect(() => {
    if (userProfile && isAuthenticated) {
      setUser(userProfile);
    }
  }, [userProfile, isAuthenticated, setUser]);

  // 记录 wagmi 连接状态变化
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    }
  }, [isConnected]);

  // 钱包真正断开后清理登录态（仅在 connected → disconnected 时触发，不会在初始加载时误触发）
  useEffect(() => {
    if (!isConnected && wasConnectedRef.current && isAuthenticated) {
      logout();
      autoLoginAttemptedForAddressRef.current = null;
      wasConnectedRef.current = false;
      queryClient.removeQueries({ queryKey: ["profile"] });
    }
  }, [isConnected, isAuthenticated, logout]);

  // 连接状态下切换 address：强制重新签名登录，确保 token 与 address 对齐
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isConnected || !address) return;
    if (!isAuthenticated) return;

    // 地址一致则无需重新登录
    if (isSameAddress(authAddress, address)) return;

    // 地址不同或旧数据没记录 authAddress，强制重新登录
    logout();
    autoLoginAttemptedForAddressRef.current = null;
    queryClient.removeQueries({ queryKey: ["profile"] });
  }, [isConnected, address, isAuthenticated, authAddress, hasHydrated, logout]);

  // 钱包连接后如果还未登录：自动触发签名登录
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isConnected || !address) {
      autoLoginAttemptedForAddressRef.current = null;
      return;
    }
    if (isAuthenticated || isSigning) return;

    // 防止同一个 address 连续反复弹签名
    if (autoLoginAttemptedForAddressRef.current === address) return;
    autoLoginAttemptedForAddressRef.current = address;

    void handleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isAuthenticated, isSigning, hasHydrated]);

  const handleLogin = async (displayName?: string) => {
    if (!address || isSigning || isAuthenticated) return;
    setIsSigning(true);
    try {
      // 1) 拉取服务端生成的待签名消息（包含 nonce/过期时间）
      const { message } = await signatureMessageMutation.mutateAsync({
        address,
        scenario: SignatureScenarios.SIGNIN,
      });

      // 2) 钱包签名（wagmi v3：使用 mutateAsync）
      const signature = await signMessage.mutateAsync({ message });

      // 3) 发给服务端验签并换取 JWT
      const res = await signinMutation.mutateAsync({
        address,
        // 新用户创建时服务端要求 name，优先用 RainbowKit 的 displayName
        name: displayName || shortenAddress(address),
        chain: chainId,
        signature,
        device: DEVICES.BROWSER,
      });

      // 4) 保存 accessToken（fetchClient 会自动注入 Authorization）
      setToken(res.accessToken);
      setAuthAddress(address);

      // 5) 登录成功后获取用户信息并存储到 store
      // 使用 queryClient.fetchQuery 确保立即获取用户信息
      try {
        const userData = await queryClient.fetchQuery({
          queryKey: ["profile"],
          queryFn: userProfileQueryFn,
        });
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <div
              aria-hidden={true}
              className="w-[120px] h-9 rounded-xl bg-white/5 animate-pulse"
            />
          );
        }

        if (!connected) {
          return (
            <button
              type="button"
              onClick={async () => {
                if (useAutomationInjectedWallet) {
                  if (!automationConnector) {
                    console.error("Automation injected connector is unavailable");
                    return;
                  }
                  try {
                    await connectAsync({ connector: automationConnector });
                  } catch (error) {
                    console.error("Wallet connect failed:", error);
                  }
                  return;
                }
                openConnectModal();
              }}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-all duration-200",
                "bg-gradient-to-r from-aura-primary to-aura-primary-dark shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              disabled={isConnecting}
              aria-label="Connect wallet"
              aria-busy={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Connect</span>
                </>
              )}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-aura-error/30 bg-aura-error/10 px-4 text-sm font-medium text-aura-error transition-all hover:bg-aura-error/20"
              aria-label="Wrong network - click to switch"
            >
              Wrong Network
              <ChevronDown className="w-3 h-3" />
            </button>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openChainModal}
              className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/5 px-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
              aria-label={`Current network: ${chain.name}`}
            >
              {chain.hasIcon && (
                <div
                  className="h-4 w-4 overflow-hidden rounded-full flex-shrink-0"
                  style={{ background: chain.iconBackground }}
                >
                  {chain.iconUrl && (
                    <img
                      alt={chain.name ?? "Chain icon"}
                      src={chain.iconUrl}
                      className="h-4 w-4"
                    />
                  )}
                </div>
              )}
              <span className="text-xs font-medium hidden sm:inline">{chain.name}</span>
              <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />
            </button>

            <button
              type="button"
              onClick={
                isAuthenticated
                  ? openAccountModal
                  : () => handleLogin(account.displayName)
              }
              disabled={isSigning}
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/5 px-2.5 text-sm font-medium text-white transition-all hover:bg-white/10",
                isSigning && "opacity-60"
              )}
              aria-label={isAuthenticated ? "Account options" : "Sign in with wallet"}
              aria-busy={isSigning}
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60 flex-shrink-0" />
                  <span className="text-xs font-medium text-white/60 hidden sm:inline">Signing...</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs hidden sm:inline">{account.displayName}</span>
                  <span className="font-mono text-[11px] sm:hidden">{account.displayBalance ? `${account.displayBalance.slice(0, 6)}...` : account.address.slice(0, 4)}</span>
                  {!isAuthenticated && <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />}
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {liveStatusMessage}
            </span>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
