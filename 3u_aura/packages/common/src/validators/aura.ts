import { z } from 'zod';
import { SignatureScenarios, DEVICES } from '../enums';

export const AuthSignatureMessageSchema = z.object({
    address: z.string().min(1, 'Address required'),
    scenario: z.nativeEnum(SignatureScenarios),
});

export const AuthSignatureSigninSchema = z.object({
    address: z.string().min(1, 'Address required'),
    signature: z
        .string()
        .regex(/^0x[a-fA-F0-9]{130,132}$/, 'Invalid signature format'),
    device: z.union([z.nativeEnum(DEVICES), z.string()]),
    name: z.string().optional(),
    chain: z.preprocess((v) => Number(v), z.number()).optional(),
});
