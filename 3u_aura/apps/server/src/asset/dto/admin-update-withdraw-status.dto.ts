import { createZodDto } from 'nestjs-zod';
import { AdminUpdateWithdrawStatusSchema } from '3u-aura-common';

export class AdminUpdateWithdrawStatusDto extends createZodDto(
  AdminUpdateWithdrawStatusSchema,
) {}
