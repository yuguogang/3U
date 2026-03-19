import { DappNotificationListQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class NotificationListQueryDto extends createZodDto(
  DappNotificationListQuerySchema,
) {}
