import { createZodDto } from 'nestjs-zod';
import { AdminUpdateDepositStatusSchema } from '3u-aura-common';

export class AdminUpdateDepositStatusDto extends createZodDto(
  AdminUpdateDepositStatusSchema,
) {}
