import { AdminNotificationCreateRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminNotificationCreateRequestDto extends createZodDto(
  AdminNotificationCreateRequestSchema,
) {}
