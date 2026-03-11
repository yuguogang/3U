"use client";

import { useEffect } from "react";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { useFinanceProductsSearchQuery } from "@/queries/finance.query";
import { useProductsStore } from "@/store/products.store";
import {
  PageTitle,
  SubscribeForm,
  ArbitrageCard,
  type ArbitragePool,
} from "@/components/products";

const ARBITRAGE_POOLS: ArbitragePool[] = [
  {
    name: "BTC U本位合约套利",
    icon: "\u20BF",
    threeDay: "0.062%",
    threeYear: "+6.38%",
    monthly: "5.14%",
    nextRate: "0.00129%",
    nextYear: "+1.24%",
    available: "416,671.00 USDT",
  },
  {
    name: "ETH U本位合约套利",
    icon: "\u039E",
    threeDay: "0.058%",
    threeYear: "+5.92%",
    monthly: "4.87%",
    nextRate: "0.00118%",
    nextYear: "+1.15%",
    available: "328,542.00 USDT",
  },
  {
    name: "XRP U本位合约套利",
    icon: "X",
    threeDay: "0.071%",
    threeYear: "+7.21%",
    monthly: "5.89%",
    nextRate: "0.00142%",
    nextYear: "+1.38%",
    available: "185,320.00 USDT",
  },
];

export function ProductsPage() {
  const { data: products, isLoading, isError } = useFinanceProductsSearchQuery();
  const { selectedProductId, setSelectedProductId } = useProductsStore();

  // 自动选中第一个产品
  useEffect(() => {
    if (products?.length && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId, setSelectedProductId]);

  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      <div className="px-4 pt-4">
        <PageTitle title="申购" detailLink="/products/history" />

        {isLoading && (
          <p className="text-white/50 text-center py-10">加载中...</p>
        )}

        {isError && (
          <p className="text-red-400 text-center py-10">加载失败，请刷新重试</p>
        )}

        {products && products.length === 0 && (
          <p className="text-white/50 text-center py-10">暂无可申购产品</p>
        )}

        {products && products.length > 0 && (
          <SubscribeForm
            products={products}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
          />
        )}

        {/* 套利组合 */}
        <div className="mt-6">
          <h2 className="text-white text-lg font-semibold mb-4">套利组合</h2>
          {ARBITRAGE_POOLS.map((pool) => (
            <ArbitrageCard key={pool.name} {...pool} />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
