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

// 赎回订单卡片
function RedeemOrderCard({
  orderId,
  amount,
  date,
  status,
  countdown,
}: {
  orderId: string;
  amount: string;
  date: string;
  status: "pending" | "ready" | "completed";
  countdown?: string;
}) {
  return (
    <div 
      className="p-4 rounded-[16px] mb-3"
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(153, 153, 153, 1) 100%)",
      }}
    >
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-white/60 text-xs">订单编号</p>
          <p className="text-white text-[10px] text-right">{orderId}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">赎回数量</p>
          <p className="text-white text-[10px] text-right">{amount}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">申请日期</p>
          <p className="text-white text-[10px] text-right">{date}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">赎回操作</p>
          <div className="flex gap-2 justify-end">
            {status === "pending" && countdown && (
              <>
                <span className="text-black text-[10px] px-3 py-1 rounded-full bg-gray-300">{countdown}</span>
                <span className="text-white text-[10px] px-3 py-1 rounded-full bg-red-500">取 消</span>
              </>
            )}
            {status === "ready" && (
              <GradientButton size="sm" className="text-[10px] h-[19px] px-3">
                赎 回
              </GradientButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 赎回页面组件
export function RedeemPage() {
  const [activeTab, setActiveTab] = useState("赎回");
  const [amount, setAmount] = useState("100.00");
  const tabs = ["赎回", "申购"];

  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      <div className="px-4 pt-4">
        <PageTitle title="赎 回" detailLink="/redeem/history" />

        {/* Tab 栏 */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 赎回表单 */}
        <GlassCard className="p-4 mb-6">
          {/* 可赎回数量 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">可赎回数量</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
                <path d="M12 8V12M12 16H12.01" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-medium">110.00 USDT</span>
          </div>

          {/* 赎回币种和数量 */}
          <div className="mb-4">
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
              请输入赎回数量，以10的倍数
            </p>
          </div>

          {/* 申请赎回按钮 */}
          <div className="flex justify-center">
            <GradientButton className="w-[173px]">
              申请赎回
            </GradientButton>
          </div>
        </GlassCard>

        {/* 赎回订单列表 */}
        <div>
          <RedeemOrderCard
            orderId="R20260123688"
            amount="100.00 USDT"
            date="2026/01/22 12:23:11"
            status="pending"
            countdown="23:58:15"
          />

          <RedeemOrderCard
            orderId="R20260123688"
            amount="100.00 USDT"
            date="2026/01/22 12:23:11"
            status="ready"
          />
        </div>
      </div>
    </MobileLayout>
  );
}
