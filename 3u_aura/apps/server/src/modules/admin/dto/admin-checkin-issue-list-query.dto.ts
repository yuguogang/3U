import { AdminCheckinIssueListQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminCheckinIssueListQueryDto extends createZodDto(
  AdminCheckinIssueListQuerySchema,
) {}
