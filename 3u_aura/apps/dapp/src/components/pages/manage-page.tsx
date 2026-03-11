"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileLayout, GlassCard, GradientButton } from "@/components/layout/mobile-layout";
import { cn } from "@/lib/utils";

// 页面标题组件
function PageTitle({ title, detailLink }: { title: string; detailLink?: string }) {
  return (
    <div className="relative w-full h-6 mb-6">
      <Link href="/" className="absolute left-[35px] top-[5px]">
        <svg width="8" height="15" viewBox="0 0 8 15" fill="none">
          <path d="M7 1L1 7.5L7 14" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <h1 className="text-xl font-semibold text-white text-center leading-6">
        {title}
      </h1>
      {detailLink && (
        <Link href={detailLink} className="absolute right-[32px] top-0 text-sm font-semibold text-white text-right leading-6">
          明细
        </Link>
      )}
    </div>
  );
}

// Tab 组件
function TabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-0 p-[6px] rounded-[26px] mb-6"
      style={{
        border: "1px solid rgba(0, 0, 0, 0.6)",
        boxShadow: "inset 0px 0.5px 1px 0px rgba(255, 255, 255, 0.29), inset 0px -1px 184px 0px rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(35px)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "flex-1 flex items-center justify-center gap-[10px] px-[15px] py-[2px] h-[31px] rounded-[30px] transition-all text-sm font-medium",
            activeTab === tab ? "text-white" : "text-white/60 hover:text-white/80"
          )}
          style={
            activeTab === tab
              ? {
                background: "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "inset 0px 0px 6px 3px rgba(255, 255, 255, 0.25)",
              }
              : {}
          }
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 资产仪表盘卡片（图片设计）
// ============================================

// 极坐标转笛卡尔坐标
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

