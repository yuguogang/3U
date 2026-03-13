import { AdminCheckinRepairRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminCheckinRepairRequestDto extends createZodDto(
  AdminCheckinRepairRequestSchema,
) {}
