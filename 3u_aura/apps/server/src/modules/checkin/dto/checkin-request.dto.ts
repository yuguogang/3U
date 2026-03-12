import { PromotionCheckinRequestSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class CheckinRequestDto extends createZodDto(
  PromotionCheckinRequestSchema,
) {}
