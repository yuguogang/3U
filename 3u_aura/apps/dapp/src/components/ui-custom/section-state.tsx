"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

type SectionStateCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  tone?: "default" | "error";
  className?: string;
};

export function SectionEmptyState({
  title,
  description,
  icon = <Inbox className="h-5 w-5" />,
  className,
}: SectionStateCardProps) {
  return (
    <GlassCard className={cn("p-5 text-center", className)}>
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 text-white/55">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-white/45">{description}</p>
    </GlassCard>
  );
}

export function SectionErrorState({
  title,
  description,
  icon = <AlertCircle className="h-5 w-5" />,
  className,
}: SectionStateCardProps) {
  return (
    <GlassCard
      className={cn(
        "border border-aura-error/20 bg-aura-error/5 p-5 text-left",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aura-error/10 text-aura-error">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-aura-error">{title}</h3>
          <p className="mt-2 text-xs leading-5 text-aura-error/75">
            {description}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

export function SectionCardSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <GlassCard
          key={index}
          aria-hidden={true}
          className="animate-pulse p-4 motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/7" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-28 rounded-full bg-white/7" />
              <div className="h-2 w-20 rounded-full bg-white/7" />
            </div>
            <div className="space-y-2">
              <div className="ml-auto h-3 w-12 rounded-full bg-white/7" />
              <div className="ml-auto h-2 w-8 rounded-full bg-white/7" />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
