import { AdminPendingPlacementListQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminPendingPlacementListQueryDto extends createZodDto(
  AdminPendingPlacementListQuerySchema,
) {}
