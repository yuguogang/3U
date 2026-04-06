import { AdminWeeklySettlementEpochRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminWeeklySettlementEpochRequestDto extends createZodDto(
  AdminWeeklySettlementEpochRequestSchema,
) {}
