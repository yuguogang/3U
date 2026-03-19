"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ClaimsLoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-white/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 rounded bg-white/5" />
              <div className="h-2 w-16 rounded bg-white/5" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-3 w-20 rounded bg-white/5 ml-auto" />
              <div className="h-6 w-16 rounded bg-white/5 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClaimsSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-white/5 p-4 space-y-2"
        >
          <div className="h-3 w-20 rounded bg-white/5" />
          <div className="h-6 w-12 rounded bg-white/5" />
          <div className="h-2 w-16 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
