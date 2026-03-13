import { createZodDto } from 'nestjs-zod';
import {
  type AdminUserListQuery,
  AdminUserListQuerySchema,
  UserStatus,
} from '3u-aura-common';
import { z } from 'zod';

export const UserSearchSchema = AdminUserListQuerySchema;

export type UserSearchInput = AdminUserListQuery;

export class UserSearchDto extends createZodDto(UserSearchSchema) {}

export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}
