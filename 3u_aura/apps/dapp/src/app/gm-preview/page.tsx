import type { CSSProperties, ReactNode } from "react";

const texturePaths = {
  marble: "/images/goldmint/textures/marble-light-01.jpg",
  gold: "/images/goldmint/textures/gold-surface-01.jpg",
  copper: "/images/goldmint/textures/copper-dark-01.jpg",
} as const;

const badgePath = "/images/goldmint/badges/badge-coin.svg";

const iconPaths = {
  calendar: "/images/goldmint/glyphs/calendar-days-solid.svg",
  team: "/images/goldmint/glyphs/user-group-solid.svg",
  trophy: "/images/goldmint/glyphs/trophy-solid.svg",
  bolt: "/images/goldmint/glyphs/bolt-solid.svg",
  sparkles: "/images/goldmint/glyphs/sparkles-solid.svg",
  shield: "/images/goldmint/glyphs/shield-check-solid.svg",
  trend: "/images/goldmint/glyphs/arrow-trending-up-solid.svg",
} as const;

const marbleBackdrop: CSSProperties = {
  backgroundImage: `
    linear-gradient(180deg, rgba(253,249,243,0.88) 0%, rgba(246,239,229,0.82) 100%),
    url("${texturePaths.marble}")
  `,
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
};

const heroSurface: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 50% -16%, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0) 34%),
    linear-gradient(180deg, rgba(243,223,174,0.98) 0%, rgba(229,199,134,0.98) 40%, rgba(212,176,104,0.98) 74%, rgba(191,146,73,0.98) 100%),
    repeating-linear-gradient(90deg, rgba(255,251,236,0.24) 0 1px, rgba(179,137,70,0.06) 1px 3px)
  `,
  backgroundBlendMode: "screen, normal, normal",
  backgroundPosition: "center, center, center",
  backgroundSize: "100% 100%, 100% 100%, auto",
  boxShadow:
    "inset 0 1px 0 rgba(255,250,240,0.92), inset 0 -6px 10px rgba(156,112,45,0.14)",
};

const statSurface: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 68% 35%, rgba(255,248,223,0.88) 0%, rgba(255,248,223,0.48) 12%, rgba(255,248,223,0) 24%),
    radial-gradient(circle at 50% 50%, rgba(255,246,218,0.68) 0%, rgba(255,236,190,0.18) 17%, rgba(0,0,0,0) 33%),
    conic-gradient(from 0deg at 50% 50%, #ae7d31 0deg, #f8e09b 32deg, #c7943f 66deg, #f6d98f 104deg, #b98431 146deg, #f6d98f 212deg, #ae7d31 274deg, #f8e09b 320deg, #ae7d31 360deg)
  `,
  backgroundBlendMode: "screen, screen, normal",
  backgroundPosition: "center, center, center",
  backgroundSize: "100% 100%, 100% 100%, 100% 100%",
  boxShadow:
    "inset 0 1px 0 rgba(255,251,240,0.82), inset 0 -5px 8px rgba(161,117,45,0.12)",
};

const ivorySurface: CSSProperties = {
  backgroundImage: `
    linear-gradient(180deg, rgba(255,254,249,0.96) 0%, rgba(252,247,239,0.92) 100%),
    url("${texturePaths.marble}")
  `,
  backgroundBlendMode: "screen, normal",
  backgroundPosition: "center, center",
  backgroundSize: "100% 100%, cover",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -12px 18px rgba(167,129,74,0.08)",
};

const navShell: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 50% -18%, rgba(255,233,176,0.18) 0%, rgba(255,233,176,0) 42%),
    linear-gradient(180deg, rgba(120,85,38,0.98) 0%, rgba(93,62,29,0.98) 100%)
  `,
  backgroundBlendMode: "screen, normal",
  backgroundPosition: "center, center",
  backgroundSize: "100% 100%, 100% 100%",
  boxShadow:
    "0 -8px 24px rgba(73,45,16,0.14), inset 0 1px 0 rgba(255,242,205,0.22)",
};

const metalPill: CSSProperties = {
  backgroundImage: `
    linear-gradient(180deg, rgba(110,75,33,0.76) 0%, rgba(85,57,27,0.82) 100%),
    radial-gradient(circle at 50% 0%, rgba(255,227,166,0.14) 0%, rgba(255,227,166,0) 54%)
  `,
  backgroundBlendMode: "normal, screen",
  backgroundPosition: "center, center",
  backgroundSize: "100% 100%, 100% 100%",
  boxShadow: "inset 0 1px 0 rgba(255,241,202,0.12)",
};

function IconMask({
  iconSrc,
  size,
  color,
  style,
}: {
  iconSrc: string;
  size: number;
  color: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url("${iconSrc}")`,
        maskImage: `url("${iconSrc}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        ...style,
      }}
    />
  );
}

function EmbossedIcon({
  iconSrc,
  size = 18,
}: {
  iconSrc: string;
  size?: number;
}) {
  return (
    <span
      className="relative block"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <IconMask
        iconSrc={iconSrc}
        size={size}
        color="rgba(126,82,29,0.46)"
        style={{ position: "absolute", inset: 0, transform: "translate(1.5px, 1.8px)" }}
      />
      <IconMask
        iconSrc={iconSrc}
        size={size}
        color="rgba(255,248,224,0.68)"
        style={{ position: "absolute", inset: 0, transform: "translate(-0.85px, -0.95px)" }}
      />
      <IconMask
        iconSrc={iconSrc}
        size={size}
        color="#7a5121"
        style={{ position: "absolute", inset: 0 }}
      />
    </span>
  );
}

function CoinBadge({
  iconSrc,
  size = 42,
}: {
  iconSrc: string;
  size?: number;
}) {
  const iconSize = Math.round(size * 0.46);

  return (
    <div
      className="relative flex items-center justify-center bg-no-repeat"
      style={{
        width: size,
        height: size,
        backgroundImage: `url("${badgePath}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        filter: "drop-shadow(0 8px 18px rgba(92,58,24,0.18))",
      }}
    >
      <EmbossedIcon iconSrc={iconSrc} size={iconSize} />
    </div>
  );
}

