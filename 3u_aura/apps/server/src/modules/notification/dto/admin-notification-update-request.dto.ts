import { AdminNotificationUpdateRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminNotificationUpdateRequestDto extends createZodDto(
  AdminNotificationUpdateRequestSchema,
) {}
