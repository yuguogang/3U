import { createZodDto } from 'nestjs-zod';
import { AdminUpdateAssetStatusSchema } from '3u-aura-common';

export class AdminUpdateAssetStatusDto extends createZodDto(
  AdminUpdateAssetStatusSchema,
) {}
