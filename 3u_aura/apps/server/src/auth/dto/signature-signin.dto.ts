import { AuthSignatureSigninSchema } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class SignatureSigninDto extends createZodDto(
  AuthSignatureSigninSchema,
) {}
