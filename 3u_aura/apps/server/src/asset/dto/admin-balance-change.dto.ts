import { createZodDto } from 'nestjs-zod';
import { AdminBalanceChangeSchema } from '3u-aura-common';

export class AdminBalanceChangeDto extends createZodDto(
  AdminBalanceChangeSchema,
) {}
