import type { CSSProperties, ReactNode } from "react";
import {
  CalendarDays,
  Diamond,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";

const marbleBackdrop: CSSProperties = {
  backgroundImage: `
    linear-gradient(180deg, rgba(255,250,242,0.88) 0%, rgba(253,247,237,0.92) 100%),
    url("https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?auto=format&fit=crop&w=1600&q=80")
  `,
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
};

const heroPlate: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 50% -16%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 34%),
    linear-gradient(180deg, rgba(243,223,174,0.98) 0%, rgba(229,199,134,0.98) 40%, rgba(212,176,104,0.98) 74%, rgba(191,146,73,0.98) 100%),
    repeating-linear-gradient(90deg, rgba(255,251,236,0.24) 0 1px, rgba(179,137,70,0.06) 1px 3px)
  `,
  boxShadow:
    "0 20px 34px rgba(119,84,37,0.16), inset 0 1px 0 rgba(255,250,240,0.92), inset 0 -6px 10px rgba(156,112,45,0.14)",
};

const radialPlate: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 68% 35%, rgba(255,248,223,0.88) 0%, rgba(255,248,223,0.48) 12%, rgba(255,248,223,0) 24%),
    radial-gradient(circle at 50% 50%, rgba(255,246,218,0.68) 0%, rgba(255,236,190,0.18) 17%, rgba(0,0,0,0) 33%),
    conic-gradient(from 0deg at 50% 50%, #ae7d31 0deg, #f8e09b 32deg, #c7943f 66deg, #f6d98f 104deg, #b98431 146deg, #f6d98f 212deg, #ae7d31 274deg, #f8e09b 320deg, #ae7d31 360deg)
  `,
  boxShadow:
    "0 16px 28px rgba(120,84,39,0.14), inset 0 1px 0 rgba(255,251,240,0.82), inset 0 -5px 8px rgba(161,117,45,0.12)",
};

const heroRim: CSSProperties = {
  backgroundImage: `
    linear-gradient(145deg, rgba(255,248,220,0.98) 0%, rgba(237,205,132,0.96) 14%, rgba(179,130,54,0.96) 52%, rgba(251,229,171,0.98) 84%, rgba(134,92,36,0.98) 100%)
  `,
  boxShadow:
    "0 18px 30px rgba(103,68,29,0.18), inset 0 1px 0 rgba(255,250,235,0.96), inset 0 -1px 0 rgba(111,74,31,0.26)",
};

const statRim: CSSProperties = {
  backgroundImage: `
    linear-gradient(145deg, rgba(255,247,217,0.98) 0%, rgba(240,208,133,0.96) 10%, rgba(180,127,46,0.98) 48%, rgba(248,223,160,0.98) 82%, rgba(120,79,30,0.98) 100%)
  `,
  boxShadow:
    "0 14px 24px rgba(105,71,30,0.16), inset 0 1px 0 rgba(255,250,233,0.94), inset 0 -1px 0 rgba(108,72,27,0.28)",
};

const outlineRim: CSSProperties = {
  backgroundImage: `
    linear-gradient(145deg, rgba(255,248,222,0.96) 0%, rgba(233,201,131,0.96) 16%, rgba(180,129,56,0.94) 50%, rgba(246,225,172,0.98) 86%, rgba(138,95,39,0.94) 100%)
  `,
  boxShadow:
    "0 14px 24px rgba(109,77,35,0.1), inset 0 1px 0 rgba(255,251,238,0.96), inset 0 -1px 0 rgba(121,83,36,0.18)",
};

const outlineSurface: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,253,247,0.98) 0%, rgba(255,249,238,0.94) 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -6px 10px rgba(175,140,79,0.06)",
};

