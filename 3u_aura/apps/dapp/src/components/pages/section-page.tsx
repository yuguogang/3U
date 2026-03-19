import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function SectionPage({
  eyebrow,
  title,
  description,
  bullets,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: SectionPageProps) {
  return (
    <MobileLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        <>
          <Button
            asChild
            className="bg-gradient-to-r from-aura-primary to-aura-primary-dark text-white shadow-glow-sm hover:opacity-90"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild className="bg-white/10 text-white shadow-none hover:bg-white/15">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.24em] text-orange-300/75">
              Placeholder Route
            </span>
            <span className="text-xs text-white/45">Phase9 implementation pending</span>
          </div>
          <ul className="space-y-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-white/72">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-orange-300" strokeWidth={1.9} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </MobileLayout>
  );
}
