"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useMyClaimsQuery } from "@/queries/claims.query";
import { 
  LayoutDashboard, 
  Users, 
  Gem, 
  Trophy, 
  Gift, 
  CalendarCheck,
  Plus
} from "lucide-react";

export type NavPage = "/" | "/checkin" | "/team" | "/nft" | "/rewards" | "/claims";

interface NavItem {
  id: NavPage;
  labelKey: "nav.dashboard" | "nav.checkin" | "nav.team" | "nav.rewards" | "nav.nft" | "nav.claims";
  icon: React.ElementType;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { id: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "/team", labelKey: "nav.team", icon: Users },
  { id: "/nft", labelKey: "nav.nft", icon: Gem },
  { id: "/rewards", labelKey: "nav.rewards", icon: Trophy },
];

export interface BottomNavProps {
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ className }) => {
  const pathname = usePathname();
  const t = useTranslations("Common");
  const { showActionMenu, setShowActionMenu } = useUIStore();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const claimsQuery = useMyClaimsQuery(isAuthenticated && hasHydrated);
  
  const pendingClaims = useMemo(() => {
    const merkleClaims = claimsQuery.data?.merkleClaims ?? [];
    const nftSubsidyClaims = claimsQuery.data?.nftSubsidyClaims ?? [];
    
    const claimableMerkle = merkleClaims.filter((claim) => claim.status === "CLAIMABLE").length;
    const claimableSubsidy = nftSubsidyClaims.filter((claim) => claim.status === "PENDING").length;
    
    return claimableMerkle + claimableSubsidy;
  }, [claimsQuery.data]);

  const actionItems: NavItem[] = [
    { id: "/checkin", labelKey: "nav.checkin", icon: CalendarCheck },
    { id: "/claims", labelKey: "nav.claims", icon: Gift, badge: pendingClaims },
  ];

  const handleMainNavClick = () => {
    setShowActionMenu(false);
  };

  const handleActionButtonClick = () => {
    setShowActionMenu(!showActionMenu);
  };

  const handleActionItemClick = () => {
    setShowActionMenu(false);
  };

  return (
    <>
      {/* Action Menu Overlay */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowActionMenu(false)}
        />
      )}

      {/* Action Menu Sheet */}
      {showActionMenu && (
        <div className="fixed bottom-24 left-1/2 z-50 w-full max-w-xs -translate-x-1/2 animate-slide-up">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141414] p-4 shadow-2xl">
            <p className="mb-3 px-2 text-xs text-white/50">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {actionItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.id;
                const badgeCount = item.badge;
                
                return (
                  <Link
                    key={item.id}
                    href={item.id}
                    onClick={handleActionItemClick}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl",
                      "bg-white/5 hover:bg-white/10 transition-all duration-200",
                      "border border-transparent hover:border-white/[0.08]",
                      isActive && "bg-aura-primary/10 border-aura-primary/30"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        "h-6 w-6",
                        isActive ? "text-aura-primary" : "text-white/70"
                      )} />
                      {badgeCount && badgeCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-aura-primary text-[10px] font-bold text-white">
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      ) : null}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isActive ? "text-aura-primary" : "text-white/70"
                    )}>
                      {t(item.labelKey)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.08]",
          "pb-[env(safe-area-inset-bottom,16px)]",
          className
        )}
      >
        <div className="mx-auto max-w-md px-4 py-2">
          <div className="flex items-center justify-between">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === "/" ? pathname === "/" : pathname.startsWith(item.id);
              
              return (
                <Link
                  key={item.id}
                  href={item.id}
                  onClick={handleMainNavClick}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl",
                    "transition-all duration-200",
                    isActive 
                      ? "text-aura-primary" 
                      : "text-white/50 hover:text-white/70"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive && "text-aura-primary"
                  )}>
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 h-1 w-1 rounded-full bg-aura-primary" />
                  )}
                </Link>
              );
            })}

            {/* Main Action Button (FAB) */}
            <div className="px-2">
              <button
                onClick={handleActionButtonClick}
                className={cn(
                  "relative -mt-10 h-14 w-14 rounded-full",
                  "bg-gradient-to-r from-aura-primary to-aura-primary-dark",
                  "flex items-center justify-center",
                  "shadow-glow transition-all duration-300",
                  "hover:scale-105 active:scale-95",
                  showActionMenu && "rotate-45"
                )}
              >
                <Plus className="h-6 w-6 text-white" />
                {pendingClaims > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-aura-primary">
                    {pendingClaims > 9 ? "9+" : pendingClaims}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