const navShell: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 50% -18%, rgba(255,233,176,0.18) 0%, rgba(255,233,176,0) 42%),
    linear-gradient(180deg, rgba(120,85,38,0.98) 0%, rgba(93,62,29,0.98) 100%)
  `,
  boxShadow:
    "0 -8px 24px rgba(73,45,16,0.14), inset 0 1px 0 rgba(255,242,205,0.22)",
};

function MetalFrame({
  children,
  rimStyle,
  surfaceStyle,
  outerClassName,
  innerClassName,
}: {
  children: ReactNode;
  rimStyle: CSSProperties;
  surfaceStyle: CSSProperties;
  outerClassName: string;
  innerClassName: string;
}) {
  return (
    <div className={outerClassName} style={rimStyle}>
      <div className={innerClassName} style={surfaceStyle}>
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -1px 0 rgba(134,95,39,0.14)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-[6px] rounded-[inherit] opacity-80"
          style={{
            border: "1px solid rgba(255,248,224,0.32)",
            boxShadow: "inset 0 0 0 1px rgba(170,126,56,0.06)",
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function CoinBadge({
  children,
  size = 42,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(180deg, rgba(112,70,25,1) 0%, rgba(77,48,18,1) 100%)",
        boxShadow: "0 8px 18px rgba(91,58,26,0.2)",
      }}
    >
      <div
        className="absolute inset-[2px] rounded-full"
        style={{
          background:
            "linear-gradient(140deg, #fff4c9 0%, #efcf80 28%, #bb8230 68%, #f4d88e 100%)",
        }}
      />
      <div
        className="absolute inset-[6px] rounded-full border border-[rgba(255,247,221,0.56)]"
        style={{
          background:
            "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 22%), linear-gradient(180deg, rgba(255,242,205,0.98) 0%, rgba(218,177,87,0.98) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-[6px] rounded-full"
        style={{
          boxShadow:
            "inset 1px 1px 0 rgba(255,249,231,0.76), inset -1px -2px 0 rgba(132,89,33,0.18)",
        }}
      />
      <div className="absolute z-10 translate-x-[1.25px] translate-y-[1.5px] text-[#8f5f27] opacity-45">
        {children}
      </div>
      <div className="absolute z-10 -translate-x-[0.6px] -translate-y-[0.8px] text-[#fff7dc] opacity-55">
        {children}
      </div>
      <div className="relative z-20 text-[#795122] drop-shadow-[0_1px_0_rgba(255,249,229,0.55)]">
        {children}
      </div>
    </div>
  );
}

function FeatureTile({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <MetalFrame
      outerClassName="relative overflow-hidden rounded-[1.35rem] p-[1.5px]"
      innerClassName="relative overflow-hidden rounded-[1.28rem] px-4 py-4"
      rimStyle={outlineRim}
      surfaceStyle={outlineSurface}
    >
      <CoinBadge size={34}>{icon}</CoinBadge>
      <div className="mt-3 text-[0.98rem] font-semibold text-[#6b471d]">
        {title}
      </div>
      <div className="mt-1 text-xs leading-5 text-[#8d6b3d]">{subtitle}</div>
    </MetalFrame>
  );
}

function StatTile({
  title,
  value,
  subValue,
  icon,
}: {
  title: string;
  value: string;
  subValue: string;
  icon: ReactNode;
}) {
  return (
    <MetalFrame
      outerClassName="relative overflow-hidden rounded-[1.18rem] p-[1.5px]"
      innerClassName="relative overflow-hidden rounded-[1.08rem] px-4 py-3"
      rimStyle={statRim}
      surfaceStyle={radialPlate}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.86rem] font-medium text-[#7b5528]">{title}</div>
          <div className="mt-2 text-[2rem] font-semibold leading-none text-[#4e3112]">
            {value}
          </div>
          <div className="mt-2 text-[0.9rem] text-[#7b5a30]">{subValue}</div>
        </div>
        <CoinBadge size={32}>{icon}</CoinBadge>
      </div>
    </MetalFrame>
  );
}

function BottomNavIcon({
  label,
  active = false,
  children,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${active ? "text-[#f2d18c]" : "text-[#e8d0a1]"}`}
    >
      <div className={`${active ? "scale-105" : ""}`}>{children}</div>
      <div className="text-[10px]">{label}</div>
    </div>
  );
}

