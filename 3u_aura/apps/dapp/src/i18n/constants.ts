// Shared i18n constants - no server-only imports, safe for client
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const locales = ["en", "zh", "zh-Hant", "vi", "ko", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
