import {
  DbService,
  NotificationAudienceScope,
  NotificationStatus,
  Prisma,
} from '@/db';
import {
  paginate,
  type AdminNotificationListQuery,
  type DappNotificationListQuery,
} from '3u-aura-common';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

@Injectable()
export class NotificationRepository {
  constructor(private readonly db: DbService) {}

  async listAdminNotifications(
    query: AdminNotificationListQuery,
    executor: DbExecutor = this.db,
  ) {
    const { category, skip = 0, status, take = 20 } = query;
    const where = {
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    };

    return paginate({
      count: () => executor.notification.count({ where }),
      query: (pagination) =>
        executor.notification.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          ...pagination,
        }),
      skip,
      take,
    });
  }

  async createDraftNotification(
    data: {
      audienceScope: NotificationAudienceScope;
      category: Prisma.NotificationCreateInput['category'];
      createdByWallet?: string;
      defaultLocale: string;
      localeContent: Prisma.InputJsonValue;
      updatedByWallet?: string;
    },
    executor: DbExecutor = this.db,
  ) {
    return executor.notification.create({
      data: {
        audienceScope: data.audienceScope,
        category: data.category,
        createdByWallet: data.createdByWallet,
        defaultLocale: data.defaultLocale,
        localeContent: data.localeContent,
        updatedByWallet: data.updatedByWallet,
      },
    });
  }

  async findById(
    notificationId: string,
    executor: DbExecutor = this.db,
  ) {
    return executor.notification.findUnique({
      where: { id: notificationId },
    });
  }

  async updateDraftNotification(
    data: {
      audienceScope: NotificationAudienceScope;
      category: Prisma.NotificationUpdateInput['category'];
      defaultLocale: string;
      localeContent: Prisma.InputJsonValue;
      notificationId: string;
      updatedByWallet?: string;
    },
    executor: DbExecutor = this.db,
  ) {
    return executor.notification.update({
      where: { id: data.notificationId },
      data: {
        audienceScope: data.audienceScope,
        category: data.category,
        defaultLocale: data.defaultLocale,
        localeContent: data.localeContent,
        updatedByWallet: data.updatedByWallet,
      },
    });
  }

  async updateNotificationStatus(
    data: {
      archivedAt?: Date | null;
      archivedByWallet?: string | null;
      notificationId: string;
      publishedAt?: Date | null;
      publishedByWallet?: string | null;
      status: NotificationStatus;
      updatedByWallet?: string;
    },
    executor: DbExecutor = this.db,
  ) {
    return executor.notification.update({
      where: { id: data.notificationId },
      data: {
        archivedAt: data.archivedAt,
        archivedByWallet: data.archivedByWallet,
        publishedAt: data.publishedAt,
        publishedByWallet: data.publishedByWallet,
        status: data.status,
        updatedByWallet: data.updatedByWallet,
      },
    });
  }

  async listVisibleNotificationsForUser(
    userId: string,
    query: DappNotificationListQuery,
    executor: DbExecutor = this.db,
  ) {
    const { skip = 0, take = 20 } = query;
    const where = {
      audienceScope: NotificationAudienceScope.ALL_USERS,
      status: NotificationStatus.PUBLISHED,
    };

    return paginate({
      count: () => executor.notification.count({ where }),
      query: (pagination) =>
        executor.notification.findMany({
          where,
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          select: {
            archivedAt: true,
            archivedByWallet: true,
            audienceScope: true,
            category: true,
            createdAt: true,
            createdByWallet: true,
            defaultLocale: true,
            id: true,
            localeContent: true,
            publishedAt: true,
            publishedByWallet: true,
            reads: {
              where: { userId },
              orderBy: { readAt: 'desc' },
              select: { readAt: true },
              take: 1,
            },
            status: true,
            updatedAt: true,
            updatedByWallet: true,
          },
          ...pagination,
        }),
      skip,
      take,
    });
  }

  async countUnreadForUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<number> {
    return executor.notification.count({
      where: {
        audienceScope: NotificationAudienceScope.ALL_USERS,
        status: NotificationStatus.PUBLISHED,
        reads: {
          none: {
            userId,
          },
        },
      },
    });
  }

  async listVisibleNotificationIds(
    notificationIds: string[],
    executor: DbExecutor = this.db,
  ): Promise<string[]> {
    if (!notificationIds.length) {
      return [];
    }

    const rows = await executor.notification.findMany({
      where: {
        audienceScope: NotificationAudienceScope.ALL_USERS,
        id: { in: notificationIds },
        status: NotificationStatus.PUBLISHED,
      },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }

  async createReadRecords(
    userId: string,
    notificationIds: string[],
    executor: DbExecutor = this.db,
  ): Promise<number> {
    if (!notificationIds.length) {
      return 0;
    }

    const result = await executor.notificationRead.createMany({
      data: notificationIds.map((notificationId) => ({
        notificationId,
        userId,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }
}
