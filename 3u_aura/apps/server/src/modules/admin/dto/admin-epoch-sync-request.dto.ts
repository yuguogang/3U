import { AdminEpochSyncRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminEpochSyncRequestDto extends createZodDto(
  AdminEpochSyncRequestSchema,
) {}
