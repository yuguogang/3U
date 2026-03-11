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
          <path d="M7 1L1 7.5L7 14" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

// 周期选择器
function PeriodSelector({ 
  periods,
  selected, 
  onSelect 
}: { 
  periods: string[];
  selected: string;
  onSelect: (period: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onSelect(period)}
          className={cn(
            "px-3 py-2 rounded-[10px] text-[10px] font-normal transition-all min-w-[37px]",
            selected === period ? "text-white" : "text-white/60 hover:text-white/80"
          )}
          style={
            selected === period
              ? {
                  background: "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
                }
              : {
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }
          }
        >
          {period}
        </button>
      ))}
    </div>
  );
}

// 借贷信息卡片
function LoanInfo() {
  return (
    <div 
      className="p-4 rounded-[16px] mt-4"
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(153, 153, 153, 1) 100%)",
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-white/60 text-xs mb-1">剩余抵押额度 | 百分比</p>
          <p className="text-white text-[10px] text-right">888,888.00 | 100%</p>
        </div>
        <div>
          <p className="text-white/60 text-xs mb-1">每日利息 | APR</p>
          <p className="text-white text-[10px] text-right">0.005 USDT | 260%</p>
        </div>
        <div>
          <p className="text-white/60 text-xs mb-1">抵押数量 | 周期</p>
          <p className="text-white text-[10px] text-right">100.00 USDT | 90天</p>
        </div>
        <div>
          <p className="text-white/60 text-xs mb-1">抵押率 | 清算线</p>
          <p className="text-white text-[10px] text-right">0.5% | 0.1%</p>
        </div>
        <div className="col-span-2">
          <p className="text-white/60 text-xs mb-1">抵押日期</p>
          <p className="text-white text-[10px] text-right">2026/01/22 12:23:11</p>
        </div>
      </div>
    </div>
  );
}

// 借贷页面组件
export function LoanPage() {
  const [amount, setAmount] = useState("100.00");
  const [selectedPeriod, setSelectedPeriod] = useState("90天");
  const periods = ["7天", "15天", "30天", "90天", "180天", "360天"];

  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      <div className="px-4 pt-4">
        <PageTitle title="借 贷" detailLink="/loan/history" />

        {/* 借贷表单 */}
        <GlassCard className="p-4">
          {/* 抵押网络 */}
          <div className="mb-6">
            <label className="text-white font-medium block mb-4">抵押网络</label>
            <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors w-full">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="text-white font-medium flex-1 text-left">BNB Smart Chain（BSC）</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 抵押币种 */}
          <div className="mb-6">
            <label className="text-white font-medium block mb-4">抵押币种</label>
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">U</span>
                </div>
                <span className="text-white font-medium">USDT</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <GlassCard className="px-4 py-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-white text-xl font-medium text-right outline-none w-[100px]"
                />
              </GlassCard>
            </div>
            <p className="text-gray-400 text-sm text-right mt-2">
              余额: 888.08 USDT
            </p>
          </div>

          {/* 选择周期 */}
          <div className="mb-6">
            <label className="text-white font-medium block mb-4">选择周期</label>
            <PeriodSelector
              periods={periods}
              selected={selectedPeriod}
              onSelect={setSelectedPeriod}
            />
          </div>

          {/* 借贷信息 */}
          <LoanInfo />
        </GlassCard>

        {/* 操作按钮 */}
        <div className="flex gap-4 mt-6 mb-8">
          <GradientButton className="flex-1">
            借 款
          </GradientButton>
          <Link href="/loan/repay" className="flex-1">
            <button
              className="w-full h-[44px] rounded-[30px] text-black font-semibold"
              style={{
                background: "linear-gradient(180deg, rgba(115, 115, 115, 1) 0%, rgba(125, 125, 125, 1) 51%, rgba(217, 217, 217, 1) 100%)",
              }}
            >
              还款
            </button>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}
