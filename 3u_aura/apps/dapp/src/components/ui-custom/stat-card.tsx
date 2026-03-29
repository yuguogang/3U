"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  subValue?: string;
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  change,
  icon,
  trend,
  highlight = false,
  subValue,
  className,
  onClick,
}) => {
  const getTrendIcon = () => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-aura-success" />;
    if (trend === "down")
      return <TrendingDown className="w-4 h-4 text-aura-error" />;
    return <Minus className="w-4 h-4 text-[var(--shell-text-soft)]" />;
  };

  const getChangeColor = () => {
    if (!change) return "";
    if (change.type === "increase") return "text-aura-success";
    if (change.type === "decrease") return "text-aura-error";
    return "text-[var(--shell-text-soft)]";
  };

  return (
    <GlassCard
      variant={highlight ? "highlight" : "default"}
      className={cn("p-4", onClick && "cursor-pointer", className)}
      onClick={onClick}
      hoverEffect={!!onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-xs text-[var(--shell-text-soft)]">{label}</p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-2xl font-bold font-mono",
                highlight
                  ? "goldmint-heading"
                  : "text-[var(--shell-title)]",
              )}
            >
              {value}
            </span>
            {unit && <span className="text-sm text-[var(--shell-text-soft)]">{unit}</span>}
          </div>
          {subValue && (
            <p className="mt-1 text-xs text-[var(--shell-text-soft)]">{subValue}</p>
          )}
          {change && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-xs",
                getChangeColor(),
              )}
            >
              {getTrendIcon()}
              <span>
                {change.value > 0 ? "+" : ""}
                {change.value}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="goldmint-pill flex h-10 w-10 items-center justify-center rounded-xl text-aura-primary">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default StatCard;
