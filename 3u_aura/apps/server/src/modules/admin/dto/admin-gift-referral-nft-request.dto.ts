import {
  AdminGiftReferralNftRequestSchema,
  type AdminGiftReferralNftRequest,
} from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export type { AdminGiftReferralNftRequest };

export class AdminGiftReferralNftRequestDto extends createZodDto(
  AdminGiftReferralNftRequestSchema,
) {}
