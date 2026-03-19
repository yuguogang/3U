import type { User } from '@/db';
import { DbService } from '@/db';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationReadService } from './notification-read.service';

describe('NotificationReadService', () => {
  const user: Pick<User, 'id' | 'walletAddress'> = {
    id: 'user_1',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };

  const createService = () => {
    const tx = { marker: 'tx' };
    const db = {
      $transaction: jest.fn(async (operation) => operation(tx)),
    };
    const notificationRepository = {
      countUnreadForUser: jest.fn(),
      createReadRecords: jest.fn(),
      listVisibleNotificationIds: jest.fn(),
      listVisibleNotificationsForUser: jest.fn(),
    };

    return {
      db,
      notificationRepository,
      service: new NotificationReadService(
        db as unknown as DbService,
        notificationRepository as unknown as NotificationRepository,
      ),
      tx,
    };
  };

  it('marks visible notifications as read idempotently inside a transaction', async () => {
    const { db, notificationRepository, service, tx } = createService();
    notificationRepository.listVisibleNotificationIds.mockResolvedValue([
      'notification_1',
      'notification_3',
    ]);
    notificationRepository.createReadRecords.mockResolvedValue(1);
    notificationRepository.countUnreadForUser.mockResolvedValue(4);

    const result = await service.markReadForUser(user, {
      notificationIds: [
        'notification_1',
        'notification_2',
        'notification_3',
      ],
    });

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(notificationRepository.listVisibleNotificationIds).toHaveBeenCalledWith(
      ['notification_1', 'notification_2', 'notification_3'],
      tx,
    );
    expect(notificationRepository.createReadRecords).toHaveBeenCalledWith(
      user.id,
      ['notification_1', 'notification_3'],
      tx,
    );
    expect(notificationRepository.countUnreadForUser).toHaveBeenCalledWith(
      user.id,
      tx,
    );
    expect(result).toEqual({
      notificationIds: ['notification_1', 'notification_3'],
      unreadCount: 4,
      updatedCount: 1,
    });
  });

  it('maps read state when listing visible notifications', async () => {
    const { notificationRepository, service } = createService();
    const publishedAt = new Date('2026-03-19T10:00:00.000Z');
    const readAt = new Date('2026-03-19T11:00:00.000Z');

    notificationRepository.listVisibleNotificationsForUser.mockResolvedValue({
      items: [
        {
          archivedAt: null,
          archivedByWallet: null,
          audienceScope: 'ALL_USERS',
          category: 'PROJECT_ACTIVITY',
          createdAt: publishedAt,
          createdByWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          defaultLocale: 'zh',
          id: 'notification_1',
          localeContent: {
            zh: {
              body: '今晚升级',
              title: '维护通知',
            },
          },
          publishedAt,
          publishedByWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          reads: [{ readAt }],
          status: 'PUBLISHED',
          updatedAt: publishedAt,
          updatedByWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      ],
      skip: 0,
      take: 20,
      total: 1,
    });

    const result = await service.listVisibleNotificationsForUser(user, {});

    expect(result.items[0]).toMatchObject({
      defaultLocale: 'zh',
      id: 'notification_1',
      isRead: true,
      readAt,
      status: 'PUBLISHED',
    });
  });
});
