"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useMyClaimsQuery } from "@/queries/claims.query";
import { useSetLocale } from "@/i18n/locale-actions";
import { type Locale, locales } from "@/i18n/constants";
import { 
  LayoutDashboard, 
  Users, 
  Gem, 
  Trophy, 
  Gift, 
  ArrowLeft,
  ChevronRight,
  CalendarCheck,
  Bell,
  Languages,
  Palette,
  Plus
} from "lucide-react";

export type NavPage = "/" | "/team" | "/nft" | "/rewards";

interface NavItem {
  id: NavPage;
  labelKey: "nav.dashboard" | "nav.team" | "nav.rewards" | "nav.nft";
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { id: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "/team", labelKey: "nav.team", icon: Users },
  { id: "/nft", labelKey: "nav.nft", icon: Gem },
  { id: "/rewards", labelKey: "nav.rewards", icon: Trophy },
];

type ThemeOption = {
  id: "night" | "day";
  labelKey: "moreMenu.themes.night" | "moreMenu.themes.day";
  previewClassName: string;
};

type MoreActionItem = {
  href: "/checkin" | "/claims" | "/notifications";
  label: string;
  icon: React.ElementType;
  badge?: number;
};

type PreferenceEntry = {
  id: "theme" | "language";
  labelKey: "moreMenu.theme" | "moreMenu.language";
  descriptionKey: "moreMenu.themeDescription" | "moreMenu.languageDescription";
  icon: React.ElementType;
};

const themeOptions: ThemeOption[] = [
  {
    id: "night",
    labelKey: "moreMenu.themes.night",
    previewClassName: "from-[#120b08] via-[#6f451c] to-[#f6dfab]",
  },
  {
    id: "day",
    labelKey: "moreMenu.themes.day",
    previewClassName: "from-[#fff8ee] via-[#d8ab57] to-[#6a4018]",
  },
];

const preferenceEntries: PreferenceEntry[] = [
  {
    id: "theme",
    labelKey: "moreMenu.theme",
    descriptionKey: "moreMenu.themeDescription",
    icon: Palette,
  },
  {
    id: "language",
    labelKey: "moreMenu.language",
    descriptionKey: "moreMenu.languageDescription",
    icon: Languages,
  },
];

const localeMeta: Record<Locale, { shortLabel: string; nativeLabel: string }> = {
  en: { shortLabel: "EN", nativeLabel: "English" },
  zh: { shortLabel: "中", nativeLabel: "简体中文" },
  "zh-Hant": { shortLabel: "繁", nativeLabel: "繁體中文" },
  vi: { shortLabel: "VI", nativeLabel: "Tiếng Việt" },
  ko: { shortLabel: "한", nativeLabel: "한국어" },
  ja: { shortLabel: "日", nativeLabel: "日本語" },
};

