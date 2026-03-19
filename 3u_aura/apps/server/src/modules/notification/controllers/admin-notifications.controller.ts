import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AdminWalletGuard, JwtAuthGuard } from '@/auth';
import { User } from '@/db';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminNotificationArchiveRequestDto,
  AdminNotificationCreateRequestDto,
  AdminNotificationListQueryDto,
  AdminNotificationPublishRequestDto,
  AdminNotificationUnpublishRequestDto,
  AdminNotificationUpdateRequestDto,
} from '../dto';
import { AdminNotificationService } from '../services/admin-notification.service';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminWalletGuard)
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  @Get()
  listNotifications(@Query() query: AdminNotificationListQueryDto) {
    return this.adminNotificationService.listNotifications(query);
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  createDraft(
    @CurrentUser() operator: User,
    @Body() command: AdminNotificationCreateRequestDto,
  ) {
    return this.adminNotificationService.createDraft(operator, command);
  }

  @Post('update')
  @HttpCode(HttpStatus.OK)
  updateDraft(
    @CurrentUser() operator: User,
    @Body() command: AdminNotificationUpdateRequestDto,
  ) {
    return this.adminNotificationService.updateDraft(operator, command);
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  publish(
    @CurrentUser() operator: User,
    @Body() command: AdminNotificationPublishRequestDto,
  ) {
    return this.adminNotificationService.publish(operator, command);
  }

  @Post('unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(
    @CurrentUser() operator: User,
    @Body() command: AdminNotificationUnpublishRequestDto,
  ) {
    return this.adminNotificationService.unpublish(operator, command);
  }

  @Post('archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @CurrentUser() operator: User,
    @Body() command: AdminNotificationArchiveRequestDto,
  ) {
    return this.adminNotificationService.archive(operator, command);
  }
}
