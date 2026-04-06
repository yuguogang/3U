import { z } from 'zod';
import { ClaimStatus, NftEligibilityStatus, UserStatus } from '../enums';
import { PromotionClaimSyncRequestSchema } from './promotion';

const PaginationQuerySchema = z.object({
  search: z.string().trim().optional(),
  skip: z.preprocess((value) => Number(value), z.number().int().min(0)).optional(),
  take: z.preprocess((value) => Number(value), z.number().int().min(1).max(100)).optional(),
});

const AtomicAmountStringSchema = z
  .string()
  .regex(/^\d+$/, 'Atomic amount must be an integer string');

const EvmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address');

const ClaimKindSchema = z.enum(['MERKLE', 'NFT_SUBSIDY']);

export const AdminUserListQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(UserStatus).optional(),
});

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

export const AdminPendingPlacementListQuerySchema = PaginationQuerySchema;

export type AdminPendingPlacementListQuery = z.infer<
  typeof AdminPendingPlacementListQuerySchema
>;

export const AdminCheckinIssueListQuerySchema = PaginationQuerySchema.extend({
  onlyUnlinked: z
    .preprocess(
      (value) =>
        value === 'true' || value === true
          ? true
          : value === 'false' || value === false
            ? false
            : undefined,
      z.boolean(),
    )
    .optional(),
});

export type AdminCheckinIssueListQuery = z.infer<
  typeof AdminCheckinIssueListQuerySchema
>;

export const AdminClaimIssueListQuerySchema = PaginationQuerySchema.extend({
  claimKind: ClaimKindSchema.optional(),
  status: z.nativeEnum(ClaimStatus).optional(),
});

export type AdminClaimIssueListQuery = z.infer<
  typeof AdminClaimIssueListQuerySchema
>;

export const AdminNftEligibilityListQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(NftEligibilityStatus).optional(),
});

export type AdminNftEligibilityListQuery = z.infer<
  typeof AdminNftEligibilityListQuerySchema
>;

export const AdminAuditLogListQuerySchema = PaginationQuerySchema.extend({
  action: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
});

export type AdminAuditLogListQuery = z.infer<
  typeof AdminAuditLogListQuerySchema
>;

export const AdminCheckinRepairRequestSchema = z.object({
  amountAtomic: AtomicAmountStringSchema.default('3000000'),
  chainId: z.preprocess((value) => Number(value), z.number().int().positive()),
  payerAddress: EvmAddressSchema,
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  userId: z.string().trim().min(1),
});

export type AdminCheckinRepairRequest = z.infer<
  typeof AdminCheckinRepairRequestSchema
>;

export const AdminClaimSyncRequestSchema = PromotionClaimSyncRequestSchema;

export type AdminClaimSyncRequest = z.infer<
  typeof AdminClaimSyncRequestSchema
>;

export const AdminEpochSyncRequestSchema = z.object({
  referenceAt: z.string().datetime().optional(),
});

export type AdminEpochSyncRequest = z.infer<typeof AdminEpochSyncRequestSchema>;

export const AdminRewardPublicationRequestSchema = z.object({
  epochNo: z.preprocess((value) => Number(value), z.number().int().positive()),
  rewardJsonUri: z.string().trim().min(1).optional(),
});

export type AdminRewardPublicationRequest = z.infer<
  typeof AdminRewardPublicationRequestSchema
>;

export const AdminSubsidyPublishPreviewRequestSchema = z.object({
  claimDeadline: z.string().datetime(),
  epochNo: z.preprocess((value) => Number(value), z.number().int().positive()),
  subsidyAmountAtomic: AtomicAmountStringSchema,
});

export type AdminSubsidyPublishPreviewRequest = z.infer<
  typeof AdminSubsidyPublishPreviewRequestSchema
>;

export const AdminWeeklySettlementQuerySchema = z.object({
  epochNo: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().positive())
    .optional(),
  referenceAt: z.string().datetime().optional(),
});

export type AdminWeeklySettlementQuery = z.infer<
  typeof AdminWeeklySettlementQuerySchema
>;

export const AdminWeeklySettlementOverviewQuerySchema =
  AdminWeeklySettlementQuerySchema;

export type AdminWeeklySettlementOverviewQuery =
  AdminWeeklySettlementQuery;

export const AdminWeeklySettlementEpochRequestSchema = z.object({
  epochNo: z.preprocess((value) => Number(value), z.number().int().positive()),
});

export type AdminWeeklySettlementEpochRequest = z.infer<
  typeof AdminWeeklySettlementEpochRequestSchema
>;

export const AdminSubsidyCenterQuerySchema = z.object({
  epochNo: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)), z.number().int().positive())
    .optional(),
});

export type AdminSubsidyCenterQuery = z.infer<
  typeof AdminSubsidyCenterQuerySchema
>;

export const AdminSubsidyPublicationRequestSchema = z.object({
  claimDeadline: z.string().datetime(),
  epochNo: z.preprocess((value) => Number(value), z.number().int().positive()),
  subsidyAmountAtomic: AtomicAmountStringSchema,
});

export type AdminSubsidyPublicationRequest = z.infer<
  typeof AdminSubsidyPublicationRequestSchema
>;

export const AdminApproveReferralNftRequestSchema = z.object({
  decisionReason: z.string().trim().max(500).optional(),
  userId: z.string().trim().min(1),
});

export type AdminApproveReferralNftRequest = z.infer<
  typeof AdminApproveReferralNftRequestSchema
>;

export const AdminGiftReferralNftRequestSchema = z.object({
  decisionReason: z.string().trim().max(500).optional(),
  userId: z.string().trim().min(1),
});

export type AdminGiftReferralNftRequest = z.infer<
  typeof AdminGiftReferralNftRequestSchema
>;

export const AdminRejectReferralNftRequestSchema = z.object({
  decisionReason: z.string().trim().min(1).max(500),
  userId: z.string().trim().min(1),
});

export type AdminRejectReferralNftRequest = z.infer<
  typeof AdminRejectReferralNftRequestSchema
>;