export interface BottomNavProps {
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ className }) => {
  const pathname = usePathname();
  const t = useTranslations("Common");
  const locale = useLocale() as Locale;
  const activeLocale = locales.includes(locale) ? locale : "zh";
  const setLocale = useSetLocale();
  const { theme, setTheme } = useTheme();
  const { showActionMenu, setShowActionMenu } = useUIStore();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const claimsQuery = useMyClaimsQuery(isAuthenticated && hasHydrated);
  const [detailView, setDetailView] = React.useState<"theme" | "language" | null>(
    null,
  );
  
  const pendingClaims = useMemo(() => {
    const merkleClaims = claimsQuery.data?.merkleClaims ?? [];
    const nftSubsidyClaims = claimsQuery.data?.nftSubsidyClaims ?? [];
    
    const claimableMerkle = merkleClaims.filter((claim) => claim.status === "CLAIMABLE").length;
    const claimableSubsidy = nftSubsidyClaims.filter((claim) => claim.status === "PENDING").length;
    
    return claimableMerkle + claimableSubsidy;
  }, [claimsQuery.data]);

  const activeTheme = (themeOptions.find((option) => option.id === theme) ?? themeOptions[0]).id;

  const actionItems: MoreActionItem[] = [
    { href: "/checkin", label: t("nav.checkin"), icon: CalendarCheck },
    { href: "/claims", label: t("nav.claims"), icon: Gift, badge: pendingClaims },
    { href: "/notifications", label: t("notifications.title"), icon: Bell },
  ];

  const handleMainNavClick = () => {
    setShowActionMenu(false);
    setDetailView(null);
  };

  const handleActionButtonClick = () => {
    if (showActionMenu) {
      setShowActionMenu(false);
      setDetailView(null);
      return;
    }

    setShowActionMenu(true);
  };

  const handleActionItemClick = () => {
    setShowActionMenu(false);
    setDetailView(null);
  };

  const handleCloseMenu = () => {
    setShowActionMenu(false);
    setDetailView(null);
  };

  const activeThemeLabel = t(
    themeOptions.find((option) => option.id === activeTheme)?.labelKey ??
      "moreMenu.themes.night",
  );

  const renderThemeDetail = () => (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold text-[#fff0c9]">{t("moreMenu.theme")}</p>
          <p className="mt-1 text-xs text-[#d6bf89]">
            {t("moreMenu.themeDescription")}
          </p>
        </div>
        <div className="goldmint-bronze-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]">
          {activeThemeLabel}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themeOptions.map((option) => {
          const isActive = activeTheme === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={cn(
                "goldmint-light-card goldmint-premium-tile goldmint-outline-card rounded-2xl p-2 text-left transition-all duration-200",
                isActive && "border-aura-primary/35 ring-1 ring-aura-primary/20 shadow-glow-sm",
              )}
            >
              <div
                className={cn(
                  "mb-2 h-14 rounded-xl bg-gradient-to-br",
                  option.previewClassName,
                )}
              />
              <span
                className={cn(
                  "block text-center text-[11px] font-medium",
                  isActive ? "text-aura-primary" : "text-[var(--shell-copy)]",
                )}
              >
                {t(option.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderLanguageDetail = () => (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold text-[#fff0c9]">{t("moreMenu.language")}</p>
          <p className="mt-1 text-xs text-[#d6bf89]">
            {t("moreMenu.languageDescription")}
          </p>
        </div>
        <div className="goldmint-bronze-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]">
          {localeMeta[activeLocale].shortLabel}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {locales.map((candidate) => {
          const isActive = activeLocale === candidate;

          return (
            <button
              key={candidate}
              type="button"
              onClick={() => setLocale(candidate)}
              className={cn(
                "goldmint-light-card goldmint-premium-tile goldmint-outline-card flex items-center gap-2 rounded-2xl px-3 py-3 text-left transition-all duration-200",
                isActive && "border-aura-primary/35 ring-1 ring-aura-primary/20",
              )}
            >
              <span className="inline-flex min-w-7 items-center justify-center rounded-md border border-[var(--shell-border)] bg-[var(--shell-soft-surface)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--shell-text-soft)]">
                {localeMeta[candidate].shortLabel}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  isActive ? "text-aura-primary" : "text-[var(--shell-copy)]",
                )}
              >
                {localeMeta[candidate].nativeLabel}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      {/* Action Menu Overlay */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-40 bg-[rgba(10,6,4,0.72)] backdrop-blur-sm"
          onClick={handleCloseMenu}
        />
      )}

      {/* More Menu Sheet */}
      {showActionMenu && (
        <div className="fixed bottom-24 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 animate-slide-up px-4">
          <div className="goldmint-sheet-panel goldmint-outline-card rounded-[28px] p-4 backdrop-blur-xl transition-colors duration-300">
            {detailView ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setDetailView(null)}
                  className="goldmint-toolbar-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition hover:brightness-[1.04]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("moreMenu.back")}
                </button>

                {detailView === "theme" ? renderThemeDetail() : null}
                {detailView === "language" ? renderLanguageDetail() : null}
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-3 px-1">
                  <div>
                    <p className="text-sm font-semibold text-[#fff0c9]">{t("moreMenu.title")}</p>
                    <p className="mt-1 text-xs text-[#d6bf89]">
                      {t("moreMenu.description")}
                    </p>
                  </div>
                  <div className="goldmint-bronze-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]">
                    {localeMeta[activeLocale].shortLabel}
                  </div>
                </div>

                <div className="space-y-4">
                  <section>
                    <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.2em] text-[#d6bf89]">
                      {t("moreMenu.quickActions")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {actionItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        const badgeCount = item.badge;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleActionItemClick}
                            className={cn(
                              "flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all duration-200",
                              "goldmint-light-card goldmint-premium-tile goldmint-outline-card hover:-translate-y-0.5",
                              isActive && "border-aura-primary/35 ring-1 ring-aura-primary/20",
                            )}
                          >
                            <div className="relative">
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  isActive ? "text-aura-primary" : "text-[var(--shell-text-muted)]",
                                )}
                              />
                              {badgeCount && badgeCount > 0 ? (
                                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-aura-primary text-[10px] font-bold text-white">
                                  {badgeCount > 9 ? "9+" : badgeCount}
                                </span>
                              ) : null}
                            </div>
                            <span
                                className={cn(
                                  "text-[11px] font-medium leading-tight",
                                  isActive ? "text-aura-primary" : "text-[var(--shell-copy)]",
                                )}
                              >
                                {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <div className="mb-2 flex items-center justify-between px-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#d6bf89]">
                        {t("moreMenu.preferences")}
                      </p>
                      <p className="text-[10px] text-[#b99a67]">
                        {t("moreMenu.preferencesHint")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {preferenceEntries.map((entry) => {
                        const Icon = entry.icon;
                        const summary =
                          entry.id === "theme"
                            ? activeThemeLabel
                            : localeMeta[activeLocale].nativeLabel;

                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => setDetailView(entry.id)}
                            className="goldmint-light-card goldmint-premium-tile goldmint-outline-card flex min-h-[96px] items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="goldmint-pill flex h-10 w-10 items-center justify-center rounded-2xl text-aura-primary">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--shell-title)]">
                                  {t(entry.labelKey)}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-[var(--shell-text-soft)]">
                                  {t(entry.descriptionKey)}
                                </p>
                                <p className="mt-1 truncate text-[11px] font-medium text-aura-primary">
                                  {summary}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--shell-text-soft)]" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-[var(--toolbar-border)] bg-[var(--toolbar-bg)] shadow-[0_-10px_28px_rgba(23,15,8,0.2)] backdrop-blur-xl transition-colors duration-300",
          "pb-[env(safe-area-inset-bottom,16px)]",
          className
        )}
      >
        <div className="mx-auto max-w-md px-4 py-2">
          <div className="goldmint-nav-shell relative rounded-[2rem] px-2 pb-2 pt-3">
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
                      "relative flex flex-col items-center gap-1 rounded-[1rem] px-3 py-2 transition-all duration-200",
                      isActive
                        ? "text-aura-primary"
                        : "text-[#e9d3a7] hover:text-[#fff0c9]",
                    )}
                  >
                    {isActive ? (
                      <div className="absolute inset-0 rounded-[1rem] bg-[linear-gradient(180deg,rgba(255,244,212,0.16),rgba(255,244,212,0.04))] shadow-[inset_0_1px_0_rgba(255,247,220,0.14)]" />
                    ) : null}
                    <Icon className={cn(
                      "relative h-5 w-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                    <span className={cn(
                      "relative text-[10px] font-medium",
                      isActive && "text-aura-primary"
                    )}>
                      {t(item.labelKey)}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-1 h-1 w-6 rounded-full bg-[linear-gradient(90deg,rgba(0,0,0,0),#d7ad64,rgba(0,0,0,0))]" />
                    )}
                  </Link>
                );
              })}

              <div className="px-2">
                <button
                  type="button"
                  onClick={handleActionButtonClick}
                  aria-label={t("moreMenu.triggerAria")}
                  className={cn(
                    "goldmint-metal-button relative -mt-10 h-14 w-14 rounded-full",
                    "flex items-center justify-center",
                    "shadow-glow transition-all duration-300",
                    "hover:scale-105 active:scale-95",
                    showActionMenu && "scale-105"
                  )}
                >
                  <Plus className="h-6 w-6 text-white" />
                  {pendingClaims > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--shell-badge-bg)] text-[10px] font-bold text-[var(--shell-badge-fg)]">
                      {pendingClaims > 9 ? "9+" : pendingClaims}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
