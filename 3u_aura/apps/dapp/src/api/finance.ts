import { fetchClient } from "@/lib/fetch.client";
import {
  type FinanceSubscribeInput,
  type FinanceGetSubscriptionsQueryInput,
  PaginateData,
} from "3u-aura-common";

// ========== 响应类型 ==========

export type FinanceProduct = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  symbols: string[];
  minAmount: string;
  maxAmount: string | null;
  maxAmountPerUser: string | null;
  apyMin: string;
  apyMax: string;
  redemptionFeeRate: string;
  lockPeriod: number;
  profitCycle: string;
  status: string;
  totalQuota: string | null;
  remainingQuota: string | null;
  startAt: string | null;
  endAt: string | null;
  settings: unknown;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSubscription = {
  id: number;
  userId: number;
  productId: number;
  orderNo: string;
  amount: string;
  symbol: string;
  status: string;
  state: string;
  subscribedAt: string;
  startProfitAt: string | null;
  expiredAt: string | null;
  redeemedAt: string | null;
  totalProfit: string;
  lastProfitAt: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  product?: FinanceProduct;
};

// ========== API 函数 ==========

export async function apiFinanceProductsSearch() {
  return fetchClient<PaginateData<FinanceProduct>>(`/api/v1/finance/products`, {
    method: "GET",
  });
}

export async function apiFinanceGetProduct(id: number) {
  return fetchClient<FinanceProduct>(`/api/v1/finance/products/${id}`);
}

export async function apiFinanceSubscribe(data: FinanceSubscribeInput) {
  return fetchClient<FinanceSubscription>(`/api/v1/finance/subscriptions`, {
    method: "POST",
    body: data,
  });
}

export async function apiFinanceGetSubscriptions(
  query?: FinanceGetSubscriptionsQueryInput,
) {
  return fetchClient<FinanceSubscription[]>(`/api/v1/finance/subscriptions`, {
    method: "GET",
    query: query as Record<string, string | undefined>,
  });
}

export async function apiFinanceGetSubscription(id: number) {
  return fetchClient<FinanceSubscription>(
    `/api/v1/finance/subscriptions/${id}`,
  );
}

export async function apiFinanceRedeemSubscription(id: number) {
  return fetchClient<FinanceSubscription>(
    `/api/v1/finance/subscriptions/${id}/redeem`,
    { method: "POST" },
  );
}
