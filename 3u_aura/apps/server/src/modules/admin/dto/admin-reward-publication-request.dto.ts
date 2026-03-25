import { AdminRewardPublicationRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class AdminRewardPublicationRequestDto extends createZodDto(
  AdminRewardPublicationRequestSchema,
) {}
