import { createZodDto } from 'nestjs-zod';
import { AdminUpdateInviteCodeStatusSchema } from '3u-aura-common';

export class AdminUpdateInviteCodeStatusDto extends createZodDto(
  AdminUpdateInviteCodeStatusSchema,
) {}
