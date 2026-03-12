"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarCheck2,
  Gem,
  LayoutDashboard,
  ReceiptText,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletButton } from "@/components/wallet-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navItems = [
  { href: "/", labelKey: "nav.dashboard" as const, icon: LayoutDashboard },
  { href: "/checkin", labelKey: "nav.checkin" as const, icon: CalendarCheck2 },
  { href: "/team", labelKey: "nav.team" as const, icon: Users },
  { href: "/rewards", labelKey: "nav.rewards" as const, icon: Trophy },
  { href: "/nft", labelKey: "nav.nft" as const, icon: Gem },
  { href: "/claims", labelKey: "nav.claims" as const, icon: ReceiptText },
];

type MobileLayoutProps = {
  children: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function MobileLayout({
  children,
  title,
  description,
  eyebrow = "Promotion Baseline",
  actions,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations("Common");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,43,21,0.18),_transparent_30%),linear-gradient(180deg,_#050505_0%,_#101214_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-24 pt-4">
        <header className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-orange-300/75">
                {eyebrow}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {title}
              </h1>
            </div>
            <WalletButton />
          </div>
          {description ? (
            <p className="max-w-[28rem] text-sm leading-6 text-white/68">
              {description}
            </p>
          ) : null}
          {actions ? <div className="mt-4 flex flex-wrap gap-3">{actions}</div> : null}
        </header>

        <main className="flex-1">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-md rounded-[28px] border border-white/10 bg-black/70 px-2 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="grid grid-cols-6 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center transition-colors",
                    isActive
                      ? "bg-orange-500/18 text-orange-300"
                      : "text-white/55 hover:bg-white/6 hover:text-white/82",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.9} />
                  <span className="text-[10px] font-medium leading-none">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function GlassCard({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn(
        "rounded-[28px] border-white/10 bg-white/[0.045] text-white shadow-[0_18px_40px_rgba(0,0,0,0.2)] backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function GradientButton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "rounded-full border-none bg-[linear-gradient(180deg,#fa2b15_0%,#f44007_40%,#faa44b_100%)] px-5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] hover:opacity-90",
        className,
      )}
      variant={variant}
      {...props}
    />
  );
}
