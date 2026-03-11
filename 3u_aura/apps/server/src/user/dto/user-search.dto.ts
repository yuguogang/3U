import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserStatus } from '3u-aura-common';

export const UserSearchSchema = z.object({
  skip: z.preprocess((v) => Number(v), z.number()).optional(),
  take: z.preprocess((v) => Number(v), z.number()).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export class UserSearchDto extends createZodDto(UserSearchSchema) { }

export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) { }
