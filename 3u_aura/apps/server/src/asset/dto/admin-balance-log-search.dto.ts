import { createZodDto } from 'nestjs-zod';
import { AdminBalanceLogSearchSchema } from '3u-aura-common';

export class AdminBalanceLogSearchDto extends createZodDto(
  AdminBalanceLogSearchSchema,
) {}
