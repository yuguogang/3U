import { useId } from "react";
import { cn } from "@/lib/utils";

type GoldmintEmblemProps = {
  className?: string;
  compact?: boolean;
};

export function GoldmintEmblem({
  className,
  compact = false,
}: GoldmintEmblemProps) {
  const id = useId();
  const rimGradientId = `${id}-rim`;
  const faceGradientId = `${id}-face`;
  const coreGlowId = `${id}-glow`;

  return (
    <svg
      viewBox="0 0 160 160"
      className={cn("overflow-visible", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Goldmint GM emblem"
    >
      <defs>
        <linearGradient id={rimGradientId} x1="16" y1="16" x2="144" y2="144">
          <stop offset="0" stopColor="#6D4215" />
          <stop offset="0.18" stopColor="#F7DA8B" />
          <stop offset="0.52" stopColor="#B97A28" />
          <stop offset="0.82" stopColor="#F5D88E" />
          <stop offset="1" stopColor="#6B4318" />
        </linearGradient>
        <radialGradient id={faceGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 80) rotate(90) scale(68)">
          <stop offset="0" stopColor="#FFF4C9" />
          <stop offset="0.14" stopColor="#E7C36B" />
          <stop offset="0.52" stopColor="#B47A2A" />
          <stop offset="0.82" stopColor="#E3BD68" />
          <stop offset="1" stopColor="#7B4D1E" />
        </radialGradient>
        <radialGradient id={coreGlowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(62 52) rotate(50) scale(82 52)">
          <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="0.18" stopColor="rgba(255,255,255,0.42)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="80" r="74" fill="#4A2D12" />
      <circle cx="80" cy="80" r="72" fill={`url(#${rimGradientId})`} />
      <circle cx="80" cy="80" r="60" fill={`url(#${faceGradientId})`} />
      <circle cx="80" cy="80" r="60" fill={`url(#${coreGlowId})`} opacity="0.8" />
      <circle
        cx="80"
        cy="80"
        r="61.5"
        stroke="rgba(255, 244, 210, 0.68)"
        strokeWidth="1.5"
      />
      <circle
        cx="80"
        cy="80"
        r="50"
        stroke="rgba(90, 51, 16, 0.42)"
        strokeWidth="2"
      />
      <path
        d="M39 78.5C56 60.5 104 57 120.5 74.5"
        stroke="rgba(255,255,255,0.24)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M41 90C57.5 102.5 102.5 104.5 118.5 90"
        stroke="rgba(90,51,16,0.18)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="80"
        y={compact ? "92" : "98"}
        fill="#FFF8DE"
        fontSize={compact ? "54" : "58"}
        fontWeight="700"
        letterSpacing="-4"
        textAnchor="middle"
        style={{ fontFamily: "var(--font-display-face), serif" }}
      >
        GM
      </text>
      {!compact ? (
        <>
          <text
            x="80"
            y="35"
            fill="rgba(255,248,222,0.9)"
            fontSize="12"
            fontWeight="600"
            letterSpacing="4"
            textAnchor="middle"
            style={{ fontFamily: "var(--font-body), sans-serif" }}
          >
            GOLDMINT
          </text>
          <text
            x="80"
            y="129"
            fill="rgba(255,248,222,0.84)"
            fontSize="9"
            fontWeight="700"
            letterSpacing="3.2"
            textAnchor="middle"
            style={{ fontFamily: "var(--font-body), sans-serif" }}
          >
            WEALTH ACCESS
          </text>
        </>
      ) : null}
    </svg>
  );
}
