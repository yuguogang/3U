import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { AuditModule } from '../audit';
import { AdminNotificationsController } from './controllers/admin-notifications.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { AdminNotificationService } from './services/admin-notification.service';
import { NotificationReadService } from './services/notification-read.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationRepository,
    AdminNotificationService,
    NotificationReadService,
  ],
  exports: [
    NotificationRepository,
    AdminNotificationService,
    NotificationReadService,
  ],
})
export class NotificationModule {}
