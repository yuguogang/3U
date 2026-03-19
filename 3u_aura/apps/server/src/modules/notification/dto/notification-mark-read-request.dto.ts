import { DappNotificationMarkReadRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class NotificationMarkReadRequestDto extends createZodDto(
  DappNotificationMarkReadRequestSchema,
) {}
