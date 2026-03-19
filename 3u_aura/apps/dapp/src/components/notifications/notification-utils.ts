import type {
  DappNotificationItemView,
  NotificationCategory,
  NotificationLocalizedContent,
  NotificationLocaleCode,
} from "3u-aura-common";
import { defaultLocale, type Locale } from "@/i18n/constants";

export function resolveNotificationContent(
  notification: DappNotificationItemView,
  locale: string,
): NotificationLocalizedContent | null {
  const candidates = uniqueLocaleCandidates([
    locale,
    notification.defaultLocale,
    defaultLocale,
    "en",
    "zh",
  ]);

  for (const candidate of candidates) {
    const content = notification.localeContent[candidate];
    if (content) {
      return content;
    }
  }

  const firstContent = Object.values(notification.localeContent).find(Boolean);
  return firstContent ?? null;
}

export function formatNotificationDate(value?: Date | string) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function notificationCategoryTranslationKey(category: NotificationCategory) {
  return `notifications.categories.${category}` as const;
}

function uniqueLocaleCandidates(
  values: Array<string | Locale | NotificationLocaleCode | undefined>,
) {
  const seen = new Set<string>();
  const result: NotificationLocaleCode[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value as NotificationLocaleCode);
  }

  return result;
}
