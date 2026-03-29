"use client";

import { ReactNode } from "react";
import { GoldmintEmblem } from "@/components/branding/goldmint-emblem";
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
  eyebrow = "Goldmint Wealth Access",
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
        <header className="sticky top-0 z-30 overflow-hidden border-b border-[var(--toolbar-border)] bg-[var(--toolbar-bg)] shadow-[0_14px_34px_rgba(20,10,4,0.3)] backdrop-blur-xl transition-colors duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[rgba(255,239,196,0.65)]" />
          <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0),rgba(255,220,155,0.62),rgba(0,0,0,0))]" />
          <div className="px-4 pb-3 pt-3 flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="goldmint-plaque flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] p-1.5">
                <GoldmintEmblem compact className="h-full w-full" />
              </div>
              <div className="min-w-0 flex flex-col gap-1">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.32em] text-[#ecd7aa] leading-none">
                  {eyebrow}
                </p>
                <h1 className="font-brand truncate text-[1.15rem] font-semibold leading-none text-[#fff0c9] drop-shadow-[0_1px_1px_rgba(66,42,20,0.5)]">
                  {title || "Goldmint"}
                </h1>
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
