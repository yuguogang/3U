import { AuthSignatureSigninSchema } from '3u-aura-common';
import { DEVICES } from '3u-aura-common';
import { createZodDto } from 'nestjs-zod';

export class SignatureSigninDto extends createZodDto(
  AuthSignatureSigninSchema,
) {
  declare address: string;
  declare chain?: number;
  declare device: DEVICES | string;
  declare message?: string;
  declare name?: string;
  declare referralCode?: string;
  declare signature: string;
}
