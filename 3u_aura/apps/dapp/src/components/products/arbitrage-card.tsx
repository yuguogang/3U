export type ArbitragePool = {
  name: string;
  icon: string;
  threeDay: string;
  threeYear: string;
  monthly: string;
  nextRate: string;
  nextYear: string;
  available: string;
};

export function ArbitrageCard({
  name,
  icon,
  threeDay,
  threeYear,
  monthly,
  nextRate,
  nextYear,
  available,
}: ArbitragePool) {
  return (
    <div
      className="p-4 rounded-[16px] mb-3"
      style={{
        background: "rgba(250, 43, 21, 0.1)",
        border: "1px solid rgba(250, 43, 21, 0.2)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
          {icon}
        </div>
        <span className="text-white font-semibold">{name}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-white/50 text-xs mb-1">3日累计费率/年化费率</p>
          <p className="text-white text-sm">
            {threeDay} / {threeYear}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">前30天平均月化率</p>
          <p className="text-green-400 text-sm font-medium">{monthly}</p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">下次资金费率/年化费率</p>
          <p className="text-white text-sm">
            {nextRate} / {nextYear}
          </p>
        </div>
        <div>
          <p className="text-white/50 text-xs mb-1">剩余可申购额度</p>
          <p className="text-white text-sm">{available}</p>
        </div>
      </div>
    </div>
  );
}
