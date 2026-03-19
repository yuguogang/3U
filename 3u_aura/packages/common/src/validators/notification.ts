import { z } from 'zod';
import {
  NotificationAudienceScope,
  NotificationCategory,
  NotificationStatus,
} from '../enums';
import { NotificationLocaleCodes } from '../models/notification';

const PaginationQuerySchema = z.object({
  skip: z.preprocess((value) => Number(value), z.number().int().min(0)).optional(),
  take: z.preprocess((value) => Number(value), z.number().int().min(1).max(100)).optional(),
});

export const NotificationLocaleCodeSchema = z.enum(NotificationLocaleCodes);

export const NotificationLocalizedContentSchema = z
  .object({
    body: z.string().trim().min(1).max(4000),
    ctaHref: z.string().trim().url().max(500).optional(),
    ctaLabel: z.string().trim().min(1).max(80).optional(),
    title: z.string().trim().min(1).max(160),
  })
  .superRefine((value, ctx) => {
    const hasHref = Boolean(value.ctaHref);
    const hasLabel = Boolean(value.ctaLabel);

    if (hasHref !== hasLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ctaHref and ctaLabel must either both be present or both be omitted',
        path: hasHref ? ['ctaLabel'] : ['ctaHref'],
      });
    }
  });

export const NotificationLocaleContentMapSchema = z
  .object({
    en: NotificationLocalizedContentSchema.optional(),
    ja: NotificationLocalizedContentSchema.optional(),
    ko: NotificationLocalizedContentSchema.optional(),
    vi: NotificationLocalizedContentSchema.optional(),
    zh: NotificationLocalizedContentSchema.optional(),
    'zh-Hant': NotificationLocalizedContentSchema.optional(),
  })
  .refine(
    (value) => Object.values(value).some(Boolean),
    'At least one locale content entry is required',
  );

export const DappNotificationListQuerySchema = PaginationQuerySchema;

export type DappNotificationListQuery = z.infer<
  typeof DappNotificationListQuerySchema
>;

export const DappNotificationMarkReadRequestSchema = z.object({
  notificationIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

export type DappNotificationMarkReadRequest = z.infer<
  typeof DappNotificationMarkReadRequestSchema
>;

export const AdminNotificationListQuerySchema = PaginationQuerySchema.extend({
  category: z.nativeEnum(NotificationCategory).optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
});

export type AdminNotificationListQuery = z.infer<
  typeof AdminNotificationListQuerySchema
>;

const AdminNotificationUpsertPayloadSchema = z
  .object({
    audienceScope: z
      .nativeEnum(NotificationAudienceScope)
      .default(NotificationAudienceScope.ALL_USERS),
    category: z.nativeEnum(NotificationCategory),
    defaultLocale: NotificationLocaleCodeSchema,
    localeContent: NotificationLocaleContentMapSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.localeContent[value.defaultLocale]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'defaultLocale must have a corresponding localized content entry',
        path: ['defaultLocale'],
      });
    }
  });

export const AdminNotificationCreateRequestSchema =
  AdminNotificationUpsertPayloadSchema;

export type AdminNotificationCreateRequest = z.infer<
  typeof AdminNotificationCreateRequestSchema
>;

export const AdminNotificationUpdateRequestSchema =
  AdminNotificationUpsertPayloadSchema.extend({
    notificationId: z.string().trim().min(1),
  });

export type AdminNotificationUpdateRequest = z.infer<
  typeof AdminNotificationUpdateRequestSchema
>;

const NotificationMutationRequestSchema = z.object({
  notificationId: z.string().trim().min(1),
});

export const AdminNotificationPublishRequestSchema =
  NotificationMutationRequestSchema;
export const AdminNotificationUnpublishRequestSchema =
  NotificationMutationRequestSchema;
export const AdminNotificationArchiveRequestSchema =
  NotificationMutationRequestSchema;

export type AdminNotificationPublishRequest = z.infer<
  typeof AdminNotificationPublishRequestSchema
>;
export type AdminNotificationUnpublishRequest = z.infer<
  typeof AdminNotificationUnpublishRequestSchema
>;
export type AdminNotificationArchiveRequest = z.infer<
  typeof AdminNotificationArchiveRequestSchema
>;
