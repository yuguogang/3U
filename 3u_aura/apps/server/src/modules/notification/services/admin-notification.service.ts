import {
  NotificationStatus as DbNotificationStatus,
  type User,
} from '@/db';
import { AuditTrailService } from '../../audit';
import {
  type AdminNotificationCreateRequest,
  type AdminNotificationItemView,
  type AdminNotificationListQuery,
  type AdminNotificationPublishRequest,
  type AdminNotificationUnpublishRequest,
  type AdminNotificationUpdateRequest,
  type AdminNotificationArchiveRequest,
  type NotificationLocaleCode,
  NotificationLocaleCodeSchema,
  NotificationLocaleContentMapSchema,
  NotificationStatus as CommonNotificationStatus,
  NotificationCategory as CommonNotificationCategory,
  NotificationAudienceScope as CommonNotificationAudienceScope,
  type PaginateData,
} from '3u-aura-common';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

type AdminOperator = Pick<User, 'id' | 'walletAddress'>;

@Injectable()
export class AdminNotificationService {
  constructor(
    private readonly auditTrailService: AuditTrailService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async listNotifications(
    query: AdminNotificationListQuery,
  ): Promise<PaginateData<AdminNotificationItemView>> {
    const page = await this.notificationRepository.listAdminNotifications(query);

    return {
      ...page,
      items: page.items.map((item) => this.toAdminView(item)),
    };
  }

  async createDraft(
    operator: AdminOperator,
    command: AdminNotificationCreateRequest,
  ): Promise<AdminNotificationItemView> {
    const notification = await this.notificationRepository.createDraftNotification(
      {
        audienceScope: command.audienceScope,
        category: command.category,
        createdByWallet: operator.walletAddress,
        defaultLocale: command.defaultLocale,
        localeContent: command.localeContent,
        updatedByWallet: operator.walletAddress,
      },
    );

    await this.auditTrailService.record({
      action: 'admin.notifications.create-draft',
      operatorWallet: operator.walletAddress,
      payload: {
        audienceScope: command.audienceScope,
        category: command.category,
        defaultLocale: command.defaultLocale,
      },
      targetId: notification.id,
      targetType: 'Notification',
    });

    return this.toAdminView(notification);
  }

  async updateDraft(
    operator: AdminOperator,
    command: AdminNotificationUpdateRequest,
  ): Promise<AdminNotificationItemView> {
    const existing = await this.getNotificationOrThrow(command.notificationId);
    if (existing.status !== DbNotificationStatus.DRAFT) {
      throw new ConflictException('Only draft notifications can be edited');
    }

    const notification = await this.notificationRepository.updateDraftNotification(
      {
        audienceScope: command.audienceScope,
        category: command.category,
        defaultLocale: command.defaultLocale,
        localeContent: command.localeContent,
        notificationId: command.notificationId,
        updatedByWallet: operator.walletAddress,
      },
    );

    await this.auditTrailService.record({
      action: 'admin.notifications.update-draft',
      operatorWallet: operator.walletAddress,
      payload: {
        audienceScope: command.audienceScope,
        category: command.category,
        defaultLocale: command.defaultLocale,
      },
      targetId: notification.id,
      targetType: 'Notification',
    });

    return this.toAdminView(notification);
  }

  async publish(
    operator: AdminOperator,
    command: AdminNotificationPublishRequest,
  ): Promise<AdminNotificationItemView> {
    const existing = await this.getNotificationOrThrow(command.notificationId);
    if (existing.status !== DbNotificationStatus.DRAFT) {
      throw new ConflictException('Only draft notifications can be published');
    }

    const publishedAt = new Date();
    const notification =
      await this.notificationRepository.updateNotificationStatus({
        archivedAt: null,
        archivedByWallet: null,
        notificationId: command.notificationId,
        publishedAt,
        publishedByWallet: operator.walletAddress,
        status: DbNotificationStatus.PUBLISHED,
        updatedByWallet: operator.walletAddress,
      });

    await this.auditTrailService.record({
      action: 'admin.notifications.publish',
      operatorWallet: operator.walletAddress,
      payload: {
        publishedAt: publishedAt.toISOString(),
        previousStatus: existing.status,
      },
      targetId: notification.id,
      targetType: 'Notification',
    });

    return this.toAdminView(notification);
  }

  async unpublish(
    operator: AdminOperator,
    command: AdminNotificationUnpublishRequest,
  ): Promise<AdminNotificationItemView> {
    const existing = await this.getNotificationOrThrow(command.notificationId);
    if (existing.status !== DbNotificationStatus.PUBLISHED) {
      throw new ConflictException(
        'Only published notifications can be moved back to draft',
      );
    }

    const notification =
      await this.notificationRepository.updateNotificationStatus({
        archivedAt: null,
        archivedByWallet: null,
        notificationId: command.notificationId,
        publishedAt: existing.publishedAt,
        publishedByWallet: existing.publishedByWallet,
        status: DbNotificationStatus.DRAFT,
        updatedByWallet: operator.walletAddress,
      });

    await this.auditTrailService.record({
      action: 'admin.notifications.unpublish',
      operatorWallet: operator.walletAddress,
      payload: {
        previousStatus: existing.status,
      },
      targetId: notification.id,
      targetType: 'Notification',
    });

    return this.toAdminView(notification);
  }

  async archive(
    operator: AdminOperator,
    command: AdminNotificationArchiveRequest,
  ): Promise<AdminNotificationItemView> {
    const existing = await this.getNotificationOrThrow(command.notificationId);
    if (existing.status === DbNotificationStatus.ARCHIVED) {
      throw new ConflictException('Notification is already archived');
    }

    const archivedAt = new Date();
    const notification =
      await this.notificationRepository.updateNotificationStatus({
        archivedAt,
        archivedByWallet: operator.walletAddress,
        notificationId: command.notificationId,
        publishedAt: existing.publishedAt,
        publishedByWallet: existing.publishedByWallet,
        status: DbNotificationStatus.ARCHIVED,
        updatedByWallet: operator.walletAddress,
      });

    await this.auditTrailService.record({
      action: 'admin.notifications.archive',
      operatorWallet: operator.walletAddress,
      payload: {
        archivedAt: archivedAt.toISOString(),
        previousStatus: existing.status,
      },
      targetId: notification.id,
      targetType: 'Notification',
    });

    return this.toAdminView(notification);
  }

  private async getNotificationOrThrow(notificationId: string) {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  private toAdminView(item: {
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
    status: string;
    updatedAt: Date;
    updatedByWallet: string | null;
  }): AdminNotificationItemView {
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
      localeContent: localeContent.success ? localeContent.data : {},
      publishedAt: item.publishedAt ?? undefined,
      publishedByWallet: item.publishedByWallet ?? undefined,
      status: item.status as unknown as CommonNotificationStatus,
      updatedAt: item.updatedAt,
      updatedByWallet: item.updatedByWallet ?? undefined,
    };
  }
}
