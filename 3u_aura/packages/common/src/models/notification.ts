import type {
  NotificationAudienceScope,
  NotificationCategory,
  NotificationStatus,
} from '../enums';

export const NotificationLocaleCodes = [
  'en',
  'zh',
  'zh-Hant',
  'vi',
  'ko',
  'ja',
] as const;

export type NotificationLocaleCode = (typeof NotificationLocaleCodes)[number];

export interface NotificationLocalizedContent {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export type NotificationLocaleContentMap = Partial<
  Record<NotificationLocaleCode, NotificationLocalizedContent>
>;

export interface NotificationViewBase {
  id: string;
  audienceScope: NotificationAudienceScope;
  category: NotificationCategory;
  createdAt: Date;
  createdByWallet?: string;
  defaultLocale: NotificationLocaleCode;
  localeContent: NotificationLocaleContentMap;
  publishedAt?: Date;
  publishedByWallet?: string;
  status: NotificationStatus;
  updatedAt: Date;
  updatedByWallet?: string;
  archivedAt?: Date;
  archivedByWallet?: string;
}

export interface AdminNotificationItemView extends NotificationViewBase {}

export interface DappNotificationItemView extends NotificationViewBase {
  isRead: boolean;
  readAt?: Date;
}

export interface DappNotificationUnreadCountView {
  unreadCount: number;
}

export interface DappNotificationMarkReadResult {
  notificationIds: string[];
  unreadCount: number;
  updatedCount: number;
}
