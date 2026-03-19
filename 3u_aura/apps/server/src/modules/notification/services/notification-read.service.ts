import { DbService, type User } from '@/db';
import {
  type DappNotificationItemView,
  type DappNotificationListQuery,
  type DappNotificationMarkReadRequest,
  type DappNotificationMarkReadResult,
  type DappNotificationUnreadCountView,
  type NotificationLocaleCode,
  NotificationLocaleCodeSchema,
  NotificationLocaleContentMapSchema,
  NotificationAudienceScope as CommonNotificationAudienceScope,
  NotificationCategory as CommonNotificationCategory,
  NotificationStatus as CommonNotificationStatus,
  type PaginateData,
} from '3u-aura-common';
import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class NotificationReadService {
  constructor(
    private readonly db: DbService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async listVisibleNotificationsForUser(
    user: Pick<User, 'id' | 'walletAddress'>,
    query: DappNotificationListQuery,
  ): Promise<PaginateData<DappNotificationItemView>> {
    const page = await this.notificationRepository.listVisibleNotificationsForUser(
      user.id,
      query,
    );

    return {
      ...page,
      items: page.items.map((item) => this.toDappView(item)),
    };
  }

  async getUnreadCountForUser(
    user: Pick<User, 'id' | 'walletAddress'>,
  ): Promise<DappNotificationUnreadCountView> {
    return {
      unreadCount: await this.notificationRepository.countUnreadForUser(user.id),
    };
  }

  async markReadForUser(
    user: Pick<User, 'id' | 'walletAddress'>,
    command: DappNotificationMarkReadRequest,
  ): Promise<DappNotificationMarkReadResult> {
    return this.db.$transaction(async (tx) => {
      const visibleIds = await this.notificationRepository.listVisibleNotificationIds(
        command.notificationIds,
        tx,
      );
      const updatedCount = await this.notificationRepository.createReadRecords(
        user.id,
        visibleIds,
        tx,
      );
      const unreadCount = await this.notificationRepository.countUnreadForUser(
        user.id,
        tx,
      );

      return {
        notificationIds: visibleIds,
        unreadCount,
        updatedCount,
      };
    });
  }

  private toDappView(item: {
    archivedAt: Date | null;
    archivedByWallet: string | null;
    audienceScope: string;
    category: string;
    createdAt: Date;
    createdByWallet: string | null;
    defaultLocale: string;
    id: string;
    localeContent: unknown;
    publishedAt: Date | null;
    publishedByWallet: string | null;
    reads: Array<{ readAt: Date }>;
    status: string;
    updatedAt: Date;
    updatedByWallet: string | null;
  }): DappNotificationItemView {
    const localeContent = NotificationLocaleContentMapSchema.safeParse(
      item.localeContent,
    );
    const defaultLocale = NotificationLocaleCodeSchema.safeParse(
      item.defaultLocale,
    );

    return {
      archivedAt: item.archivedAt ?? undefined,
      archivedByWallet: item.archivedByWallet ?? undefined,
      audienceScope:
        item.audienceScope as unknown as CommonNotificationAudienceScope,
      category: item.category as unknown as CommonNotificationCategory,
      createdAt: item.createdAt,
      createdByWallet: item.createdByWallet ?? undefined,
      defaultLocale: (defaultLocale.success
        ? defaultLocale.data
        : 'zh') as NotificationLocaleCode,
      id: item.id,
      isRead: Boolean(item.reads[0]),
      localeContent: localeContent.success ? localeContent.data : {},
      publishedAt: item.publishedAt ?? undefined,
      publishedByWallet: item.publishedByWallet ?? undefined,
      readAt: item.reads[0]?.readAt,
      status: item.status as unknown as CommonNotificationStatus,
      updatedAt: item.updatedAt,
      updatedByWallet: item.updatedByWallet ?? undefined,
    };
  }
}
