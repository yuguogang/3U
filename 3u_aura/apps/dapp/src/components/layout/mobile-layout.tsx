"use client";

import { ReactNode } from "react";
import { NotificationInboxEntry } from "@/components/notifications/notification-inbox-entry";
import { WalletButton } from "@/components/wallet-button";
import { BottomNav } from "@/components/ui-custom/bottom-nav";

type MobileLayoutProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
};

export function MobileLayout({
  children,
  title,
  eyebrow = "Promotion Baseline",
  description,
  actions,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--shell-bg)] text-foreground transition-colors duration-300">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 h-[40vh] w-full max-w-md -translate-x-1/2"
          style={{ background: "var(--shell-top-glow)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col pb-32">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--shell-border)] bg-[var(--shell-chrome)] backdrop-blur-xl transition-colors duration-300">
          <div className="px-4 pt-3 pb-3 flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aura-primary to-aura-primary-dark flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <span className="text-white font-bold text-sm">3U</span>
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h1 className="truncate text-base font-semibold tracking-tight text-[var(--shell-title)] leading-none">
                  {title || "AURA"}
                </h1>
                <p className="truncate text-[10px] uppercase tracking-widest text-[var(--shell-text-soft)] leading-none">
                  {eyebrow}
                </p>
              </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1">
              <NotificationInboxEntry />
              <WalletButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6">
          {description && (
            <p className="mb-6 text-sm leading-relaxed text-[var(--shell-text-muted)]">
              {description}
            </p>
          )}
          {actions && <div className="mb-6 flex flex-wrap gap-3">{actions}</div>}
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
