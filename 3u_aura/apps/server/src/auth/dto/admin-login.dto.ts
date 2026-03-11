import { AdminLoginSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminLoginDto extends createZodDto(AdminLoginSchema) {}
