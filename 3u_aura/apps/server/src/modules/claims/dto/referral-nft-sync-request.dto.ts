import { PromotionReferralNftSyncRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class ReferralNftSyncRequestDto extends createZodDto(
  PromotionReferralNftSyncRequestSchema,
) {
  declare txHash: string;
}
