import { createZodDto } from 'nestjs-zod';
import { AdminInviteCodeSearchSchema } from '3u-aura-common';

export class AdminInviteCodeSearchDto extends createZodDto(
  AdminInviteCodeSearchSchema,
) {}
