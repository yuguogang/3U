import { createZodDto } from 'nestjs-zod';
import { AdminBalanceSearchSchema } from '3u-aura-common';

export class AdminBalanceSearchDto extends createZodDto(
  AdminBalanceSearchSchema,
) {}
