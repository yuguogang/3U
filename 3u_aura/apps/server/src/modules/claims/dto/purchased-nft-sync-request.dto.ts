import { PromotionPurchasedNftSyncRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class PurchasedNftSyncRequestDto extends createZodDto(
  PromotionPurchasedNftSyncRequestSchema,
) {
  declare txHash: string;
}
