import { TeamTreeSnapshotQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class TreeSnapshotQueryDto extends createZodDto(
  TeamTreeSnapshotQuerySchema,
) {}
