import { createZodDto } from 'nestjs-zod';
import { AuthSignatureMessageSchema } from '3u-aura-common';
import { SignatureScenarios } from '3u-aura-common';

export class SignatureMessageDto extends createZodDto(
  AuthSignatureMessageSchema,
) {
  declare address: string;
  declare scenario: SignatureScenarios;
}
