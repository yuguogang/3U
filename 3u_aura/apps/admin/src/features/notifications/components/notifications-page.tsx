"use client";

import { useState } from "react";
import {
  NotificationAudienceScope,
  NotificationCategory,
  NotificationLocaleCodes,
  NotificationStatus,
  type AdminNotificationCreateRequest,
  type AdminNotificationItemView,
  type NotificationLocaleCode,
} from "3u-aura-common";
import { formatAddress, formatDateTime } from "@/lib/admin-format";
import {
  useAdminNotificationsQuery,
  useArchiveAdminNotificationMutation,
  useCreateAdminNotificationMutation,
  usePublishAdminNotificationMutation,
  useUnpublishAdminNotificationMutation,
  useUpdateAdminNotificationMutation,
} from "@/queries/admin.query";
import { useAdminSessionReady } from "@/store/auth.store";
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorState,
  FieldLabel,
  LoadingState,
  PageIntro,
  Panel,
  PanelTitle,
  SelectInput,
  StatusPill,
  TextInput,
} from "@/features/lists/components/shared";

type LocaleDraft = {
  body: string;
  ctaHref: string;
  ctaLabel: string;
  title: string;
};

type LocaleDraftMap = Record<NotificationLocaleCode, LocaleDraft>;

const emptyLocaleDraft = (): LocaleDraftMap =>
  Object.fromEntries(
    NotificationLocaleCodes.map((locale) => [
      locale,
      { body: "", ctaHref: "", ctaLabel: "", title: "" },
    ]),
  ) as LocaleDraftMap;

function toLocaleDraftMap(item?: AdminNotificationItemView): LocaleDraftMap {
  const draft = emptyLocaleDraft();
  if (!item) {
    return draft;
  }

  for (const locale of NotificationLocaleCodes) {
    const content = item.localeContent[locale];
    if (!content) {
      continue;
    }

    draft[locale] = {
      body: content.body ?? "",
      ctaHref: content.ctaHref ?? "",
      ctaLabel: content.ctaLabel ?? "",
      title: content.title ?? "",
    };
  }

  return draft;
}

function buildLocaleContent(localeDrafts: LocaleDraftMap) {
  return Object.fromEntries(
    Object.entries(localeDrafts).flatMap(([locale, value]) => {
      const title = value.title.trim();
      const body = value.body.trim();
      const ctaHref = value.ctaHref.trim();
      const ctaLabel = value.ctaLabel.trim();

      if (!title && !body && !ctaHref && !ctaLabel) {
        return [];
      }

      return [
        [
          locale,
          {
            body,
            ...(ctaHref ? { ctaHref } : {}),
            ...(ctaLabel ? { ctaLabel } : {}),
            title,
          },
        ],
      ];
    }),
  );
}

function getEditorError(
  localeDrafts: LocaleDraftMap,
  defaultLocale: NotificationLocaleCode,
) {
  const entries = Object.entries(localeDrafts) as Array<
    [NotificationLocaleCode, LocaleDraft]
  >;
  const hasContent = entries.some(([, value]) => {
    return Boolean(value.title.trim() || value.body.trim());
  });

  if (!hasContent) {
    return "At least one locale entry with title and body is required.";
  }

  const defaultEntry = localeDrafts[defaultLocale];
  if (!defaultEntry.title.trim() || !defaultEntry.body.trim()) {
    return "Default locale must include both title and body.";
  }

  for (const [locale, value] of entries) {
    const hasAnyField = Boolean(
      value.title.trim() ||
        value.body.trim() ||
        value.ctaHref.trim() ||
        value.ctaLabel.trim(),
    );
    if (!hasAnyField) {
      continue;
    }

    if (!value.title.trim() || !value.body.trim()) {
      return `Locale ${locale} must include both title and body once started.`;
    }

    const hasHref = Boolean(value.ctaHref.trim());
    const hasLabel = Boolean(value.ctaLabel.trim());
    if (hasHref !== hasLabel) {
      return `Locale ${locale} must provide both CTA label and CTA href, or neither.`;
    }
  }

  return null;
}

