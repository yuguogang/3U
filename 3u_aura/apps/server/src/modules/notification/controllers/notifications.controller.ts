import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  NotificationListQueryDto,
  NotificationMarkReadRequestDto,
} from '../dto';
import { NotificationReadService } from '../services/notification-read.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationReadService: NotificationReadService,
  ) {}

  @Get()
  listMyNotifications(
    @CurrentUser() user: User,
    @Query() query: NotificationListQueryDto,
  ) {
    return this.notificationReadService.listVisibleNotificationsForUser(
      user,
      query,
    );
  }

  @Get('unread-count')
  getMyUnreadCount(@CurrentUser() user: User) {
    return this.notificationReadService.getUnreadCountForUser(user);
  }

  @Post('read')
  markMyNotificationsRead(
    @CurrentUser() user: User,
    @Body() command: NotificationMarkReadRequestDto,
  ) {
    return this.notificationReadService.markReadForUser(user, command);
  }
}
