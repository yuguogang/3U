import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  NotificationAudienceScope,
  NotificationCategory,
  NotificationStatus,
} from '3u-aura-common';
import type { User } from '@/db';
import { AuditTrailService } from '../../audit';
import { NotificationRepository } from '../repositories/notification.repository';
import { AdminNotificationService } from './admin-notification.service';

describe('AdminNotificationService', () => {
  const operator: Pick<User, 'id' | 'walletAddress'> = {
    id: 'admin_1',
    walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  const baseNotification = {
    archivedAt: null,
    archivedByWallet: null,
    audienceScope: NotificationAudienceScope.ALL_USERS,
    category: NotificationCategory.PROJECT_ACTIVITY,
    createdAt: new Date('2026-03-19T00:00:00.000Z'),
    createdByWallet: operator.walletAddress,
    defaultLocale: 'zh',
    id: 'notification_1',
    localeContent: {
      zh: {
        body: '即将开放测试',
        title: '公告',
      },
    },
    publishedAt: null,
    publishedByWallet: null,
    status: NotificationStatus.DRAFT,
    updatedAt: new Date('2026-03-19T00:00:00.000Z'),
    updatedByWallet: operator.walletAddress,
  };

  const createService = () => {
    const auditTrailService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationRepository = {
      createDraftNotification: jest.fn(),
      findById: jest.fn(),
      listAdminNotifications: jest.fn(),
      updateDraftNotification: jest.fn(),
      updateNotificationStatus: jest.fn(),
    };

    return {
      auditTrailService,
      notificationRepository,
      service: new AdminNotificationService(
        auditTrailService as unknown as AuditTrailService,
        notificationRepository as unknown as NotificationRepository,
      ),
    };
  };

  it('creates a draft and records an audit entry', async () => {
    const { auditTrailService, notificationRepository, service } =
      createService();
    notificationRepository.createDraftNotification.mockResolvedValue(
      baseNotification,
    );

    const result = await service.createDraft(operator, {
      audienceScope: NotificationAudienceScope.ALL_USERS,
      category: NotificationCategory.PROJECT_ACTIVITY,
      defaultLocale: 'zh',
      localeContent: baseNotification.localeContent,
    });

    expect(notificationRepository.createDraftNotification).toHaveBeenCalledWith({
      audienceScope: NotificationAudienceScope.ALL_USERS,
      category: NotificationCategory.PROJECT_ACTIVITY,
      createdByWallet: operator.walletAddress,
      defaultLocale: 'zh',
      localeContent: baseNotification.localeContent,
      updatedByWallet: operator.walletAddress,
    });
    expect(auditTrailService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.notifications.create-draft',
        operatorWallet: operator.walletAddress,
        targetId: baseNotification.id,
      }),
    );
    expect(result).toMatchObject({
      id: baseNotification.id,
      status: NotificationStatus.DRAFT,
    });
  });

  it('rejects updating a non-draft notification', async () => {
    const { notificationRepository, service } = createService();
    notificationRepository.findById.mockResolvedValue({
      ...baseNotification,
      status: NotificationStatus.PUBLISHED,
    });

    await expect(
      service.updateDraft(operator, {
        audienceScope: NotificationAudienceScope.ALL_USERS,
        category: NotificationCategory.PROJECT_ACTIVITY,
        defaultLocale: 'zh',
        localeContent: baseNotification.localeContent,
        notificationId: baseNotification.id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(notificationRepository.updateDraftNotification).not.toHaveBeenCalled();
  });

  it('publishes a draft and persists publish audit metadata', async () => {
    const { auditTrailService, notificationRepository, service } =
      createService();
    const publishedAt = new Date('2026-03-19T08:00:00.000Z');

    notificationRepository.findById.mockResolvedValue(baseNotification);
    notificationRepository.updateNotificationStatus.mockResolvedValue({
      ...baseNotification,
      publishedAt,
      publishedByWallet: operator.walletAddress,
      status: NotificationStatus.PUBLISHED,
      updatedAt: publishedAt,
      updatedByWallet: operator.walletAddress,
    });

    jest.useFakeTimers().setSystemTime(publishedAt);

    try {
      const result = await service.publish(operator, {
        notificationId: baseNotification.id,
      });

      expect(notificationRepository.updateNotificationStatus).toHaveBeenCalledWith(
        {
          archivedAt: null,
          archivedByWallet: null,
          notificationId: baseNotification.id,
          publishedAt,
          publishedByWallet: operator.walletAddress,
          status: NotificationStatus.PUBLISHED,
          updatedByWallet: operator.walletAddress,
        },
      );
      expect(auditTrailService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin.notifications.publish',
          operatorWallet: operator.walletAddress,
          targetId: baseNotification.id,
        }),
      );
      expect(result).toMatchObject({
        id: baseNotification.id,
        publishedByWallet: operator.walletAddress,
        status: NotificationStatus.PUBLISHED,
      });
      expect(result.publishedAt).toEqual(publishedAt);
    } finally {
      jest.useRealTimers();
    }
  });

  it('throws not found when archiving a missing notification', async () => {
    const { notificationRepository, service } = createService();
    notificationRepository.findById.mockResolvedValue(null);

    await expect(
      service.archive(operator, { notificationId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
