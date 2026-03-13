import { AdminNftEligibilityListQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminNftEligibilityListQueryDto extends createZodDto(
  AdminNftEligibilityListQuerySchema,
) {}