function buildCreatePayload(
  audienceScope: NotificationAudienceScope,
  category: NotificationCategory,
  defaultLocale: NotificationLocaleCode,
  localeDrafts: LocaleDraftMap,
): AdminNotificationCreateRequest {
  return {
    audienceScope,
    category,
    defaultLocale,
    localeContent: buildLocaleContent(localeDrafts),
  };
}

function LocaleEditorSection({
  locale,
  onChange,
  value,
}: {
  locale: NotificationLocaleCode;
  onChange: (field: keyof LocaleDraft, nextValue: string) => void;
  value: LocaleDraft;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">{locale}</h3>
      <div className="mt-4 grid gap-4">
        <div>
          <FieldLabel htmlFor={`${locale}-title`}>Title</FieldLabel>
          <TextInput
            id={`${locale}-title`}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder={`Title (${locale})`}
            value={value.title}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${locale}-body`}>Body</FieldLabel>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/50"
            id={`${locale}-body`}
            onChange={(event) => onChange("body", event.target.value)}
            placeholder={`Body (${locale})`}
            value={value.body}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${locale}-cta-label`}>CTA Label</FieldLabel>
            <TextInput
              id={`${locale}-cta-label`}
              onChange={(event) => onChange("ctaLabel", event.target.value)}
              placeholder="Read more"
              value={value.ctaLabel}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${locale}-cta-href`}>CTA Href</FieldLabel>
            <TextInput
              id={`${locale}-cta-href`}
              onChange={(event) => onChange("ctaHref", event.target.value)}
              placeholder="https://..."
              value={value.ctaHref}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const enabled = useAdminSessionReady();
  const [categoryFilter, setCategoryFilter] = useState<"" | NotificationCategory>("");
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotificationItemView | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | NotificationStatus>("");
  const [audienceScope, setAudienceScope] = useState<NotificationAudienceScope>(
    NotificationAudienceScope.ALL_USERS,
  );
  const [category, setCategory] = useState<NotificationCategory>(
    NotificationCategory.PROJECT_ACTIVITY,
  );
  const [defaultLocale, setDefaultLocale] = useState<NotificationLocaleCode>("zh");
  const [localeDrafts, setLocaleDrafts] = useState<LocaleDraftMap>(emptyLocaleDraft);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useAdminNotificationsQuery(
    {
      category: categoryFilter || undefined,
      skip: 0,
      status: statusFilter || undefined,
      take: 20,
    },
    enabled,
  );

  const createMutation = useCreateAdminNotificationMutation();
  const updateMutation = useUpdateAdminNotificationMutation();
  const publishMutation = usePublishAdminNotificationMutation();
  const unpublishMutation = useUnpublishAdminNotificationMutation();
  const archiveMutation = useArchiveAdminNotificationMutation();

  const editorError = getEditorError(localeDrafts, defaultLocale);
  const mutationError =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    publishMutation.error?.message ||
    unpublishMutation.error?.message ||
    archiveMutation.error?.message ||
    null;

  if (!enabled) {
    return (
      <EmptyState
        description="Notification authoring 依赖管理员签名会话。"
        title="Admin session required"
      />
    );
  }

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    unpublishMutation.isPending ||
    archiveMutation.isPending;

  const handleLocaleChange = (
    locale: NotificationLocaleCode,
    field: keyof LocaleDraft,
    nextValue: string,
  ) => {
    setLocaleDrafts((current) => ({
      ...current,
      [locale]: {
        ...current[locale],
        [field]: nextValue,
      },
    }));
  };

  const handleNewDraft = () => {
    setSelectedNotification(null);
    setFormError(null);
    setAudienceScope(NotificationAudienceScope.ALL_USERS);
    setCategory(NotificationCategory.PROJECT_ACTIVITY);
    setDefaultLocale("zh");
    setLocaleDrafts(emptyLocaleDraft());
  };

  const selectNotification = (item: AdminNotificationItemView) => {
    setSelectedNotification(item);
    setFormError(null);
    setAudienceScope(item.audienceScope);
    setCategory(item.category);
    setDefaultLocale(item.defaultLocale);
    setLocaleDrafts(toLocaleDraftMap(item));
  };

  const handleSave = async () => {
    if (editorError) {
      setFormError(editorError);
      return;
    }

    setFormError(null);
    const payload = buildCreatePayload(
      audienceScope,
      category,
      defaultLocale,
      localeDrafts,
    );

    if (selectedNotification) {
      const result = await updateMutation.mutateAsync({
        ...payload,
        notificationId: selectedNotification.id,
      });
      selectNotification(result);
      return;
    }

    const result = await createMutation.mutateAsync(payload);
    selectNotification(result);
  };

  const handlePublish = async () => {
    if (!selectedNotification) {
      return;
    }

    const result = await publishMutation.mutateAsync({
      notificationId: selectedNotification.id,
    });
    selectNotification(result);
  };

  const handleUnpublish = async () => {
    if (!selectedNotification) {
      return;
    }

    const result = await unpublishMutation.mutateAsync({
      notificationId: selectedNotification.id,
    });
    selectNotification(result);
  };

  const handleArchive = async () => {
    if (!selectedNotification) {
      return;
    }

    const result = await archiveMutation.mutateAsync({
      notificationId: selectedNotification.id,
    });
    selectNotification(result);
  };

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <ActionButton onClick={handleNewDraft} tone="ghost">
            New draft
          </ActionButton>
        }
        description="Notifications 是第一版站内公告面。管理员可以创建草稿、填写多语言内容、再显式 publish / unpublish / archive。第一版受众固定为全部用户。"
        title="Notifications"
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <PanelTitle
            description="先按 status/category 过滤，再选择单条草稿或已发布消息进入右侧编辑面板。"
            title="Notification Listing"
          />
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="notification-status">Status</FieldLabel>
              <SelectInput
                id="notification-status"
                onChange={(event) =>
                  setStatusFilter(
                    (event.target.value || "") as "" | NotificationStatus,
                  )
                }
                value={statusFilter}
              >
                <option value="">All</option>
                <option value={NotificationStatus.DRAFT}>DRAFT</option>
                <option value={NotificationStatus.PUBLISHED}>PUBLISHED</option>
                <option value={NotificationStatus.ARCHIVED}>ARCHIVED</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="notification-category">Category</FieldLabel>
              <SelectInput
                id="notification-category"
                onChange={(event) =>
                  setCategoryFilter(
                    (event.target.value || "") as "" | NotificationCategory,
                  )
                }
                value={categoryFilter}
              >
                <option value="">All</option>
                <option value={NotificationCategory.PROJECT_ACTIVITY}>
                  PROJECT_ACTIVITY
                </option>
                <option value={NotificationCategory.TEAM_ACTIVITY}>
                  TEAM_ACTIVITY
                </option>
                <option value={NotificationCategory.UPCOMING_LAUNCH}>
                  UPCOMING_LAUNCH
                </option>
              </SelectInput>
            </div>
          </div>

          {query.isLoading ? <LoadingState label="Loading notifications" /> : null}
          {query.error ? <ErrorState error={query.error} /> : null}
          {query.data ? (
            <DataTable
              columns={[
                "Status",
                "Category",
                "Default Locale",
                "Updated",
                "Published",
                "Selection",
              ]}
            >
              {query.data.items.map((item) => (
                <tr
                  className={
                    selectedNotification?.id === item.id
                      ? "bg-white/[0.03]"
                      : undefined
                  }
                  key={item.id}
                >
                  <td className="px-4 py-4">
                    <StatusPill
                      tone={
                        item.status === NotificationStatus.PUBLISHED
                          ? "success"
                          : item.status === NotificationStatus.ARCHIVED
                            ? "danger"
                            : "warning"
                      }
                    >
                      {item.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.category}</td>
                  <td className="px-4 py-4 text-slate-300">{item.defaultLocale}</td>
                  <td className="px-4 py-4 text-xs leading-6 text-slate-400">
                    <div>{formatDateTime(item.updatedAt)}</div>
                    <div>{formatAddress(item.updatedByWallet)}</div>
                  </td>
                  <td className="px-4 py-4 text-xs leading-6 text-slate-400">
                    <div>{formatDateTime(item.publishedAt)}</div>
                    <div>{formatAddress(item.publishedByWallet)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <ActionButton
                      onClick={() => selectNotification(item)}
                      tone={
                        selectedNotification?.id === item.id ? "default" : "ghost"
                      }
                    >
                      {selectedNotification?.id === item.id ? "Selected" : "Edit"}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : null}
        </Panel>

        <Panel>
          <PanelTitle
            description="默认语言必须有完整内容；任何 locale 一旦开始填写，就必须完整填写 title/body。CTA 需要成对提供。"
            title={selectedNotification ? "Notification Editor" : "Create Draft"}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel htmlFor="notification-audience">Audience</FieldLabel>
              <SelectInput
                id="notification-audience"
                onChange={(event) =>
                  setAudienceScope(
                    event.target.value as NotificationAudienceScope,
                  )
                }
                value={audienceScope}
              >
                <option value={NotificationAudienceScope.ALL_USERS}>ALL_USERS</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="notification-editor-category">Category</FieldLabel>
              <SelectInput
                id="notification-editor-category"
                onChange={(event) =>
                  setCategory(event.target.value as NotificationCategory)
                }
                value={category}
              >
                <option value={NotificationCategory.PROJECT_ACTIVITY}>
                  PROJECT_ACTIVITY
                </option>
                <option value={NotificationCategory.TEAM_ACTIVITY}>
                  TEAM_ACTIVITY
                </option>
                <option value={NotificationCategory.UPCOMING_LAUNCH}>
                  UPCOMING_LAUNCH
                </option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="notification-default-locale">
                Default Locale
              </FieldLabel>
              <SelectInput
                id="notification-default-locale"
                onChange={(event) =>
                  setDefaultLocale(event.target.value as NotificationLocaleCode)
                }
                value={defaultLocale}
              >
                {NotificationLocaleCodes.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {NotificationLocaleCodes.map((locale) => (
              <LocaleEditorSection
                key={locale}
                locale={locale}
                onChange={(field, nextValue) =>
                  handleLocaleChange(locale, field, nextValue)
                }
                value={localeDrafts[locale]}
              />
            ))}
          </div>

          {formError || mutationError ? (
            <Panel className="mt-6 border-rose-400/20 bg-rose-950/20">
              <p className="text-sm text-rose-200">{formError || mutationError}</p>
            </Panel>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <ActionButton disabled={busy} onClick={handleSave}>
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : selectedNotification
                  ? "Save draft"
                  : "Create draft"}
            </ActionButton>
            <ActionButton
              disabled={
                busy ||
                !selectedNotification ||
                selectedNotification.status !== NotificationStatus.DRAFT
              }
              onClick={handlePublish}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </ActionButton>
            <ActionButton
              disabled={
                busy ||
                !selectedNotification ||
                selectedNotification.status !== NotificationStatus.PUBLISHED
              }
              onClick={handleUnpublish}
              tone="ghost"
            >
              {unpublishMutation.isPending ? "Unpublishing..." : "Unpublish"}
            </ActionButton>
            <ActionButton
              disabled={
                busy ||
                !selectedNotification ||
                selectedNotification.status === NotificationStatus.ARCHIVED
              }
              onClick={handleArchive}
              tone="danger"
            >
              {archiveMutation.isPending ? "Archiving..." : "Archive"}
            </ActionButton>
          </div>

          {selectedNotification ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Panel className="bg-white/[0.03]">
                <PanelTitle title="Status Metadata" />
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <StatusPill
                      tone={
                        selectedNotification.status === NotificationStatus.PUBLISHED
                          ? "success"
                          : selectedNotification.status === NotificationStatus.ARCHIVED
                            ? "danger"
                            : "warning"
                      }
                    >
                      {selectedNotification.status}
                    </StatusPill>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Created</span>
                    <span>{formatDateTime(selectedNotification.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Updated</span>
                    <span>{formatDateTime(selectedNotification.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Published</span>
                    <span>{formatDateTime(selectedNotification.publishedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Archived</span>
                    <span>{formatDateTime(selectedNotification.archivedAt)}</span>
                  </div>
                </div>
              </Panel>

              <Panel className="bg-white/[0.03]">
                <PanelTitle title="Operator Metadata" />
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span>Created by</span>
                    <span>{formatAddress(selectedNotification.createdByWallet)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Updated by</span>
                    <span>{formatAddress(selectedNotification.updatedByWallet)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Published by</span>
                    <span>{formatAddress(selectedNotification.publishedByWallet)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Archived by</span>
                    <span>{formatAddress(selectedNotification.archivedByWallet)}</span>
                  </div>
                </div>
              </Panel>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
