import { createZodDto } from 'nestjs-zod';
import { AdminDepositSearchSchema } from '3u-aura-common';

export class AdminDepositSearchDto extends createZodDto(
  AdminDepositSearchSchema,
) {}
