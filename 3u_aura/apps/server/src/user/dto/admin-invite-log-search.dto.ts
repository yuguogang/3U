import { createZodDto } from 'nestjs-zod';
import { AdminInviteLogSearchSchema } from '3u-aura-common';

export class AdminInviteLogSearchDto extends createZodDto(
  AdminInviteLogSearchSchema,
) {}
