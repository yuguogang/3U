"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const glassCardVariants = cva(
  "relative overflow-hidden backdrop-blur-xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:bg-[var(--glass-overlay)] before:opacity-80 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-inset after:ring-[var(--glass-inner-ring)]",
  {
    variants: {
      variant: {
        default: "border border-[var(--glass-border)] bg-[var(--glass-bg)]",
        elevated:
          "border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] shadow-[var(--elevated-shadow)]",
        interactive:
          "cursor-pointer border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-highlight-border)] hover:bg-[var(--glass-bg-strong)]",
        highlight:
          "border border-[var(--glass-highlight-border)] bg-[var(--glass-highlight-bg)]",
        glow: "border border-[var(--glass-border)] bg-[var(--glass-bg)] transition-shadow duration-300 hover:shadow-glow",
      },
      intensity: {
        low: "backdrop-blur-sm",
        medium: "backdrop-blur-md",
        high: "backdrop-blur-xl",
      },
      radius: {
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      intensity: "high",
      radius: "lg",
    },
  },
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glowOnHover?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant,
      intensity,
      radius,
      children,
      hoverEffect = false,
      glowOnHover = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, intensity, radius }),
          hoverEffect &&
            "hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
          glowOnHover && "hover:shadow-glow-sm",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
