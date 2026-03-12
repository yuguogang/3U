import { WeeklyEpochBoundaryQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class WeeklyEpochBoundaryQueryDto extends createZodDto(
  WeeklyEpochBoundaryQuerySchema,
) {}
