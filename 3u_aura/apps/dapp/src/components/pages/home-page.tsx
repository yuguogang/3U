"use client";

import Image from "next/image";
import Link from "next/link";
import { MobileLayout, GlassCard, GradientButton } from "@/components/layout/mobile-layout";

// Hero 区域
function HeroSection() {
  return (
    <div className="relative px-5 pt-8 pb-12">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-[210px] h-[214px] opacity-60">
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <div className="absolute top-[100px] left-0 w-[140px] h-[144px]">
        <Image
          src="/images/hero-decoration.svg"
          alt=""
          width={140}
          height={144}
          className="object-contain opacity-30"
        />
      </div>

      {/* 内容 */}
      <div className="relative z-10">
        <h1
          className="text-[32px] font-bold mb-4"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FA2B15 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          永续期货套利
        </h1>
        <p className="text-white/80 text-sm leading-relaxed mb-8">
          AI 驱动的永续合约套利基础设施
          <br />
          以毫秒级智能决策系统，构建可验证的收益结构
          <br />
          以跨周期风险对冲机制，实现稳定、可持续的回报来源
        </p>
        <Link href="/products">
          <GradientButton size="sm" className="w-[100px]">
            开始套利
          </GradientButton>
        </Link>
      </div>
    </div>
  );
}

// 功能卡片
function FeatureCards() {
  const features = [
    {
      title: "永续合约套利",
      subtitle: "价差捕捉 · 资金费率 · 低风险策略",
      image: "/images/feature-1.png",
      bgColor: "rgba(250, 43, 21, 0.15)",
      glowColor: "#FA2B15",
    },
    {
      title: "跨交易所套利",
      subtitle: "多平台 · 高流动性 · 价格同步",
      image: "/images/feature-2.png",
      bgColor: "rgba(0, 0, 0, 1)",
      glowColor: "#4F46E5",
    },
    {
      title: "AI 自动化执行",
      subtitle: "智能决策 · 全自动 · 稳定执行",
      image: "/images/feature-3.png",
      bgColor: "rgba(0, 0, 0, 1)",
      glowColor: "#10B981",
    },
  ];

  return (
    <div className="px-5">
      <div className="flex items-start gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
        {features.map((feature, index) => (
          <GlassCard
            key={index}
            className="flex-shrink-0 w-[140px] p-4 relative overflow-hidden"
          >
            {/* 背景光晕 */}
            <div
              className="absolute top-0 right-0 w-[80px] h-[80px] rounded-full blur-[40px] opacity-50"
              style={{ background: feature.glowColor }}
            />
            {/* 图标 */}
            <div className="relative w-[60px] h-[60px] mb-3">
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-white text-sm font-semibold mb-1">
              {feature.title}
            </h3>
            <p className="text-white/50 text-[10px] leading-tight">
              {feature.subtitle}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// 功能介绍区域
function FeaturesIntro() {
  return (
    <div className="px-5 py-8">
      <h2 className="text-white text-lg font-semibold mb-1">功能介绍</h2>
      <p className="text-white/50 text-sm">策略驱动 × 高效执行</p>
    </div>
  );
}

// 战略合作区域
function PartnersSection() {
  const partners = [
    { name: "Binance", logo: "/images/binance-logo.png", type: "image" },
    { name: "HTX", logo: "/images/htx-logo.svg", type: "svg" },
    { name: "DRW", logo: "/images/drw-logo.svg", type: "svg" },
    { name: "Castrum Capital", logo: "/images/castrum-logo.svg", type: "svg" },
  ];

  return (
    <div className="px-5 py-8">
      <h2 className="text-white text-lg font-semibold mb-1">战略合作</h2>
      <p className="text-white/50 text-sm mb-2">
        润安已完成阶段性战略资本引入，并与多家全球加密与量化机构建立长期协作关系
      </p>
      <p className="text-white/50 text-sm mb-6">
        战略投资方涵盖研究型基金与基础设施机构，包括 Castrum Capital、DRW Trading 等
      </p>

      <div className="grid grid-cols-2 gap-3">
        {partners.map((partner, index) => (
          <GlassCard key={index} className="p-4 flex flex-col items-center justify-center h-[100px] relative">
            {/* 装饰光点 */}
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <div className="relative w-[50px] h-[50px] mb-2">
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-white/70 text-xs">{partner.name}</span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// 公告卡片
function AnnouncementCard() {
  return (
    <div className="px-5 py-4">
      <GlassCard className="p-4 relative overflow-hidden">
        {/* 播放按钮 */}
        <div className="absolute top-4 right-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 3L13 8L4 13V3Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* 图标 */}
        <div className="w-5 h-5 mb-3">
          <Image
            src="/images/community-icon.svg"
            alt=""
            width={20}
            height={20}
          />
        </div>

        <h3 className="text-white text-base font-semibold mb-2">
          项目社区正式开放，构建以规则与机制为核心的长期协作网络
        </h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          社区以规则驱动与长期主义为核心理念，致力于为用户提供清晰、透明且高效的沟通环境，推动项目在理性与秩序中稳步发展...
        </p>

        {/* 更多按钮 */}
        <button
          className="px-4 py-1.5 rounded-full text-white text-xs"
          style={{
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          更多
        </button>

        {/* 缩略图 */}
        <div className="absolute bottom-4 right-4 w-[80px] h-[52px] rounded-lg overflow-hidden">
          <Image
            src="/images/community-img.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>
      </GlassCard>
    </div>
  );
}

// 社群直达区域
function CommunitySection() {
  return (
    <div className="px-5 py-8">
      <h2 className="text-white text-lg font-semibold mb-6">社群直达</h2>

      <GlassCard className="p-6 relative overflow-hidden">
        {/* Telegram 图标装饰 */}
        <div className="absolute top-4 right-4 w-[100px] h-[70px] opacity-30">
          <Image
            src="/images/telegram-icon.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        <h3 className="text-white text-lg font-semibold mb-2">
          欢迎加入Telegram社区
        </h3>
        <p className="text-white/60 text-sm mb-6">
          与我们一起， 在长期与秩序中前行！
        </p>

        <GradientButton size="md">
          加入 Telegram
        </GradientButton>
      </GlassCard>
    </div>
  );
}

// 页脚区域
function Footer() {
  return (
    <div className="px-5 py-8 border-t border-white/10">
      <div className="flex items-center justify-center gap-6 mb-6">
        <Link href="#" className="w-[37px] h-[37px]">
          <Image
            src="/images/social-twitter.svg"
            alt="Twitter"
            width={37}
            height={37}
          />
        </Link>
        <Link href="#" className="w-[37px] h-[37px]">
          <Image
            src="/images/social-telegram.svg"
            alt="Telegram"
            width={37}
            height={37}
          />
        </Link>
        <Link href="#" className="w-[37px] h-[37px]">
          <Image
            src="/images/social-discord.svg"
            alt="Discord"
            width={37}
            height={37}
          />
        </Link>
      </div>

      <div className="flex justify-center mb-4">
        <Image
          src="/images/logo.png"
          alt="RAN"
          width={63}
          height={25}
          className="opacity-60"
        />
      </div>

      <p className="text-white/30 text-xs text-center">
        Copyright 2026 © Ran. All rights reserved.
      </p>
    </div>
  );
}

// 主页组件
export function HomePage() {
  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      <HeroSection />
      <FeatureCards />
      <FeaturesIntro />
      <AnnouncementCard />
      <PartnersSection />
      <CommunitySection />
      <Footer />
    </MobileLayout>
  );
}
