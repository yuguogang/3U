import type { FinanceProduct } from "@/api/finance";
import { cn } from "@/lib/utils";

function formatPeriodLabel(lockPeriod: number): string {
  return lockPeriod === 0 ? "活期" : `${lockPeriod}天`;
}

export function PeriodSelector({
  products,
  selectedProductId,
  onSelect,
}: {
  products: FinanceProduct[];
  selectedProductId: number | null;
  onSelect: (productId: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onSelect(product.id)}
          className={cn(
            "px-4 py-2 rounded-[10px] text-sm font-medium transition-all",
            selectedProductId === product.id
              ? "text-white"
              : "text-white/60 hover:text-white/80",
          )}
          style={
            selectedProductId === product.id
              ? {
                  background:
                    "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
                }
              : {
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }
          }
        >
          {formatPeriodLabel(product.lockPeriod)}
        </button>
      ))}
    </div>
  );
}
