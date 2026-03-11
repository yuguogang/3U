"use client";

import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { FinanceSubscribeSchema } from "3u-aura-common";
import type { FinanceProduct } from "@/api/finance";
import { useFinanceSubscribeMutation } from "@/queries/finance.query";
import { GlassCard } from "@/components/layout/mobile-layout";
import { PeriodSelector } from "./period-selector";
import { SubscriptionInfo } from "./subscription-info";
import { cn } from "@/lib/utils";
import { z } from "zod";

function buildClientSchema(product: FinanceProduct | null) {
  if (!product) return FinanceSubscribeSchema;

  const min = parseFloat(product.minAmount) || 0;
  const maxPerUser = product.maxAmountPerUser
    ? parseFloat(product.maxAmountPerUser)
    : undefined;
  const remaining = product.remainingQuota
    ? parseFloat(product.remainingQuota)
    : undefined;

  return FinanceSubscribeSchema.extend({
    amount: z
      .string()
      .min(1, "请输入申购金额")
      .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "请输入有效金额")
      .refine((v) => Number(v) >= min, `最小申购金额为 ${min} USDT`)
      .refine(
        (v) => !maxPerUser || Number(v) <= maxPerUser,
        maxPerUser ? `个人最高申购数量为 ${maxPerUser} USDT` : "",
      )
      .refine(
        (v) => !remaining || Number(v) <= remaining,
        remaining ? `剩余额度不足，当前可申购 ${remaining} USDT` : "",
      ),
  });
}

export function SubscribeForm({
  products,
  selectedProductId,
  onSelectProduct,
}: {
  products: FinanceProduct[];
  selectedProductId: number | null;
  onSelectProduct: (id: number) => void;
}) {
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? null;

  const schema = buildClientSchema(selectedProduct);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      productId: selectedProductId ?? 0,
      amount: "",
      symbol: "USDT",
    },
  });

  const subscribeMutation = useFinanceSubscribeMutation();
  const amount = watch("amount");

  const onSubmit = handleSubmit((data) => {
    subscribeMutation.mutate({
      productId: data.productId,
      amount: data.amount,
      symbol: data.symbol,
    });
  });

  const handleSelectProduct = (productId: number) => {
    onSelectProduct(productId);
    setValue("productId", productId);
  };

  return (
    <form onSubmit={onSubmit}>
      <GlassCard className="p-4">
        {/* 申购币种 */}
        <div className="mb-6">
          <label className="text-white font-medium block mb-4">申购币种</label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <span className="text-white font-medium">USDT</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9L12 15L18 9"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <GlassCard className="px-4 py-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                {...register("amount")}
                className="bg-transparent text-white text-xl font-medium text-right outline-none w-[100px]"
              />
            </GlassCard>
          </div>
          {errors.amount && (
            <p className="text-red-400 text-xs mt-2 text-right">
              {errors.amount.message as string}
            </p>
          )}
          {selectedProduct?.remainingQuota && (
            <p className="text-gray-400 text-sm text-right mt-2">
              剩余额度: {parseFloat(selectedProduct.remainingQuota).toLocaleString()} USDT
            </p>
          )}
          {selectedProduct && (
            <div className="flex justify-between text-gray-400 text-xs mt-1">
              <span>最低: {parseFloat(selectedProduct.minAmount).toLocaleString()} USDT</span>
              {selectedProduct.maxAmountPerUser && (
                <span>个人上限: {parseFloat(selectedProduct.maxAmountPerUser).toLocaleString()} USDT</span>
              )}
            </div>
          )}
        </div>

        {/* 选择周期 */}
        <div className="mb-6">
          <label className="text-white font-medium block mb-4">选择周期</label>
          <PeriodSelector
            products={products}
            selectedProductId={selectedProductId}
            onSelect={handleSelectProduct}
          />
        </div>

        {/* 申购信息预览 */}
        {selectedProduct && (
          <SubscriptionInfo product={selectedProduct} amount={amount} />
        )}
      </GlassCard>

      {/* 开始申购按钮 */}
      <div className="flex justify-center mt-6 mb-8">
        <button
          type="submit"
          disabled={subscribeMutation.isPending}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[30px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] h-[44px] px-6 text-base w-[200px]",
            subscribeMutation.isPending && "opacity-60",
          )}
          style={{
            background:
              "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
          }}
        >
          {subscribeMutation.isPending ? "申购中..." : "开始申购"}
        </button>
      </div>

      {subscribeMutation.isError && (
        <p className="text-red-400 text-xs text-center mb-4">
          {subscribeMutation.error?.message || "申购失败，请重试"}
        </p>
      )}

      {subscribeMutation.isSuccess && (
        <p className="text-green-400 text-xs text-center mb-4">申购成功</p>
      )}
    </form>
  );
}
