import { NftEligibilityQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class NftEligibilityQueryDto extends createZodDto(
  NftEligibilityQuerySchema,
) {}
