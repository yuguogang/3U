import type { FinanceProduct } from "@/api/finance";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}:${s}`;
}

export function SubscriptionInfo({
  product,
  amount,
}: {
  product: FinanceProduct;
  amount: string;
}) {
  const amountNum = parseFloat(amount) || 0;
  const apyMin = parseFloat(product.apyMin) || 0;
  const apyMax = parseFloat(product.apyMax) || 0;
  const avgApy = (apyMin + apyMax) / 2;
  const hourlyReturn = (amountNum * avgApy) / 100 / 365 / 24;
  const periodLabel = product.lockPeriod === 0 ? "活期" : `${product.lockPeriod}天`;
  const feeRate = parseFloat(product.redemptionFeeRate) || 0;

  return (
    <div
      className="p-4 rounded-[16px] mt-4"
      style={{
        background: "rgba(250, 43, 21, 0.1)",
        border: "1px solid rgba(250, 43, 21, 0.2)",
      }}
    >
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-white/50 text-xs mb-1">申购数量 | 周期</p>
          <p className="text-white text-sm font-medium">
            {amountNum > 0 ? amountNum.toFixed(2) : "0.00"} USDT | {periodLabel}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">前30天平均收益</p>
          <p className="text-white text-sm font-medium">
            {apyMin}% ~ {apyMax}%
          </p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">每小时预估收益</p>
          <p className="text-white text-sm font-medium">
            {hourlyReturn.toFixed(4)} USDT
          </p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">赎回 | 资金管理费</p>
          <p className="text-white text-sm font-medium">
            {product.lockPeriod === 0 ? "随时赎回" : "到期赎回"} | {feeRate}%
          </p>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-white/50 text-xs mb-1">申购日期</p>
        <p className="text-white text-sm font-medium">{formatDate(new Date())}</p>
      </div>
    </div>
  );
}
