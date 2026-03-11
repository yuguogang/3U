"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileLayout, GlassCard, GradientButton } from "@/components/layout/mobile-layout";

// 页面标题组件
function PageTitle({ title }: { title: string }) {
  return (
    <div className="relative w-full h-6 mb-6">
      <Link href="/share" className="absolute left-[35px] top-[5px]">
        <svg width="8" height="15" viewBox="0 0 8 15" fill="none">
          <path d="M7 1L1 7.5L7 14" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <h1 className="text-xl font-semibold text-white text-center leading-6">
        {title}
      </h1>
    </div>
  );
}

// 绑定页面组件
export function BindingPage() {
  const [referralCode, setReferralCode] = useState("");

  const handleBind = () => {
    if (!referralCode.trim()) {
      alert("请输入推荐人链接");
      return;
    }
    console.log("Binding:", referralCode);
    alert("绑定成功");
  };

  return (
    <MobileLayout showNav={true} showBottomNav={true}>
      <div className="px-4 pt-4">
        <PageTitle title="绑定推荐人" />

        <GlassCard className="p-6">
          {/* 说明 */}
          <div className="mb-6">
            <h2 className="text-white font-semibold mb-2">绑定推荐人</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              输入推荐人的邀请链接或邀请码，完成绑定后即可享受推荐奖励。
            </p>
          </div>

          {/* 输入框 */}
          <div className="mb-6">
            <label className="text-white/60 text-sm block mb-2">推荐人链接/邀请码</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="请输入推荐人链接或邀请码"
              className="w-full h-12 px-4 rounded-[30px] bg-white/10 text-white placeholder-white/40 outline-none border border-white/10 focus:border-orange-500/50 transition-colors"
            />
          </div>

          {/* 注意事项 */}
          <div className="mb-6 p-4 rounded-[16px] bg-orange-500/10 border border-orange-500/20">
            <h3 className="text-orange-400 text-sm font-semibold mb-2">注意事项</h3>
            <ul className="text-white/60 text-xs space-y-1">
              <li>• 绑定后无法更改，请确认推荐人信息</li>
              <li>• 绑定成功后，您和推荐人都将获得奖励</li>
              <li>• 邀请码区分大小写，请仔细核对</li>
            </ul>
          </div>

          {/* 绑定按钮 */}
          <GradientButton onClick={handleBind} className="w-full">
            确认绑定
          </GradientButton>
        </GlassCard>

        {/* 已绑定信息（如果已绑定） */}
        <GlassCard className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">当前推荐人</span>
            <span className="text-white text-sm">暂未绑定</span>
          </div>
        </GlassCard>
      </div>
    </MobileLayout>
  );
}
