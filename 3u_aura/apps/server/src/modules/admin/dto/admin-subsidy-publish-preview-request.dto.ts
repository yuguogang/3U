import { AdminSubsidyPublicationRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminSubsidyPublicationRequestDto extends createZodDto(
  AdminSubsidyPublicationRequestSchema,
) {}

export { AdminSubsidyPublicationRequestDto as AdminSubsidyPublishPreviewRequestDto };