export default function GmPreviewPage() {
  return (
    <main className="min-h-screen text-[#5e3d18]" style={marbleBackdrop}>
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden">
        <header
          className="sticky top-0 z-10 border-b border-[rgba(121,87,43,0.16)] px-4 py-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(130,91,41,0.95) 0%, rgba(120,82,37,0.95) 100%)",
            boxShadow: "0 8px 18px rgba(90,58,25,0.16)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <CoinBadge size={34}>
                <span
                  className="text-[0.92rem] font-semibold"
                  style={{ fontFamily: "var(--font-display-face), serif" }}
                >
                  3U
                </span>
              </CoinBadge>
              <div className="min-w-0">
                <div className="truncate text-[1.02rem] font-semibold text-[#f6dfac]">
                  AURA...
                </div>
                <div className="text-[11px] text-[#e4cf9f]">推广 | 收益盘</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full border border-[rgba(245,225,179,0.18)] bg-[rgba(92,62,29,0.68)] px-3 py-2 text-[0.85rem] text-[#f3dfb4]">
                BSC Testnet
              </div>
              <div className="rounded-full border border-[rgba(245,225,179,0.18)] bg-[rgba(92,62,29,0.68)] px-3 py-2 text-[0.85rem] text-[#f3dfb4]">
                0x3C4*...93BC
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pb-28 pt-4">
          <MetalFrame
            outerClassName="relative overflow-hidden rounded-[1.85rem] p-[1.5px]"
            innerClassName="relative overflow-hidden rounded-[1.73rem] px-5 py-6"
            rimStyle={heroRim}
            surfaceStyle={heroPlate}
          >
            <div className="text-center">
              <div className="text-[1.2rem] font-medium text-[#6e491d]">
                累计获得 AURA
              </div>
              <div className="mx-auto mt-3 flex w-full justify-center">
                <div className="relative">
                  <div
                    className="font-brand text-[3rem] font-semibold leading-none text-[#d8b15d]"
                    style={{
                      textShadow:
                        "0 0 10px rgba(255,238,179,0.72), 0 2px 2px rgba(170,123,46,0.18)",
                    }}
                  >
                    0
                  </div>
                  <div
                    className="pointer-events-none absolute inset-x-0 top-[2px] text-[3rem] font-semibold leading-none text-[#fff3ca] opacity-45"
                    style={{ fontFamily: "var(--font-display-face), serif" }}
                  >
                    0
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[1.05rem] text-[#7b5a30]">≈ $0.00 USD</div>
              <div className="mt-2 flex items-center justify-center gap-2 text-[1rem] text-[#3d9866]">
                <Sparkles className="h-4 w-4" />
                <span>+0.0%</span>
                <span className="text-[#6a8b63]">本周</span>
              </div>
            </div>
          </MetalFrame>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile
              title="当前周期"
              value="#3"
              subValue="进行中"
              icon={<Sparkles className="h-4 w-4" strokeWidth={2.2} />}
            />
            <StatTile
              title="小区业绩"
              value="0 USDT"
              subValue="当前进度"
              icon={<UsersRound className="h-4 w-4" strokeWidth={2.2} />}
            />
          </div>

          <section className="mt-5">
            <div className="mb-2 text-[1rem] font-medium text-[#7b5528]">里程碑与提醒</div>
            <MetalFrame
              outerClassName="relative overflow-hidden rounded-[1.48rem] p-[1.5px]"
              innerClassName="relative overflow-hidden rounded-[1.38rem] px-4 py-4"
              rimStyle={outlineRim}
              surfaceStyle={outlineSurface}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CoinBadge size={34}>
                    <Zap className="h-4 w-4" strokeWidth={2.1} />
                  </CoinBadge>
                  <div>
                    <div className="text-[1rem] font-semibold text-[#5d3c16]">
                      NFT 达标状态
                    </div>
                    <div className="text-sm text-[#8a693c]">未达标</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-[#bf8d42]">详情</div>
              </div>
            </MetalFrame>
          </section>

          <section className="mt-5">
            <div className="mb-3 text-[1rem] font-medium text-[#7b5528]">功能入口</div>
            <div className="grid grid-cols-2 gap-3">
              <FeatureTile
                title="每日签到"
                subtitle="每天获取 1000 AURA"
                icon={<CalendarDays className="h-4 w-4" strokeWidth={2.1} />}
              />
              <FeatureTile
                title="我的团队"
                subtitle="查看网络结构"
                icon={<UserRound className="h-4 w-4" strokeWidth={2.1} />}
              />
              <FeatureTile
                title="奖励明细"
                subtitle="查看收益数据"
                icon={<Trophy className="h-4 w-4" strokeWidth={2.1} />}
              />
              <FeatureTile
                title="NFT 市场"
                subtitle="购买并获取 NFT"
                icon={<Diamond className="h-4 w-4" strokeWidth={2.1} />}
              />
            </div>
          </section>

          <div className="mt-6 rounded-full border border-[rgba(181,141,72,0.54)] bg-[rgba(103,71,30,0.2)] px-4 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-[#8a6632]">
            Sample Preview · Marble / Hero A / Badge direction
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-0">
          <div className="px-4 pb-3 pt-2" style={navShell}>
            <div className="relative flex items-end justify-between px-4 pb-1 pt-3">
              <BottomNavIcon label="首页" active>
                <CalendarDays className="h-5 w-5" />
              </BottomNavIcon>
              <BottomNavIcon label="团队">
                <UsersRound className="h-5 w-5" />
              </BottomNavIcon>
              <BottomNavIcon label="NFT">
                <Diamond className="h-5 w-5" />
              </BottomNavIcon>
              <BottomNavIcon label="奖励">
                <Trophy className="h-5 w-5" />
              </BottomNavIcon>

              <div className="absolute right-4 top-[-18px]">
                <CoinBadge size={60}>
                  <span
                    className="text-[2rem] leading-none"
                    style={{ fontFamily: "var(--font-display-face), serif" }}
                  >
                    +
                  </span>
                </CoinBadge>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none fixed bottom-8 right-[max(1rem,calc((100vw-430px)/2+1rem))] text-[#c9ad76]">
          ✦
        </div>
      </div>
    </main>
  );
}
