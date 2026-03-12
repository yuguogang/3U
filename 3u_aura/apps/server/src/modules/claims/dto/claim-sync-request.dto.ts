import { PromotionClaimSyncRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class ClaimSyncRequestDto extends createZodDto(
  PromotionClaimSyncRequestSchema,
) {}
