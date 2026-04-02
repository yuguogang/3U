import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metal Icon Preview | Goldmint",
  description: "Preview page for the metallic Aura dashboard icon set.",
};

const previewStyles = String.raw`
  .gm-icon-preview-page {
    min-height: 100vh;
    background: linear-gradient(145deg, #0b0f1a 0%, #0a0e17 100%);
    font-family: "Segoe UI", "Poppins", "Inter", system-ui, -apple-system, sans-serif;
    display: flex;
    justify-content: center;
    padding: 3rem 1.25rem 4rem;
    color: #e8eff7;
  }

  .gm-icon-preview-container {
    width: 100%;
    max-width: 1400px;
  }

  .gm-icon-preview-heading {
    text-align: center;
    font-size: clamp(2rem, 4vw, 2.2rem);
    font-weight: 600;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #e8eff7 0%, #b8c5d6 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
  }

  .gm-icon-preview-sub-wrap {
    text-align: center;
  }

  .gm-icon-preview-sub {
    display: inline-block;
    color: #7e8a9b;
    margin-bottom: 3rem;
    font-weight: 400;
    font-size: 1rem;
    border-bottom: 1px dashed rgba(120, 140, 180, 0.3);
    padding-bottom: 0.6rem;
  }

  .gm-icon-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 2rem 1.5rem;
    justify-items: center;
    align-items: start;
  }

  .gm-icon-preview-card {
    width: 100%;
    max-width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1rem 1rem;
    border-radius: 32px;
    background: rgba(18, 24, 36, 0.65);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(210, 220, 240, 0.15);
    box-shadow: 0 12px 20px -12px rgba(0, 0, 0, 0.4);
    transition:
      transform 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      background 0.25s ease;
  }

  .gm-icon-preview-card:hover {
    transform: translateY(-6px);
    border-color: rgba(200, 210, 240, 0.4);
    box-shadow: 0 20px 28px -14px rgba(0, 0, 0, 0.6);
    background: rgba(24, 32, 48, 0.7);
  }

  .gm-icon-preview-svg {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  }

  .gm-icon-preview-title {
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
    background: linear-gradient(120deg, #d9e2ef, #a6b3c9);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: 0.3px;
    margin-top: 0.25rem;
  }

  .gm-icon-preview-desc {
    font-size: 0.7rem;
    color: #6f7c93;
    margin-top: 0.3rem;
    text-align: center;
  }

  .gm-icon-preview-divider {
    margin: 3rem 0 1rem;
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3e4a62, transparent);
  }

  .gm-icon-preview-note {
    text-align: center;
    font-size: 0.75rem;
    color: #5e6c86;
    margin-top: 2rem;
  }

  @media (max-width: 640px) {
    .gm-icon-preview-page {
      padding-inline: 1rem;
      padding-top: 2rem;
    }

    .gm-icon-preview-grid {
      gap: 1.25rem 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .gm-icon-preview-card {
      max-width: none;
      border-radius: 28px;
    }
  }
`;

