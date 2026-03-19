import { AdminNotificationUnpublishRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminNotificationUnpublishRequestDto extends createZodDto(
  AdminNotificationUnpublishRequestSchema,
) {}
