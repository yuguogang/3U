import type {
  AdminEpochSyncPreviewView,
  AdminOperationResultEnvelope,
  ClientUser,
  PromotionClaimSyncResult,
  PromotionClaimsView,
  PromotionPurchasedNftSyncResult,
  PromotionRewardView,
  ReferralPendingPlacementView,
  ReferralPlacementSlotView,
  WeeklyEpochBoundaryView,
} from "3u-aura-common";
import { loadRuntimeConfig } from "./runtime";

type QueryValue = boolean | number | string | null | undefined;

type RequestServerJsonOptions = {
  accessToken?: string;
  body?: unknown;
  method?: string;
  query?: Record<string, QueryValue>;
};

export type ServerJsonResponse<T> = {
  data: T;
  status: number;
};

function buildUrl(
  pathname: string,
  query?: Record<string, QueryValue>,
) {
  const runtime = loadRuntimeConfig();
  const url = new URL(pathname, runtime.manifest.infra.server.publicApiBaseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
}

export async function requestServerJson<T>(
  pathname: string,
  options: RequestServerJsonOptions = {},
): Promise<ServerJsonResponse<T>> {
  const response = await fetch(buildUrl(pathname, options.query), {
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: {
      Accept: "application/json",
      ...(options.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
    },
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} (${pathname}) ${errorBody}`,
    );
  }

  return {
    data: (await response.json()) as T,
    status: response.status,
  };
}

export async function getMyProfile(accessToken: string) {
  return requestServerJson<ClientUser>("/api/v1/user/profile", {
    accessToken,
  });
}

export async function getPendingPlacements(accessToken: string) {
  return requestServerJson<ReferralPendingPlacementView[]>(
    "/api/v1/referral/pending-placement",
    {
      accessToken,
    },
  );
}

export async function getSelectableSlots(accessToken: string) {
  return requestServerJson<ReferralPlacementSlotView[]>(
    "/api/v1/tree/placement/selectable-slots",
    {
      accessToken,
    },
  );
}

export async function getMyClaims(accessToken: string) {
  return requestServerJson<PromotionClaimsView>("/api/v1/claims/me", {
    accessToken,
  });
}

export async function getWeeklyEpochBoundary(referenceAt?: string) {
  return requestServerJson<WeeklyEpochBoundaryView>("/api/v1/epoch/boundary", {
    query: {
      referenceAt,
    },
  });
}

export async function previewAdminEpochSync(
  accessToken: string,
  referenceAt?: string,
) {
  return requestServerJson<AdminOperationResultEnvelope<AdminEpochSyncPreviewView>>(
    "/api/v1/admin/ops/epochs/sync/preview",
    {
      accessToken,
      body: referenceAt ? { referenceAt } : {},
      method: "POST",
    },
  );
}

type AdminEpochSyncExecuteView = {
  currentEpoch: WeeklyEpochBoundaryView;
  processedEpochs: Array<{
    epochId: string;
    rollover: {
      epochId: string;
      nextEpochId?: string;
      rolledOver: boolean;
      totalPromotionPoolUsdt: string;
    };
    ticketRefresh: {
      eligibleUserIds: string[];
      epochId: string;
      participantCount: number;
      qualifiedTicketCount: number;
    };
  }>;
};

export async function executeAdminEpochSync(
  accessToken: string,
  referenceAt?: string,
) {
  return requestServerJson<AdminOperationResultEnvelope<AdminEpochSyncExecuteView>>(
    "/api/v1/admin/ops/epochs/sync",
    {
      accessToken,
      body: referenceAt ? { referenceAt } : {},
      method: "POST",
    },
  );
}

export async function getMyRewards(accessToken: string) {
  return requestServerJson<PromotionRewardView[]>("/api/v1/rewards/me", {
    accessToken,
  });
}

export async function syncMyClaim(
  accessToken: string,
  body:
    | {
        claimRecordId: string;
        txHash: string;
      }
    | {
        subsidyClaimId: string;
        txHash: string;
      },
) {
  return requestServerJson<PromotionClaimSyncResult>("/api/v1/claims/sync", {
    accessToken,
    body,
    method: "POST",
  });
}

export async function syncMyPurchasedNft(
  accessToken: string,
  txHash: string,
) {
  return requestServerJson<PromotionPurchasedNftSyncResult>(
    "/api/v1/claims/purchased-nft/sync",
    {
      accessToken,
      body: {
        txHash,
      },
      method: "POST",
    },
  );
}
