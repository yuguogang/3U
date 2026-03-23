"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetLocale } from "@/i18n/locale-actions";
import { type Locale, locales } from "@/i18n/constants";
import { cn } from "@/lib/utils";

const LOCALE_META: Record<
  Locale,
  { shortLabel: string; nativeLabel: string }
> = {
  en: {
    shortLabel: "EN",
    nativeLabel: "English",
  },
  zh: {
    shortLabel: "中",
    nativeLabel: "简体中文",
  },
  "zh-Hant": {
    shortLabel: "繁",
    nativeLabel: "繁體中文",
  },
  vi: {
    shortLabel: "VI",
    nativeLabel: "Tiếng Việt",
  },
  ko: {
    shortLabel: "한",
    nativeLabel: "한국어",
  },
  ja: {
    shortLabel: "日",
    nativeLabel: "日本語",
  },
};

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("Language");
  const setLocale = useSetLocale();
  const activeLocale = locales.includes(locale) ? locale : "zh";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/5 text-xs font-medium text-white/80 transition-all hover:bg-white/10",
            className,
          )}
          aria-label={t("switcherAria")}
          title={LOCALE_META[activeLocale].nativeLabel}
        >
          <Languages className="h-4 w-4 shrink-0 text-white/70" />
          <span className="sr-only">{LOCALE_META[activeLocale].nativeLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border border-white/10 bg-[#120d0f]/95 p-1.5 text-white shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-2 py-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
          {t("title")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={activeLocale}
          onValueChange={(nextLocale) => setLocale(nextLocale as Locale)}
        >
          {locales.map((candidate) => (
            <DropdownMenuRadioItem
              key={candidate}
              value={candidate}
              className="rounded-xl px-2 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex min-w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {LOCALE_META[candidate].shortLabel}
                </span>
                <span className="truncate">{LOCALE_META[candidate].nativeLabel}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