const iconEntries = [
  {
    title: "仪表盘",
    description: "主控台 · 金属面板",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="metalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EFF3FA"/>
          <stop offset="35%" stop-color="#CFDAEA"/>
          <stop offset="70%" stop-color="#A6B5CB"/>
          <stop offset="100%" stop-color="#8F9EB5"/>
        </linearGradient>
        <linearGradient id="darkMetal" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stop-color="#C0CCE0"/>
          <stop offset="50%" stop-color="#96A4BE"/>
          <stop offset="100%" stop-color="#6C7A95"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#metalGrad1)" stroke="url(#darkMetal)" stroke-width="2.5" stroke-opacity="0.9"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke="#3E4A62" stroke-width="1.8" stroke-dasharray="4 3"/>
      <path d="M50 32 L50 50 L70 50" stroke="#FFB347" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.9"/>
      <path d="M50 50 L66 36" stroke="#DDAA66" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="50" r="4.5" fill="url(#darkMetal)" stroke="#F5E7D3" stroke-width="1.2"/>
      <circle cx="28" cy="35" r="2.5" fill="#B1C0D4" stroke="#5A6982" stroke-width="0.8"/>
      <circle cx="72" cy="35" r="2.5" fill="#B1C0D4" stroke="#5A6982" stroke-width="0.8"/>
      <circle cx="50" cy="74" r="2.5" fill="#B1C0D4" stroke="#5A6982" stroke-width="0.8"/>
      <circle cx="50" cy="50" r="2" fill="#FCFCFD" opacity="0.8"/>
    </svg>`,
  },
  {
    title: "我的团队",
    description: "网络结构 · 协作节点",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="metalGroup" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stop-color="#E2E9F5"/>
          <stop offset="45%" stop-color="#C4D0E4"/>
          <stop offset="100%" stop-color="#99A8C0"/>
        </linearGradient>
      </defs>
      <circle cx="33" cy="45" r="12" fill="url(#metalGroup)" stroke="#5D6E8C" stroke-width="1.8"/>
      <circle cx="67" cy="45" r="12" fill="url(#metalGroup)" stroke="#5D6E8C" stroke-width="1.8"/>
      <circle cx="50" cy="70" r="12" fill="url(#metalGroup)" stroke="#5D6E8C" stroke-width="1.8"/>
      <path d="M33 57 L29 70 L37 70 Z" fill="#A5B5CF" stroke="#4A5873" stroke-width="1.2"/>
      <path d="M67 57 L63 70 L71 70 Z" fill="#A5B5CF" stroke="#4A5873" stroke-width="1.2"/>
      <path d="M50 82 L46 94 L54 94 Z" fill="#A5B5CF" stroke="#4A5873" stroke-width="1.2"/>
      <path d="M28 43 L38 43" stroke="#FADB67" stroke-width="2" stroke-linecap="round"/>
      <path d="M62 43 L72 43" stroke="#FADB67" stroke-width="2" stroke-linecap="round"/>
      <path d="M46 68 L54 68" stroke="#FADB67" stroke-width="2" stroke-linecap="round"/>
      <path d="M39 48 L52 60 L61 48" stroke="#B4C2DA" stroke-width="1.8" stroke-dasharray="3 2" fill="none"/>
      <circle cx="39" cy="48" r="2" fill="#DDE4F0" stroke="#7C8AA8"/>
      <circle cx="61" cy="48" r="2" fill="#DDE4F0" stroke="#7C8AA8"/>
    </svg>`,
  },
  {
    title: "NFT市场",
    description: "购买并领取NFT",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nftGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F9E7B3"/>
          <stop offset="40%" stop-color="#E6CD8C"/>
          <stop offset="100%" stop-color="#C5A45A"/>
        </linearGradient>
        <linearGradient id="steelBorder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#CDD9F0"/>
          <stop offset="100%" stop-color="#8F9DB9"/>
        </linearGradient>
      </defs>
      <rect x="20" y="22" width="60" height="56" rx="8" fill="url(#nftGold)" stroke="url(#steelBorder)" stroke-width="2.5"/>
      <rect x="25" y="27" width="50" height="46" rx="4" fill="#1E232F" stroke="#F2DC9C" stroke-width="1.2"/>
      <text x="38" y="58" font-family="monospace" font-weight="bold" font-size="24" fill="#FCE5A8" stroke="#B2832E" stroke-width="0.6">NFT</text>
      <path d="M60 52 L72 64 L60 76 L48 64 Z" fill="#D4AF6B" stroke="#7A5B2E" stroke-width="1.5" opacity="0.9"/>
      <circle cx="60" cy="64" r="2.5" fill="#FFEBC4"/>
      <circle cx="28" cy="30" r="2" fill="#C9D6EC" stroke="#5F6F8C"/>
      <circle cx="72" cy="30" r="2" fill="#C9D6EC" stroke="#5F6F8C"/>
      <circle cx="28" cy="70" r="2" fill="#C9D6EC" stroke="#5F6F8C"/>
      <circle cx="72" cy="70" r="2" fill="#C9D6EC" stroke="#5F6F8C"/>
    </svg>`,
  },
  {
    title: "奖励明细",
    description: "查看收益数据",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trophyMetal" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stop-color="#FFE5B4"/>
          <stop offset="60%" stop-color="#E6BC78"/>
          <stop offset="100%" stop-color="#C48A3A"/>
        </linearGradient>
        <radialGradient id="gemGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFD966"/>
          <stop offset="100%" stop-color="#C68B2E"/>
        </radialGradient>
      </defs>
      <path d="M34 28 L66 28 L70 48 L62 72 L38 72 L30 48 Z" fill="url(#trophyMetal)" stroke="#947031" stroke-width="1.8"/>
      <rect x="44" y="72" width="12" height="16" fill="#B6823A" stroke="#7A592A" stroke-width="1.5"/>
      <ellipse cx="50" cy="82" rx="10" ry="4" fill="#C6934E"/>
      <path d="M44 36 L56 36 L58 46 L50 60 L42 46 Z" fill="#FFDCA8" stroke="#BD8B40" stroke-width="1.2"/>
      <circle cx="50" cy="48" r="6" fill="url(#gemGlow)" stroke="#DBA643"/>
      <path d="M38 44 L30 48 L38 52" stroke="#F8E2B0" stroke-width="1.5" fill="none"/>
      <path d="M62 44 L70 48 L62 52" stroke="#F8E2B0" stroke-width="1.5" fill="none"/>
    </svg>`,
  },
  {
    title: "每日签到",
    description: "每天获取1000 AURA",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="checkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E0E8F4"/>
          <stop offset="45%" stop-color="#BCC8E0"/>
          <stop offset="100%" stop-color="#95A2BE"/>
        </linearGradient>
      </defs>
      <rect x="22" y="20" width="56" height="60" rx="8" fill="url(#checkMetal)" stroke="#4C5B7A" stroke-width="2"/>
      <rect x="28" y="28" width="44" height="12" fill="#2F384E" rx="2"/>
      <text x="42" y="38" font-family="Arial" font-size="10" fill="#C2D2EC" font-weight="bold">AURA</text>
      <circle cx="70" cy="26" r="3" fill="#FFB347" stroke="#A55D1A"/>
      <path d="M38 56 L46 66 L62 44" stroke="#76D96C" stroke-width="4" stroke-linecap="round" fill="none" stroke-opacity="0.9"/>
      <path d="M38 56 L46 66 L62 44" stroke="#B9FFA0" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="48" cy="80" r="6" fill="#4D5D7E" stroke="#B8C6E0" stroke-width="1.5"/>
      <text x="44" y="84" font-size="9" fill="#E4EDFF" font-weight="bold">1000</text>
      <path d="M28 48 L72 48" stroke="#6F7F9C" stroke-width="1.2" stroke-dasharray="2 3"/>
    </svg>`,
  },
  {
    title: "里程碑与提醒",
    description: "进度追踪 · 目标达成",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flagMetal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#E7CFA0"/>
          <stop offset="100%" stop-color="#C3A15F"/>
        </linearGradient>
      </defs>
      <rect x="42" y="20" width="5" height="58" fill="#6F7F9F" stroke="#3E4A5F" stroke-width="1.2" rx="1"/>
      <path d="M42 30 L70 38 L42 46 Z" fill="url(#flagMetal)" stroke="#AA8747" stroke-width="1.5"/>
      <circle cx="44.5" cy="76" r="3.5" fill="#6D7D9C" stroke="#C2CFE8"/>
      <path d="M56 34 L64 38 L56 42" fill="#E0B472" stroke="#C1892F"/>
      <text x="26" y="70" font-size="12" fill="#FDE5B4" font-weight="bold">MILESTONE</text>
      <path d="M22 58 L36 52" stroke="#FFC857" stroke-width="2"/>
    </svg>`,
  },
  {
    title: "NFT达标状态",
    description: "未达标 / 已达成",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="badgeMetal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#F7EDCC"/>
          <stop offset="70%" stop-color="#CFB57C"/>
          <stop offset="100%" stop-color="#A8854A"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="32" fill="url(#badgeMetal)" stroke="#D8C28C" stroke-width="3"/>
      <circle cx="50" cy="50" r="25" fill="none" stroke="#F7E7C1" stroke-width="1.8" stroke-dasharray="3 2"/>
      <text x="34" y="55" font-size="18" fill="#2C2E3E" font-weight="bold" stroke="#DAC081" stroke-width="0.5">✓</text>
      <text x="46" y="62" font-size="11" fill="#FCF2DD" font-weight="bold">达标</text>
      <path d="M62 36 L70 44 L62 52" stroke="#FFE0A3" stroke-width="2" fill="none"/>
      <circle cx="70" cy="44" r="3" fill="#FFD966"/>
    </svg>`,
  },
  {
    title: "小区业绩",
    description: "#3 排名 · 金属铭牌",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rankPlate" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#BCC8E3"/>
          <stop offset="50%" stop-color="#E9F0FC"/>
          <stop offset="100%" stop-color="#A6B5D0"/>
        </linearGradient>
      </defs>
      <rect x="20" y="28" width="60" height="38" rx="6" fill="url(#rankPlate)" stroke="#5F6E8C" stroke-width="2"/>
      <text x="34" y="52" font-size="18" fill="#2F3B56" font-weight="bold">#3</text>
      <text x="54" y="54" font-size="10" fill="#52607A">小区业绩</text>
      <path d="M70 40 L78 45 L70 50" stroke="#DEB887" stroke-width="1.8" fill="none"/>
      <circle cx="72" cy="46" r="2" fill="#FADB85"/>
    </svg>`,
  },
  {
    title: "当前周期",
    description: "进度 0% · 进行中",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="28" fill="#212A3B" stroke="#99ABCA" stroke-width="2.2"/>
      <path d="M50 22 L50 50 L72 50" stroke="#FFBB66" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M74 38 L84 44 L74 50" stroke="#FFD58C" fill="none" stroke-width="1.8"/>
      <text x="41" y="65" fill="#CDDEF7" font-size="12" font-weight="bold">0%</text>
      <circle cx="50" cy="50" r="20" fill="none" stroke="#F0CD96" stroke-width="1.5" stroke-dasharray="3 4"/>
      <text x="28" y="30" fill="#F5E2B2" font-size="8">当前周期</text>
    </svg>`,
  },
  {
    title: "累计获得AURA",
    description: "$0.00 USD · 本周趋势",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coinMetal" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stop-color="#FCEABB"/>
          <stop offset="100%" stop-color="#CEA65C"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="45" r="28" fill="url(#coinMetal)" stroke="#AA8746" stroke-width="2.5"/>
      <text x="39" y="53" fill="#30271A" font-size="14" font-weight="bold">AURA</text>
      <path d="M62 35 L74 31 L70 43" stroke="#FFE1A0" fill="none" stroke-width="2"/>
      <text x="26" y="78" fill="#E9E1CB" font-size="8">+0.0%本周</text>
      <path d="M32 72 L44 68" stroke="#76D96C" stroke-width="1.5"/>
      <circle cx="70" cy="64" r="4" fill="#DAAE6E" stroke="#C1812E"/>
    </svg>`,
  },
  {
    title: "功能入口",
    description: "快速导航 · 金属控件",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="30" width="56" height="38" rx="12" fill="#1C2335" stroke="#AAB8D4" stroke-width="1.8"/>
      <circle cx="40" cy="49" r="8" fill="#37415C" stroke="#BCC6E0" stroke-width="1.5"/>
      <circle cx="60" cy="49" r="8" fill="#37415C" stroke="#BCC6E0" stroke-width="1.5"/>
      <path d="M36 49 L44 49 M56 49 L64 49" stroke="#EDE2C6" stroke-width="1.8"/>
      <path d="M40 54 L40 44 M60 54 L60 44" stroke="#EDE2C6" stroke-width="1.2"/>
    </svg>`,
  },
  {
    title: "详情 & 未达标",
    description: "NFT达标状态 · 详情",
    svg: String.raw`<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27 24 L73 24 L73 76 L27 76 Z" fill="#253040" stroke="#98A9C6" stroke-width="2" rx="6"/>
      <path d="M37 38 L63 38" stroke="#C1D0EA" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M37 50 L58 50" stroke="#C1D0EA" stroke-width="2" stroke-linecap="round"/>
      <path d="M37 62 L52 62" stroke="#C1D0EA" stroke-width="2" stroke-linecap="round"/>
      <rect x="66" y="62" width="10" height="10" fill="#505F7C" stroke="#CFDDEF" rx="1.5"/>
      <text x="68" y="70" fill="#FFDFA5" font-size="8">!</text>
      <text x="30" y="80" fill="#ADBBD9" font-size="7">未达标</text>
    </svg>`,
  },
] as const;

function IconCard({
  title,
  description,
  svg,
}: {
  title: string;
  description: string;
  svg: string;
}) {
  return (
    <article className="gm-icon-preview-card">
      <div
        className="gm-icon-preview-svg"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <h2 className="gm-icon-preview-title">{title}</h2>
      <p className="gm-icon-preview-desc">{description}</p>
    </article>
  );
}

export default function IconPreviewPage() {
  return (
    <>
      <style>{previewStyles}</style>
      <main className="gm-icon-preview-page">
        <div className="gm-icon-preview-container">
          <h1 className="gm-icon-preview-heading">金属质感图标集</h1>
          <div className="gm-icon-preview-sub-wrap">
            <div className="gm-icon-preview-sub">AURA 推广仪表盘 · 精密锻造金属风格</div>
          </div>

          <section className="gm-icon-preview-grid" aria-label="金属图标集预览">
            {iconEntries.map((icon) => (
              <IconCard
                key={icon.title}
                title={icon.title}
                description={icon.description}
                svg={icon.svg}
              />
            ))}
          </section>

          <hr className="gm-icon-preview-divider" />
          <p className="gm-icon-preview-note">
            全套金属质感图标 | 高光斜面 + 拉丝金属渐变 | 适配 AURA 推广仪表盘
          </p>
        </div>
      </main>
    </>
  );
}
