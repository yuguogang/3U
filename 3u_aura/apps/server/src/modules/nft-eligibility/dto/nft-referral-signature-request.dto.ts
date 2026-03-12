import { NftReferralSignatureRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class NftReferralSignatureRequestDto extends createZodDto(
  NftReferralSignatureRequestSchema,
) {}
