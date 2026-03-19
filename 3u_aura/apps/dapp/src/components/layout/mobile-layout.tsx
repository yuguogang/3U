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
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[40vh] bg-[radial-gradient(circle_at_top,_rgba(250,43,21,0.15),_transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col pb-32">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-4 pt-3 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aura-primary to-aura-primary-dark flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <span className="text-white font-bold text-sm">3U</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-base font-semibold tracking-tight text-white leading-none">
                  {title || "AURA"}
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-white/40 leading-none">
                  {eyebrow}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationInboxEntry />
              <WalletButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6">
          {description && (
            <p className="mb-6 text-sm leading-relaxed text-white/60">
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
