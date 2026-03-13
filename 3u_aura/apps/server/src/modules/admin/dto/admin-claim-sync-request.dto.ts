import { AdminClaimSyncRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminClaimSyncRequestDto extends createZodDto(
  AdminClaimSyncRequestSchema,
) {}
