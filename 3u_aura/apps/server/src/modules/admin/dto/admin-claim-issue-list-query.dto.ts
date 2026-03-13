import { AdminClaimIssueListQuerySchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminClaimIssueListQueryDto extends createZodDto(
  AdminClaimIssueListQuerySchema,
) {}
