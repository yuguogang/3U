import { AdminApproveReferralNftRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminApproveReferralNftRequestDto extends createZodDto(
  AdminApproveReferralNftRequestSchema,
) {}
