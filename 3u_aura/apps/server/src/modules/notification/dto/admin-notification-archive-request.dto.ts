import { AdminNotificationArchiveRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminNotificationArchiveRequestDto extends createZodDto(
  AdminNotificationArchiveRequestSchema,
) {}