function TextCoinBadge({
  children,
  size,
  textClassName,
}: {
  children: ReactNode;
  size: number;
  textClassName: string;
}) {
  return (
    <div
      className="relative flex items-center justify-center bg-no-repeat"
      style={{
        width: size,
        height: size,
        backgroundImage: `url("${badgePath}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        filter: "drop-shadow(0 8px 18px rgba(92,58,24,0.18))",
      }}
    >
      <div className={`absolute translate-x-[1.25px] translate-y-[1.65px] ${textClassName} text-[#8f5f27] opacity-42`}>
        {children}
      </div>
      <div className={`absolute -translate-x-[0.85px] -translate-y-[0.95px] ${textClassName} text-[#fff8de] opacity-62`}>
        {children}
      </div>
      <div className={`relative z-10 ${textClassName} text-[#795122]`}>
        {children}
      </div>
    </div>
  );
}

function FrameShell({
  outerClassName,
  innerClassName,
  surfaceStyle,
  children,
}: {
  outerClassName: string;
  innerClassName: string;
  surfaceStyle: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${outerClassName}`}>
      <div className={`relative z-10 h-full overflow-hidden ${innerClassName}`} style={surfaceStyle}>
        {children}
      </div>
    </div>
  );
}

function FeatureTile({
  title,
  subtitle,
  iconSrc,
}: {
  title: string;
  subtitle: string;
  iconSrc: string;
}) {
  return (
    <FrameShell
      outerClassName="h-[142px]"
      innerClassName="rounded-[1.18rem] px-4 py-4"
      surfaceStyle={ivorySurface}
    >
      <CoinBadge iconSrc={iconSrc} size={36} />
      <div className="mt-3 text-[1rem] font-semibold text-[#68431c]">{title}</div>
      <div className="mt-1 text-xs leading-5 text-[#8a693c]">{subtitle}</div>
    </FrameShell>
  );
}

function StatTile({
  title,
  value,
  subValue,
  iconSrc,
}: {
  title: string;
  value: string;
  subValue: string;
  iconSrc: string;
}) {
  return (
    <FrameShell
      outerClassName="h-[144px]"
      innerClassName="rounded-[1.55rem] px-4 py-3"
      surfaceStyle={statSurface}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.86rem] font-medium text-[#745024]">{title}</div>
          <div className="mt-2 text-[2rem] font-semibold leading-none text-[#4e3112]">
            {value}
          </div>
          <div className="mt-2 text-[0.92rem] text-[#755327]">{subValue}</div>
        </div>
        <CoinBadge iconSrc={iconSrc} size={34} />
      </div>
    </FrameShell>
  );
}

function BottomNavItem({
  label,
  iconSrc,
  active = false,
}: {
  label: string;
  iconSrc: string;
  active?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? "text-[#f2d18c]" : "text-[#e8d0a1]"}`}>
      <IconMask
        iconSrc={iconSrc}
        size={20}
        color={active ? "#f2d18c" : "#e8d0a1"}
      />
      <div className="text-[10px]">{label}</div>
    </div>
  );
}

export default function GmPreviewPage() {
  return (
    <main className="min-h-screen text-[#5e3d18]" style={marbleBackdrop}>
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden">
        <header
          className="sticky top-0 z-10 px-4 py-3"
          style={navShell}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <TextCoinBadge
                size={36}
                textClassName="text-[0.92rem] font-semibold"
              >
                <span style={{ fontFamily: "var(--font-display-face), serif" }}>3U</span>
              </TextCoinBadge>
              <div className="min-w-0">
                <div className="truncate text-[1.02rem] font-semibold text-[#f6dfac]">
                  AURA...
                </div>
                <div className="text-[11px] text-[#e4cf9f]">推广 | 收益盘</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="rounded-full px-3 py-2 text-[0.85rem] text-[#f3dfb4]"
                style={metalPill}
              >
                BSC Testnet
              </div>
              <div
                className="rounded-full px-3 py-2 text-[0.85rem] text-[#f3dfb4]"
                style={metalPill}
              >
                0x3C4*...93BC
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pb-28 pt-4">
          <FrameShell
            outerClassName="h-[214px]"
            innerClassName="rounded-[1.65rem] px-5 py-6"
            surfaceStyle={heroSurface}
          >
            <div className="text-center">
              <div className="text-[1.2rem] font-medium text-[#6e491d]">
                累计获得 AURA
              </div>
              <div className="mx-auto mt-3 flex w-full justify-center">
                <div className="relative">
                  <div
                    className="font-brand text-[3rem] font-semibold leading-none text-[#d4ae5d]"
                    style={{
                      textShadow:
                        "0 0 10px rgba(255,238,179,0.64), 0 2px 2px rgba(170,123,46,0.18)",
                    }}
                  >
                    0
                  </div>
                  <div
                    className="pointer-events-none absolute inset-x-0 top-[2px] text-[3rem] font-semibold leading-none text-[#fff3ca] opacity-42"
                    style={{ fontFamily: "var(--font-display-face), serif" }}
                  >
                    0
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[1.05rem] text-[#7b5a30]">≈ $0.00 USD</div>
              <div className="mt-2 flex items-center justify-center gap-2 text-[1rem] text-[#3d9866]">
                <IconMask iconSrc={iconPaths.trend} size={16} color="#3d9866" />
                <span>+0.0%</span>
                <span className="text-[#6a8b63]">本周</span>
              </div>
            </div>
          </FrameShell>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile
              title="当前周期"
              value="#3"
              subValue="进行中"
              iconSrc={iconPaths.sparkles}
            />
            <StatTile
              title="小区业绩"
              value="0 USDT"
              subValue="当前进度"
              iconSrc={iconPaths.team}
            />
          </div>

          <section className="mt-5">
            <div className="mb-2 text-[1rem] font-medium text-[#7b5528]">里程碑与提醒</div>
            <FrameShell
              outerClassName="h-[86px]"
              innerClassName="flex items-center justify-between rounded-[1.18rem] px-4"
              surfaceStyle={ivorySurface}
            >
              <div className="flex items-center gap-3">
                <CoinBadge iconSrc={iconPaths.bolt} size={38} />
                <div>
                  <div className="text-[1rem] font-semibold text-[#5d3c16]">
                    NFT 达标状态
                  </div>
                  <div className="text-sm text-[#8a693c]">未达标</div>
                </div>
              </div>
              <div className="text-sm font-medium text-[#bf8d42]">详情</div>
            </FrameShell>
          </section>

          <section className="mt-5">
            <div className="mb-3 text-[1rem] font-medium text-[#7b5528]">功能入口</div>
            <div className="grid grid-cols-2 gap-3">
              <FeatureTile
                title="每日签到"
                subtitle="每天获取 1000 AURA"
                iconSrc={iconPaths.calendar}
              />
              <FeatureTile
                title="我的团队"
                subtitle="查看网络结构"
                iconSrc={iconPaths.team}
              />
              <FeatureTile
                title="奖励明细"
                subtitle="查看收益数据"
                iconSrc={iconPaths.trophy}
              />
              <FeatureTile
                title="NFT 市场"
                subtitle="购买并获取 NFT"
                iconSrc={iconPaths.shield}
              />
            </div>
          </section>

          <div className="mt-6 rounded-full bg-[rgba(103,71,30,0.16)] px-4 py-2 text-center text-[11px] uppercase tracking-[0.24em] text-[#8a6632]">
            Sample Preview · Asset Driven Frame / Texture / Solid Glyph
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-0">
          <div className="px-4 pb-3 pt-2" style={navShell}>
            <div className="relative flex items-end justify-between px-4 pb-1 pt-3">
              <BottomNavItem label="首页" iconSrc={iconPaths.calendar} active />
              <BottomNavItem label="团队" iconSrc={iconPaths.team} />
              <BottomNavItem label="NFT" iconSrc={iconPaths.shield} />
              <BottomNavItem label="奖励" iconSrc={iconPaths.trophy} />

              <div className="absolute right-4 top-[-18px]">
                <TextCoinBadge size={60} textClassName="text-[2rem] leading-none">
                  <span style={{ fontFamily: "var(--font-display-face), serif" }}>+</span>
                </TextCoinBadge>
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
