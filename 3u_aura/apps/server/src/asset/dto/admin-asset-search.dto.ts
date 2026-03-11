import { createZodDto } from 'nestjs-zod';
import { AdminAssetSearchSchema } from '3u-aura-common';

export class AdminAssetSearchDto extends createZodDto(AdminAssetSearchSchema) {}
