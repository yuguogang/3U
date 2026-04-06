import { AdminSubsidyCenterQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminSubsidyCenterQueryDto extends createZodDto(
  AdminSubsidyCenterQuerySchema,
) {}
