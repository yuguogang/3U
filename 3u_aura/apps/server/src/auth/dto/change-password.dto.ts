import { ChangePasswordSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
