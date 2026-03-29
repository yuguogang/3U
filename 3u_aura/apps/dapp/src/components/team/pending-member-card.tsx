"use client";

import { useLocale, useTranslations } from "next-intl";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactWallet } from "./team-tree-utils";

interface PendingMemberCardProps {
  userId: string;
  walletAddress: string;
  registeredAt: Date;
  selected?: boolean;
  dragging?: boolean;
  onClick?: () => void;
  onDragStart?: (userId: string) => void;
  onDragEnd?: () => void;
}

function PendingIdenticon({ seed }: { seed: string }) {
  const hash = seed.split("").reduce((acc, char) => {
    const next = acc * 31 + char.charCodeAt(0);
    return next & 0x7fffffff;
  }, 7);

  const cells: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const bitIndex = row * 3 + col;
      const filled = ((hash >> bitIndex) & 1) === 1;
      if (filled) {
        cells.push({ x: col, y: row });
        if (col !== 2) {
          cells.push({ x: 4 - col, y: row });
        }
      }
    }
  }

  const hue = hash % 360;
  const light = `hsl(${hue} 84% 58%)`;
  const dark = `hsl(${(hue + 28) % 360} 72% 34%)`;

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${light}, ${dark})`,
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full opacity-90">
        {cells.map((cell, index) => (
          <rect
            key={`${cell.x}-${cell.y}-${index}`}
            x={18 + cell.x * 14}
            y={14 + cell.y * 14}
            width="12"
            height="12"
            rx="3"
            fill="rgba(255,255,255,0.96)"
          />
        ))}
      </svg>
    </div>
  );
}

export function PendingMemberCard({
  userId,
  walletAddress,
  registeredAt,
  selected = false,
  dragging = false,
  onClick,
  onDragStart,
  onDragEnd,
}: PendingMemberCardProps) {
  const locale = useLocale();
  const t = useTranslations("Common");
  return (
    <button
      type="button"
      onClick={onClick}
      draggable
      aria-grabbed={dragging}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/pending-user-id", userId);
        onDragStart?.(userId);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "w-full rounded-xl border transition-all duration-200 active:scale-[0.98]",
        selected
          ? "border-aura-primary/40 bg-aura-primary/8 ring-1 ring-aura-primary/30"
          : "border-[var(--shell-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)]",
        dragging && "opacity-70 shadow-[0_0_0_1px_rgba(255,86,54,0.18),0_0_18px_rgba(255,86,54,0.2)]",
      )}
    >
      <div className="flex items-center gap-2.5 p-2.5">
        <div className="flex items-center justify-center text-[var(--shell-text-soft)]">
          <GripVertical className="h-4 w-4" />
        </div>
        <PendingIdenticon seed={walletAddress} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-[var(--shell-title)]">
            {formatCompactWallet(walletAddress)}
          </p>
          <p className="text-[10px] text-[var(--shell-text-soft)]">
            {new Date(registeredAt).toLocaleDateString(locale)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-aura-primary/70">
            {t("team.pending.dragOrTap")}
          </p>
        </div>
        {selected && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-aura-primary">
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
              <polyline
                points="1,6 4,9 11,2"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
