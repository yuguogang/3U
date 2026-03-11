import {
  apiFinanceProductsSearch,
  apiFinanceGetProduct,
  apiFinanceSubscribe,
  apiFinanceGetSubscriptions,
  apiFinanceRedeemSubscription,
} from "@/api/finance";
import type {
  FinanceSubscribeInput,
  FinanceGetSubscriptionsQueryInput,
} from "3u-aura-common";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ========== Query Key Factory ==========

export const financeKeys = {
  all: ["finance"] as const,
  products: () => [...financeKeys.all, "products"] as const,
  product: (id: number) => [...financeKeys.all, "products", id] as const,
  subscriptions: (filters?: FinanceGetSubscriptionsQueryInput) =>
    [...financeKeys.all, "subscriptions", filters] as const,
};

// ========== Queries ==========

export function useFinanceProductsSearchQuery() {
  return useQuery({
    queryKey: financeKeys.products(),
    queryFn: apiFinanceProductsSearch,
    select: (data) => data.items,
  });
}

export function useFinanceProductQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: financeKeys.product(id),
    queryFn: () => apiFinanceGetProduct(id),
    enabled,
  });
}

export function useFinanceSubscriptionsQuery(
  filters?: FinanceGetSubscriptionsQueryInput,
) {
  return useQuery({
    queryKey: financeKeys.subscriptions(filters),
    queryFn: () => apiFinanceGetSubscriptions(filters),
  });
}

// ========== Mutations ==========

export function useFinanceSubscribeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["finance", "subscribe"],
    mutationFn: (data: FinanceSubscribeInput) => apiFinanceSubscribe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.products() });
      queryClient.invalidateQueries({ queryKey: financeKeys.subscriptions() });
    },
  });
}

export function useFinanceRedeemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["finance", "redeem"],
    mutationFn: (id: number) => apiFinanceRedeemSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.subscriptions() });
    },
  });
}
