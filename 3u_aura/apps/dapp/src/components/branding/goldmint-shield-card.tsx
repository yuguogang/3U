import { useId } from "react";
import { cn } from "@/lib/utils";
import { GoldmintEmblem } from "@/components/branding/goldmint-emblem";

type GoldmintShieldCardCopy = {
  frontRibbon?: string;
  frontSubtitle?: string;
  backBadge?: string;
  backSerialLabel?: string;
  backTierLabel?: string;
  backTierValue?: string;
  backRightsLabel?: string;
  detailBadge?: string;
  detailSubtitle?: string;
  detailLabelSurface?: string;
  detailValueSurface?: string;
  detailLabelCore?: string;
  detailValueCore?: string;
  detailLabelSupply?: string;
  detailValueSupply?: string;
  detailLabelClaim?: string;
  detailValueClaim?: string;
  footerFront?: string;
  footerBack?: string;
  footerDetail?: string;
};

type GoldmintShieldCardProps = {
  className?: string;
  badge?: string;
  footer?: string;
  mode?: "front" | "back" | "detail";
  serialLabel?: string;
  utilityItems?: string[];
  copy?: GoldmintShieldCardCopy;
};

function ShieldBackdrop({
  idPrefix,
  className,
  muted = false,
}: {
  idPrefix: string;
  className?: string;
  muted?: boolean;
}) {
  const frameId = `${idPrefix}-frame`;
  const coreId = `${idPrefix}-core`;
  const glowId = `${idPrefix}-glow`;

  return (
    <svg
      viewBox="0 0 260 300"
      className={cn("pointer-events-none", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={frameId} x1="26" y1="22" x2="215" y2="274">
          <stop offset="0" stopColor="#F6E1A9" />
          <stop offset="0.32" stopColor="#B27833" />
          <stop offset="0.58" stopColor="#FFF0CA" />
          <stop offset="0.84" stopColor="#8E5A27" />
          <stop offset="1" stopColor="#F6D58C" />
        </linearGradient>
        <linearGradient id={coreId} x1="130" y1="44" x2="130" y2="258">
          <stop offset="0" stopColor={muted ? "#234567" : "#3A6C99"} />
          <stop offset="0.58" stopColor={muted ? "#142B45" : "#163859"} />
          <stop offset="1" stopColor={muted ? "#0E1D30" : "#0D243B"} />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(130 118) rotate(90) scale(140 118)">
          <stop offset="0" stopColor="rgba(255,244,207,0.95)" />
          <stop offset="0.36" stopColor="rgba(255,233,173,0.32)" />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse
        cx="130"
        cy="126"
        rx="92"
        ry="118"
        fill={`url(#${glowId})`}
        opacity={muted ? 0.16 : 0.42}
      />
      <path
        d="M130 32C178 32 217 44 240 68V162C240 232 192 274 130 295C68 274 20 232 20 162V68C43 44 82 32 130 32Z"
        fill={`url(#${coreId})`}
        stroke={`url(#${frameId})`}
        strokeWidth={muted ? 8 : 11}
      />
      <path
        d="M130 60C166 60 195 69 213 82V157C213 211 176 245 130 264C84 245 47 211 47 157V82C65 69 94 60 130 60Z"
        fill={muted ? "rgba(9,22,34,0.58)" : "rgba(10,29,46,0.62)"}
        stroke="rgba(247,224,174,0.24)"
        strokeWidth="2"
      />
      <path
        d="M74 92H186"
        stroke="rgba(247,224,174,0.14)"
        strokeWidth="2"
      />
      <path
        d="M85 118H175"
        stroke="rgba(247,224,174,0.12)"
        strokeWidth="1.5"
      />
      <path
        d="M97 212H163"
        stroke="rgba(247,224,174,0.12)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SpecTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="goldmint-etched-plaque rounded-[1.15rem] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#87571e]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-[#36200f]">
        {value}
      </p>
    </div>
  );
}

export function GoldmintShieldCard({
  className,
  badge = "FOUNDER ACCESS",
  footer = "Goldmint Founder Card",
  mode = "front",
  serialLabel = "#001 / 030",
  utilityItems = [
    "Founder-grade access",
    "Weekly subsidy rights",
    "Tax-share eligibility",
  ],
  copy,
}: GoldmintShieldCardProps) {
  const id = useId();
  const outerFrameId = `${id}-outer-frame`;
  const innerFrameId = `${id}-inner-frame`;
  const bronzeId = `${id}-bronze`;
  const accentId = `${id}-accent`;
  const copyText = {
    frontRibbon: copy?.frontRibbon ?? "Founder vault plate",
    frontSubtitle:
      copy?.frontSubtitle ?? "Bullion shield with weekly founder rights engraving.",
    backBadge: copy?.backBadge ?? "Engraved back",
    backSerialLabel: copy?.backSerialLabel ?? "Serial",
    backTierLabel: copy?.backTierLabel ?? "Tier",
    backTierValue: copy?.backTierValue ?? "Founder",
    backRightsLabel: copy?.backRightsLabel ?? "Holder rights",
    detailBadge: copy?.detailBadge ?? "Material spec",
    detailSubtitle:
      copy?.detailSubtitle ?? "Stamped metal, enamel core, and rights summary.",
    detailLabelSurface: copy?.detailLabelSurface ?? "Surface",
    detailValueSurface: copy?.detailValueSurface ?? "Brushed gold",
    detailLabelCore: copy?.detailLabelCore ?? "Core",
    detailValueCore: copy?.detailValueCore ?? "Blue enamel",
    detailLabelSupply: copy?.detailLabelSupply ?? "Supply",
    detailValueSupply: copy?.detailValueSupply ?? "30 buy / 70 referral",
    detailLabelClaim: copy?.detailLabelClaim ?? "Claim",
    detailValueClaim: copy?.detailValueClaim ?? "Weekly subsidy",
    footerFront:
      copy?.footerFront ?? "Bullion shield, crest core, and founder seal.",
    footerBack:
      copy?.footerBack ?? "Serial engraving, tier plate, and rights ledger.",
    footerDetail:
      copy?.footerDetail ?? "Material stack, supply split, and weekly claim spec.",
  };

  const footerCopy =
    mode === "front"
      ? copyText.footerFront
      : mode === "back"
        ? copyText.footerBack
        : copyText.footerDetail;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[2.15rem] border border-[rgba(243,217,155,0.54)] bg-[#1a120d] shadow-[0_32px_60px_rgba(25,14,6,0.42)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 420 520"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={outerFrameId} x1="14" y1="10" x2="394" y2="510">
            <stop offset="0" stopColor="#5C3A1C" />
            <stop offset="0.18" stopColor="#C28B3D" />
            <stop offset="0.34" stopColor="#FAE3A9" />
            <stop offset="0.5" stopColor="#BA7E34" />
            <stop offset="0.72" stopColor="#6C431E" />
            <stop offset="1" stopColor="#120D09" />
          </linearGradient>
          <linearGradient id={innerFrameId} x1="54" y1="36" x2="362" y2="476">
            <stop offset="0" stopColor="rgba(255,239,197,0.58)" />
            <stop offset="0.52" stopColor="rgba(188,133,61,0.2)" />
            <stop offset="1" stopColor="rgba(255,239,197,0.18)" />
          </linearGradient>
          <linearGradient id={bronzeId} x1="210" y1="24" x2="210" y2="502">
            <stop offset="0" stopColor="#6E4822" />
            <stop offset="0.16" stopColor="#9A6B33" />
            <stop offset="0.3" stopColor="#291A10" />
            <stop offset="0.68" stopColor="#140C08" />
            <stop offset="1" stopColor="#060403" />
          </linearGradient>
          <linearGradient id={accentId} x1="275" y1="18" x2="396" y2="210">
            <stop offset="0" stopColor="rgba(255,249,231,0.8)" />
            <stop offset="0.24" stopColor="rgba(255,232,176,0.34)" />
            <stop offset="1" stopColor="rgba(255,232,176,0)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="420" height="520" rx="34" fill={`url(#${outerFrameId})`} />
        <rect
          x="10"
          y="10"
          width="400"
          height="500"
          rx="30"
          fill={`url(#${bronzeId})`}
          stroke={`url(#${innerFrameId})`}
          strokeWidth="1.5"
        />
        <rect
          x="26"
          y="26"
          width="368"
          height="468"
          rx="25"
          stroke="rgba(247,224,174,0.36)"
          strokeWidth="1.4"
        />
        <rect
          x="34"
          y="74"
          width="352"
          height="308"
          rx="28"
          fill="rgba(4,4,4,0.16)"
          stroke="rgba(247,224,174,0.16)"
          strokeWidth="1.2"
        />
        <path
          d="M278 0H420V164C384 176 350 186 318 194C290 160 276 118 278 0Z"
          fill={`url(#${accentId})`}
        />
        <rect
          x="70"
          y="38"
          width="280"
          height="18"
          rx="9"
          fill="rgba(255,230,171,0.16)"
        />
        {[48, 372].map((x) => (
          <path
            key={`rail-${x}`}
            d={`M${x} 98V350`}
            stroke="rgba(247,224,174,0.12)"
            strokeWidth="1.4"
          />
        ))}
        {[46, 374].flatMap((x) =>
          [46, 474].map((y) => (
            <g key={`bolt-${x}-${y}`}>
              <circle cx={x} cy={y} r="9" fill="rgba(39,22,12,0.52)" />
              <circle cx={x} cy={y} r="6.5" fill="rgba(252,233,188,0.55)" />
              <path d={`M${x - 3} ${y}H${x + 3}`} stroke="rgba(111,72,30,0.54)" strokeWidth="1.2" />
            </g>
          )),
        )}
      </svg>

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-full border border-[rgba(247,224,174,0.42)] bg-[rgba(8,5,3,0.28)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f7e7bf] shadow-[inset_0_1px_0_rgba(255,248,228,0.14)]">
            {badge}
          </div>
          <div className="rounded-full border border-[rgba(247,224,174,0.24)] bg-[rgba(255,234,184,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f1d68a]">
            $GM
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-7">
          <div className="goldmint-dark-inset relative w-full overflow-hidden rounded-[1.9rem] border border-[rgba(244,217,156,0.3)] px-4 py-5 shadow-[0_24px_34px_rgba(6,9,14,0.28),inset_0_1px_0_rgba(255,248,228,0.12)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(255,236,192,0.14),rgba(0,0,0,0)_34%),repeating-linear-gradient(90deg,rgba(255,241,208,0.05)_0_1px,rgba(0,0,0,0)_1px_4px)]" />
            <div className="pointer-events-none absolute inset-[10px] rounded-[1.45rem] border border-[rgba(244,217,156,0.16)]" />

            {mode === "front" ? (
              <div className="relative flex min-h-[252px] flex-col items-center justify-between">
                <div className="goldmint-etched-plaque inline-flex rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7d4d1d]">
                  {copyText.frontRibbon}
                </div>
                <div className="relative flex flex-1 items-center justify-center py-4">
                  <ShieldBackdrop
                    idPrefix={`${id}-front`}
                    className="absolute inset-0 m-auto h-full max-h-[220px] w-auto"
                  />
                  <div className="absolute top-5 h-20 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,240,205,0.28),rgba(0,0,0,0))] blur-2xl" />
                  <div className="absolute inset-0 m-auto flex h-36 w-36 items-center justify-center rounded-full border border-[rgba(247,224,174,0.3)] bg-[radial-gradient(circle,rgba(255,247,221,0.24),rgba(6,14,21,0.08))] shadow-[0_18px_32px_rgba(6,12,18,0.26),inset_0_1px_0_rgba(255,249,231,0.18)]">
                    <GoldmintEmblem className="h-24 w-24 drop-shadow-[0_14px_18px_rgba(12,8,4,0.52)]" />
                  </div>
                  <div className="goldmint-plaque absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-full px-5 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#fff3cf]">
                      $GM
                    </span>
                  </div>
                </div>
                <div className="mx-auto max-w-[18rem] text-center">
                  <p className="font-brand text-[1.18rem] font-semibold text-[#fff0c9]">
                    {footer}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#d6bf8a]">
                    {copyText.frontSubtitle}
                  </p>
                </div>
              </div>
            ) : null}

            {mode === "back" ? (
              <div className="relative min-h-[252px]">
                <ShieldBackdrop
                  idPrefix={`${id}-back`}
                  muted
                  className="absolute inset-0 m-auto h-full max-h-[220px] w-auto opacity-80"
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div className="goldmint-etched-plaque rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7d4d1d]">
                      {copyText.backBadge}
                    </div>
                    <div className="rounded-full border border-[rgba(247,224,174,0.18)] bg-[rgba(8,18,29,0.48)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f0d79b]">
                      {serialLabel}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <SpecTile label={copyText.backSerialLabel} value={serialLabel} />
                    <SpecTile label={copyText.backTierLabel} value={copyText.backTierValue} />
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-[rgba(247,224,174,0.18)] bg-[rgba(8,18,29,0.5)] p-3 shadow-[inset_0_1px_0_rgba(255,248,228,0.08)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d9bf82]">
                      {copyText.backRightsLabel}
                    </p>
                    <div className="mt-3 space-y-2">
                      {utilityItems.map((item, index) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-[1rem] border border-[rgba(247,224,174,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-2"
                        >
                          <div className="goldmint-coin flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#6b4519]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <p className="pt-1 text-xs leading-relaxed text-[#f7e9c3]">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "detail" ? (
              <div className="relative min-h-[252px]">
                <ShieldBackdrop
                  idPrefix={`${id}-detail`}
                  muted
                  className="absolute right-[-10px] top-[34px] h-[86%] w-auto opacity-70"
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="goldmint-coin flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem]">
                        <GoldmintEmblem compact className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-brand truncate text-[1.12rem] font-semibold text-[#fff0ca]">
                          {footer}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#d8bf88]">
                          {copyText.detailSubtitle}
                        </p>
                      </div>
                    </div>
                    <div className="goldmint-etched-plaque shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7d4d1d]">
                      {copyText.detailBadge}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <SpecTile
                      label={copyText.detailLabelSurface}
                      value={copyText.detailValueSurface}
                    />
                    <SpecTile label={copyText.detailLabelCore} value={copyText.detailValueCore} />
                    <SpecTile label={copyText.detailLabelSupply} value={copyText.detailValueSupply} />
                    <SpecTile
                      label={copyText.detailLabelClaim}
                      value={copyText.detailValueClaim}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="goldmint-dark-inset rounded-[1.45rem] border border-[rgba(247,224,174,0.18)] px-4 py-3">
          <p className="font-brand text-lg tracking-[0.08em] text-[#fff2ca]">
            {footer}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#cab37a]">
            {footerCopy}
          </p>
        </div>
      </div>
    </div>
  );
}
