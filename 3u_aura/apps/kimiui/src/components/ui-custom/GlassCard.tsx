import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const glassCardVariants = cva(
  'relative overflow-hidden backdrop-blur-xl transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white/[0.03] border border-white/[0.08]',
        elevated: 'bg-white/[0.05] border border-white/[0.12] shadow-card',
        interactive: 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] cursor-pointer',
        highlight: 'bg-gradient-to-br from-aura-primary/10 to-transparent border border-aura-primary/20',
        glow: 'bg-white/[0.03] border border-white/[0.08] hover:shadow-glow transition-shadow duration-300',
      },
      intensity: {
        low: 'backdrop-blur-sm',
        medium: 'backdrop-blur-md',
        high: 'backdrop-blur-xl',
      },
      radius: {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      intensity: 'high',
      radius: 'lg',
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glowOnHover?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, intensity, radius, children, hoverEffect = false, glowOnHover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, intensity, radius }),
          hoverEffect && 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
          glowOnHover && 'hover:shadow-glow-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard, glassCardVariants };
