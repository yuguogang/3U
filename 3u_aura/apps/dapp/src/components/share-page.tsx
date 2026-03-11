"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MobileLayout, GlassCard, GradientButton } from "@/components/layout/mobile-layout";

// 标题组件
function PageTitle() {
  return (
    <div className="relative w-full h-6">
      {/* 返回箭头 */}
      <Link href="/" className="absolute left-[35px] top-[5px]">
        <svg width="8" height="15" viewBox="0 0 8 15" fill="none">
          <path d="M7 1L1 7.5L7 14" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      {/* 标题 */}
      <h1 className="text-xl font-semibold text-white text-center leading-6">
        分享
      </h1>
      {/* 明细链接 */}
      <Link href="/share/history" className="absolute right-[32px] top-0 text-sm font-semibold text-white text-right leading-6">
        明细
      </Link>
    </div>
  );
}

// Tab 组件
function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-0 p-[6px] mx-5 rounded-[26px]"
      style={{
        border: "1px solid rgba(0, 0, 0, 0.6)",
        boxShadow:
          "inset 0px 0.5px 1px 0px rgba(255, 255, 255, 0.29), inset 0px -1px 184px 0px rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(35px)",
      }}
    >
      <button
        onClick={() => onTabChange("share")}
        className={cn(
          "flex items-center justify-center gap-[10px] px-[15px] py-[2px] w-[160px] h-[31px] rounded-[30px] transition-all",
          activeTab === "share"
            ? "text-white"
            : "text-white/60 hover:text-white/80"
        )}
        style={
          activeTab === "share"
            ? {
                background:
                  "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "inset 0px 0px 6px 3px rgba(255, 255, 255, 0.25)",
              }
            : {}
        }
      >
        <span className="text-sm font-medium">分享</span>
      </button>
      <button
        onClick={() => onTabChange("manage")}
        className={cn(
          "flex items-center justify-center gap-[10px] px-[15px] py-[2px] w-[164px] h-[31px] rounded-[30px] transition-all",
          activeTab === "manage"
            ? "text-white"
            : "text-white/60 hover:text-white/80"
        )}
        style={
          activeTab === "manage"
            ? {
                background:
                  "linear-gradient(180deg, rgba(250, 43, 21, 1) 0%, rgba(244, 64, 7, 1) 40%, rgba(250, 164, 75, 1) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "inset 0px 0px 6px 3px rgba(255, 255, 255, 0.25)",
              }
            : {}
        }
      >
        <span className="text-sm font-medium">我的管理</span>
      </button>
    </div>
  );
}

// Gold 卡片组件
function ReferralCard() {
  return (
    <GlassCard className="relative mx-[17px] h-[124px] overflow-hidden">
      {/* 金币图片 */}
      <div className="absolute right-0 top-0">
        <Image
          src="/images/gold-coin.svg"
          alt="Gold Coin"
          width={110}
          height={106}
          className="object-contain"
        />
      </div>

      {/* 我的链接 */}
      <div className="absolute left-[24px] top-[15px] flex items-center gap-2">
        <span className="text-xs font-medium text-white/60">我的链接</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M9.5 1.5L11.5 3.5M1 12L1.5 9.5L10 1L12 3L3.5 11.5L1 12Z" stroke="#E64500" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* 地址 */}
      <div className="absolute left-[24px] top-[35px]">
        <span className="text-xs font-medium text-white">0x65sf8f****kf2d</span>
      </div>

      {/* 推荐人链接 */}
      <div className="absolute left-[24px] top-[68px] flex items-center gap-2">
        <span className="text-xs font-medium text-white/60">推荐人链接</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M9.5 1.5L11.5 3.5M1 12L1.5 9.5L10 1L12 3L3.5 11.5L1 12Z" stroke="#E64500" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* 绑定按钮 */}
      <Link href="/binding">
        <GradientButton size="sm" className="absolute left-[42px] top-[93px] w-[49px] h-[19px] text-[10px]">
          绑 定
        </GradientButton>
      </Link>
    </GlassCard>
  );
}

// 二维码区域组件
function QRCodeSection() {
  const shareLink = "https://RANCOIN.io/SET/ITS/join";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert("链接已复制");
    } catch {
      console.error("复制失败");
    }
  };

  return (
    <div className="relative rounded-t-[16px] pt-[29px] pb-[34px]">
      {/* 二维码 */}
      <div className="flex justify-center mb-[26px]">
        <div className="w-[189px] h-[189px] rounded-[20px] bg-white flex items-center justify-center overflow-hidden">
          <Image
            src="/images/qrcode.svg"
            alt="QR Code"
            width={189}
            height={189}
          />
        </div>
      </div>

      {/* 我的分享链接标题 */}
      <div className="px-4 mb-[10px]">
        <span className="text-sm font-medium text-white">我的分享链接</span>
      </div>

      {/* 链接输入框 */}
      <GlassCard className="mx-4 flex items-center justify-center gap-[10px] px-[10px] h-12 rounded-[30px]">
        <span className="text-sm font-medium text-white">{shareLink}</span>
      </GlassCard>

      {/* 复制链接按钮 */}
      <div className="flex justify-center mt-[24px]">
        <GradientButton onClick={handleCopyLink} className="w-[219px]">
          <span>复制链接</span>
          <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
            <path d="M10.5 4H5.5C4.94772 4 4.5 4.44772 4.5 5V10C4.5 10.5523 4.94772 11 5.5 11H10.5C11.0523 11 11.5 10.5523 11.5 10V5C11.5 4.44772 11.0523 4 10.5 4Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.5 8H2C1.44772 8 1 7.55228 1 7V2C1 1.44772 1.44772 1 2 1H7C7.55228 1 8 1.44772 8 2V2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </GradientButton>
      </div>
    </div>
  );
}

// 主页面组件
export function SharePage() {
  const [activeTab, setActiveTab] = useState("share");

  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      {/* 标题 */}
      <div className="mt-4">
        <PageTitle />
      </div>

      {/* Tab 栏 */}
      <div className="mt-[28px]">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Gold 卡片 */}
      <div className="mt-[19px]">
        <ReferralCard />
      </div>

      {/* 二维码区域 */}
      <div className="mt-px">
        <QRCodeSection />
      </div>
    </MobileLayout>
  );
}
