"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useChainId, useConnect, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  useUserProfileQuery,
  userProfileQueryFn,
} from "@/queries/user.query";
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

  const handleLogin = async (name?: string) => {
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
        name: name || shortenAddress(address),
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

  const gradientStyle = {
    background: "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "inset 0px 0px 6px 3px rgba(255, 255, 255, 0.25)",
  };

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, openAccountModal, account }) => {
        if (!account) {
          return (
            <button
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
              data-testid="wallet-connect-button"
              className={cn(
                "flex h-[26px] items-center justify-center gap-[10px] rounded-[30px] px-3 text-xs font-medium leading-[26px] text-white",
                "hover:opacity-90 transition-opacity"
              )}
              style={gradientStyle}
            >
              {useAutomationInjectedWallet && isConnecting
                ? "Connecting..."
                : "Connect Wallet"}
            </button>
          );
        }

        return (
          <button
            onClick={
              isAuthenticated
                ? openAccountModal
                : () => handleLogin(account.displayName)
            }
            disabled={isSigning}
            data-testid={
              isAuthenticated ? "wallet-account-button" : "wallet-signin-button"
            }
            className={cn(
              "flex h-[26px] items-center justify-center gap-[10px] rounded-[30px] px-3 text-xs font-medium leading-[26px] text-white",
              "hover:opacity-90 transition-opacity"
            )}
            style={gradientStyle}
          >
            {isSigning ? "Signing..." : shortenAddress(account.address)}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
