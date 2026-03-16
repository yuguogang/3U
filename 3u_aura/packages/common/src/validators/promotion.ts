import { z } from 'zod';
import { EpochStatus, EpochType, TeamPosition } from '../enums';

const AtomicAmountStringSchema = z
  .string()
  .regex(/^\d+$/, 'Atomic amount must be an integer string');

const EvmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address');

const TxHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');

const Bytes32HexSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid bytes32 hex value');

const EvmSignatureSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid EVM signature');

export const PromotionCheckinRequestSchema = z.object({
  chainId: z.preprocess((value) => Number(value), z.number().int().positive()),
  txHash: TxHashSchema,
  payerAddress: EvmAddressSchema,
  tokenSymbol: z.string().min(1).default('USDT'),
  amountAtomic: AtomicAmountStringSchema,
});

export type PromotionCheckinRequest = z.infer<
  typeof PromotionCheckinRequestSchema
>;

export const ReferralBindInviterSchema = z.object({
  inviteCode: z.string().trim().min(1).max(32),
});

export type ReferralBindInviterInput = z.infer<
  typeof ReferralBindInviterSchema
>;

export const ReferralBindPlacementSchema = z.object({
  placementUserId: z.string().trim().min(1),
  parentId: z.string().trim().min(1),
  teamPosition: z.nativeEnum(TeamPosition),
});

export type ReferralBindPlacementInput = z.infer<
  typeof ReferralBindPlacementSchema
>;

export const NftEligibilityQuerySchema = z
  .object({
    userId: z.string().trim().min(1).optional(),
    walletAddress: EvmAddressSchema.optional(),
  })
  .refine((value) => Boolean(value.userId || value.walletAddress), {
    message: 'userId or walletAddress is required',
  });

export type NftEligibilityQuery = z.infer<typeof NftEligibilityQuerySchema>;

export const NftReferralSignatureRequestSchema = z.object({
  recipient: EvmAddressSchema,
  chainId: z.preprocess((value) => Number(value), z.number().int().positive()),
  contractAddress: EvmAddressSchema.optional(),
  expiresAt: z.string().datetime().optional(),
});

export type NftReferralSignatureRequest = z.infer<
  typeof NftReferralSignatureRequestSchema
>;

export const ReferralSignaturePreviewSchema = z.object({
  recipient: EvmAddressSchema,
  chainId: z.number().int().positive(),
  contractAddress: EvmAddressSchema,
  nonce: z.number().int().nonnegative(),
  expiry: z.number().int().nonnegative(),
  expiresAt: z.string().datetime(),
});

export const ReferralMintSignaturePayloadSchema =
  ReferralSignaturePreviewSchema.extend({
    digest: Bytes32HexSchema,
    issuedAt: z.string().datetime(),
    signature: EvmSignatureSchema,
  });

export const PromotionClaimSyncRequestSchema = z
  .object({
    claimRecordId: z.string().trim().min(1).optional(),
    subsidyClaimId: z.string().trim().min(1).optional(),
    txHash: TxHashSchema,
  })
  .refine(
    (value) =>
      Number(Boolean(value.claimRecordId)) +
        Number(Boolean(value.subsidyClaimId)) ===
      1,
    {
      message: 'Exactly one of claimRecordId or subsidyClaimId is required',
    },
  );

export type PromotionClaimSyncRequest = z.infer<
  typeof PromotionClaimSyncRequestSchema
>;

export const PromotionPurchasedNftSyncRequestSchema = z.object({
  txHash: TxHashSchema,
});

export type PromotionPurchasedNftSyncRequest = z.infer<
  typeof PromotionPurchasedNftSyncRequestSchema
>;

export const WeeklyEpochBoundaryQuerySchema = z.object({
  epochType: z.nativeEnum(EpochType).optional(),
  status: z.nativeEnum(EpochStatus).optional(),
  referenceAt: z.string().datetime().optional(),
});

export type WeeklyEpochBoundaryQuery = z.infer<
  typeof WeeklyEpochBoundaryQuerySchema
>;
