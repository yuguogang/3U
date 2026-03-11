import { createZodDto } from 'nestjs-zod';
import { AdminUserSearchSchema, AdminUpdateUserStatusSchema } from '3u-aura-common';

export class UserSearchDto extends createZodDto(AdminUserSearchSchema) {}

export class UpdateUserStatusDto extends createZodDto(
  AdminUpdateUserStatusSchema,
) {}
