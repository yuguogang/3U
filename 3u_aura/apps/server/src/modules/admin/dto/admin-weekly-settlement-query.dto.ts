import { AdminWeeklySettlementQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminWeeklySettlementQueryDto extends createZodDto(
  AdminWeeklySettlementQuerySchema,
) {}

export { AdminWeeklySettlementQueryDto as AdminWeeklySettlementOverviewQueryDto };