// 半圆仪表盘 SVG
function GaugeMeter({ percentage }: { percentage: number }) {
  const w = 320;
  const cx = w / 2;
  const cy = 175;
  const outerR = 155;        // 外圈装饰弧半径
  const innerR = 135;        // 主进度弧半径
  const strokeW = 24;        // 主进度弧线宽
  const outerStrokeW = 4;   // 外圈装饰弧线宽

  const startAngle = 180;
  const endAngle = 0;

  // 外圈装饰弧 — 与主轨道同心，间距均匀
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const outerPath = `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 0 1 ${outerEnd.x} ${outerEnd.y}`;

  // 主背景轨道
  const trackStart = polarToCartesian(cx, cy, innerR, startAngle);
  const trackEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${innerR} ${innerR} 0 0 1 ${trackEnd.x} ${trackEnd.y}`;

  // 进度弧
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const progressAngle = startAngle - (180 * clampedPct) / 100;
  const pEnd = polarToCartesian(cx, cy, innerR, progressAngle);
  const progressPath = `M ${trackStart.x} ${trackStart.y} A ${innerR} ${innerR} 0 0 1 ${pEnd.x} ${pEnd.y}`;

  // 百分比标签：圆心在 pEnd（弧中心线终点），这样标签圆（半径 strokeW/2）刚好填充/贴合进度弧末端的 round 圆帽内框
  const badgeRadius = strokeW / 2;
  const badgePos = pEnd;

  // "客户专员"/"客户经理" 在进度弧两端，居中于弧线 strokeW 内
  const leftLabel = polarToCartesian(cx, cy, innerR, 175);
  const rightLabel = polarToCartesian(cx, cy, innerR, 5);

  return (
    <svg viewBox={`0 0 ${w} ${cy + 8}`} className="w-full">
      <defs>
        {/* 进度弧渐变：固定为用户空间，沿整段弧（左端→右端），进度多少都用同一套 100% 渐变色 */}
        <linearGradient id="gaugeGrad" gradientUnits="userSpaceOnUse" x1={trackStart.x} y1={trackStart.y} x2={trackEnd.x} y2={trackEnd.y}>
          <stop offset="0%" stopColor="#FAA44B" />
          <stop offset="40%" stopColor="#F44007" />
          <stop offset="100%" stopColor="#FA2B15" />
        </linearGradient>
        {/* 外圈渐变：同上，固定为 100% 弧长的渐变色 */}
        <linearGradient id="outerGrad" gradientUnits="userSpaceOnUse" x1={trackStart.x} y1={trackStart.y} x2={trackEnd.x} y2={trackEnd.y}>
          <stop offset="0%" stopColor="#FAA44B" stopOpacity="0.7" />
          <stop offset="30%" stopColor="#FAA44B" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#F44007" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FA2B15" stopOpacity="0.6" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="outerGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id="gaugeClip">
          <rect x="0" y="0" width={w} height={cy} />
        </clipPath>
      </defs>

      {/* 外圈装饰弧 — 发光层 */}
      <path d={outerPath} fill="none" stroke="url(#outerGrad)" strokeWidth={outerStrokeW} strokeLinecap="butt" filter="url(#outerGlow)" opacity="0.6" />
      {/* 外圈装饰弧 — 主体层，渐变色加粗 */}
      <path d={outerPath} fill="none" stroke="url(#outerGrad)" strokeWidth={outerStrokeW} strokeLinecap="butt" />

      {/* 主背景轨道 */}
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} strokeLinecap="butt" clipPath="url(#gaugeClip)" />

      {/* 进度弧 — 发光层 */}
      <path d={progressPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth={strokeW} strokeLinecap="round" filter="url(#glow)" opacity="0.5" clipPath="url(#gaugeClip)" />
      {/* 进度弧 — 主体层 */}
      <path d={progressPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth={strokeW} strokeLinecap="round" clipPath="url(#gaugeClip)" />

      {/* 百分比标签 — 高光边框 */}
      <circle cx={badgePos.x} cy={badgePos.y} r={badgeRadius} fill="#FAA44B" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <text x={badgePos.x + 0.5} y={badgePos.y - 0.5} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="7" fontWeight="700">
        {clampedPct}%
      </text>

      {/* 左侧 "客户专员" — 居中于进度弧 */}
      <text x={leftLabel.x} y={leftLabel.y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700">
        <tspan x={leftLabel.x} dy="-4">客户</tspan>
        <tspan x={leftLabel.x} dy="9">专员</tspan>
      </text>

      {/* 右侧 "客户经理" — 居中于进度弧 */}
      <text x={rightLabel.x} y={rightLabel.y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="700">
        <tspan x={rightLabel.x} dy="-4">客户</tspan>
        <tspan x={rightLabel.x} dy="9">经理</tspan>
      </text>
    </svg>
  );
}

// 资产卡片（仪表盘设计）
function AssetCard() {
  // TODO: 对接真实数据
  const data = {
    totalEarnings: "8,888.00",
    currentEarnings: "38.69",
    nextLevelAmount: "1,688.53",
    percentage: 72,
    manageCount: 123,
    totalAssets: "778,651.00",
    referralCount: 15,
    address: "Bk021869K2ABCDEF",
    level: "客户专员",
  };

  const shortenedAddress =
    data.address.length > 12
      ? `${data.address.slice(0, 6)}***${data.address.slice(-4)}`
      : data.address;

  return (
    <div className="mb-6">
      {/* 仪表盘 + 中心内容（无外框，弧线本身就是边框） */}
      <div className="relative">
        {/* 仪表盘 SVG */}
        <GaugeMeter percentage={data.percentage} />

        {/* 中心叠加内容 — 定位在半圆弧内部居中 */}
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <p className="text-white/60 text-xs mb-1">我的收益</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-white text-2xl font-bold leading-none tracking-tight">
              {data.totalEarnings}
            </span>
            <span className="text-white/60 text-xs">USDT</span>
          </div>
          <GradientButton size="sm" className="h-[26px]! px-5! text-xs! mb-2">
            领取收益
          </GradientButton>
          <p className="text-white/60 text-xs">
            当前收益: <span className="text-white font-medium">{data.currentEarnings} USDT</span>
          </p>
          <p className="text-white/40 text-[11px] mt-0.5">
            距离下个职级需要{" "}
            <span className="text-[#FAA44B] font-medium">{data.nextLevelAmount} USDT</span>
          </p>
        </div>
      </div>

      {/* 底部内容区域 — 加边框，宽度对齐外圈装饰弧 */}
      <div
        className="mx-auto rounded-[20px] pb-3 relative"

      >
        {/* 渐变边框层 — 与进度条同色：橙 #FAA44B → #F44007(40%) → 红 #FA2B15 */}
        <div
          className="absolute rounded-xl rounded-t-none pointer-events-none "
          style={{
            inset: "0",
            background: "linear-gradient(to bottom, rgba(250,164,75,0.5), rgba(244,64,7,0.35) 40%, rgba(250,43,21,0.25) 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
        {/* 统计行 */}
        <div className="grid grid-cols-3 py-3 mx-4 border-b border-white/10">
          <div className="text-center">
            <p className="text-white text-lg font-bold">{data.manageCount}</p>
            <p className="text-white/40 text-[11px] mt-0.5">管理人数</p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="text-white text-lg font-bold">{data.totalAssets}</p>
            <p className="text-white/40 text-[11px] mt-0.5">资产管理规模(USDT)</p>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-bold">{data.referralCount}</p>
            <p className="text-white/40 text-[11px] mt-0.5">推荐人数</p>
          </div>
        </div>

        {/* 底部信息行 */}
        <div className="grid grid-cols-2 py-3 mx-4">
          <div className="text-center">
            <p className="text-white/40 text-[11px] mb-1">我的地址</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-white text-sm font-medium">{shortenedAddress}</span>
              <button
                onClick={() => navigator.clipboard.writeText(data.address)}
                className="text-[#F44007] hover:opacity-80 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10 4V2.5C10 1.67 9.33 1 8.5 1H2.5C1.67 1 1 1.67 1 2.5V8.5C1 9.33 1.67 10 2.5 10H4" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-center border-l border-white/10">
            <p className="text-white/40 text-[11px] mb-1">我的职级</p>
            <p className="text-white text-sm font-medium">{data.level}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 订单卡片
function OrderCard({
  type,
  amount,
  status,
  date,
  period,
  returns,
}: {
  type: string;
  amount: string;
  status: "进行中" | "已完成" | "待处理";
  date: string;
  period?: string;
  returns?: string;
}) {
  const statusColors = {
    "进行中": "text-orange-400 bg-orange-400/10",
    "已完成": "text-green-400 bg-green-400/10",
    "待处理": "text-yellow-400 bg-yellow-400/10",
  };

  return (
    <GlassCard className="p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-medium">{type}</span>
        <span className={cn("text-xs px-2 py-1 rounded-full", statusColors[status])}>
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60 text-sm">金额</span>
        <span className="text-white font-medium">{amount}</span>
      </div>

      {period && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">周期</span>
          <span className="text-white">{period}</span>
        </div>
      )}

      {returns && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">收益</span>
          <span className="text-green-400">{returns}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">时间</span>
        <span className="text-white/80 text-sm">{date}</span>
      </div>
    </GlassCard>
  );
}

// 管理页面组件
export function ManagePage() {
  const [activeTab, setActiveTab] = useState("申购");
  const tabs = ["申购", "闪兑", "借贷"];

  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      <div className="px-4 pt-4">
        <PageTitle title="管 理" detailLink="/manage/history" />

        {/* Tab 栏 */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 资产卡片 */}
        <AssetCard />

        {/* 订单列表 */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">近期订单</h2>

          <OrderCard
            type="BTC U本位套利"
            amount="1,000.00 USDT"
            status="进行中"
            date="2026/01/22 12:23"
            period="15天"
            returns="+45.00 USDT"
          />

          <OrderCard
            type="ETH U本位套利"
            amount="500.00 USDT"
            status="已完成"
            date="2026/01/20 09:15"
            period="30天"
            returns="+78.50 USDT"
          />

          <OrderCard
            type="USDT 闪兑 RAN"
            amount="200.00 USDT"
            status="已完成"
            date="2026/01/19 15:42"
          />

          <OrderCard
            type="XRP U本位套利"
            amount="300.00 USDT"
            status="待处理"
            date="2026/01/18 11:30"
            period="90天"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mt-6 mb-8">
          <Link href="/products" className="flex-1">
            <GradientButton className="w-full">
              去申购
            </GradientButton>
          </Link>
          <Link href="/redeem" className="flex-1">
            <button
              className="w-full h-[44px] rounded-[30px] text-white font-semibold"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              去赎回
            </button>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}
