import { createZodDto } from 'nestjs-zod';
import { AdminWithdrawSearchSchema } from '3u-aura-common';

export class AdminWithdrawSearchDto extends createZodDto(
  AdminWithdrawSearchSchema,
) {}
