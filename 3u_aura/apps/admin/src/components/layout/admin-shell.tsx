"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  ClipboardList,
  FilePenLine,
  Gem,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";
import { AdminWalletButton } from "@/components/auth/admin-wallet-button";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/users", icon: Users, label: "Users" },
  { href: "/dashboard/placements", icon: Activity, label: "Placements" },
  { href: "/dashboard/checkins", icon: ClipboardList, label: "Check-ins" },
  { href: "/dashboard/claims", icon: FilePenLine, label: "Claims" },
  { href: "/dashboard/nft-eligibility", icon: Gem, label: "NFT Eligibility" },
  { href: "/dashboard/audit", icon: Shield, label: "Audit" },
  { href: "/dashboard/ops", icon: Activity, label: "Ops" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:px-6">
        <aside className="rounded-[32px] border border-white/10 bg-[rgba(7,17,27,0.76)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-200/70">
              3U AURA
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Admin Console
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Promotion-phase operator surface for `chainId = 97`, audit, repair
              and exception handling.
            </p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-orange-500/18 text-orange-100"
                      : "text-slate-300 hover:bg-white/6 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Session Status
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {hasHydrated
                ? isAuthenticated
                  ? "Authenticated admin session"
                  : "Connect wallet and sign to access protected routes"
                : "Hydrating persisted admin session"}
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                Operator Surface
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Admin API routes are isolated under `/api/v1/admin/*`; user DApp
                routes stay under `/api/v1/*`.
              </p>
            </div>
            <AdminWalletButton />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
