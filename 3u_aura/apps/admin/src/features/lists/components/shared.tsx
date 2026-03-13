"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";

export function PageIntro({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-orange-200/70">
            {eyebrow || "Promotion Operator"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-white/10 bg-[rgba(6,18,30,0.8)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelTitle({
  title,
  description,
  linkHref,
}: {
  description?: string;
  linkHref?: string;
  title: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {linkHref ? (
        <Link
          href={linkHref}
          className="inline-flex items-center gap-2 text-sm text-orange-300 transition hover:text-orange-200"
        >
          Open page
          <ExternalLink className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "accent" | "warning";
  value: string;
}) {
  const toneClass =
    tone === "accent"
      ? "border-orange-400/30 bg-orange-500/10"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-400/10"
        : "border-white/10 bg-white/[0.04]";

  return (
    <div className={`rounded-[22px] border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "danger" | "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300"
        : tone === "danger"
          ? "bg-rose-500/15 text-rose-300"
          : "bg-slate-400/10 text-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Panel className="border-dashed border-white/14">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-300">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <Panel>
      <p className="text-sm text-slate-300">{label}...</p>
    </Panel>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <Panel className="border-rose-400/20 bg-rose-950/20">
      <p className="text-sm text-rose-200">{error.message}</p>
    </Panel>
  );
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/50 ${props.className || ""}`}
    />
  );
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400/50 ${props.className || ""}`}
    />
  );
}

export function ActionButton({
  children,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "danger" | "default" | "ghost";
}) {
  const toneClass =
    tone === "ghost"
      ? "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
      : tone === "danger"
        ? "border-rose-500/30 bg-rose-500/20 text-rose-100 hover:bg-rose-500/25"
        : "border-orange-400/30 bg-orange-500/20 text-orange-100 hover:bg-orange-500/25";

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${props.className || ""}`}
      type={props.type || "button"}
    >
      {children}
    </button>
  );
}

export function DataTable({
  children,
  columns,
}: {
  children: ReactNode;
  columns: string[];
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/8">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/8 text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-medium" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6 text-slate-200">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function JsonPreview({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Panel className="bg-slate-950/85">
      <PanelTitle title={title} />
      <pre className="overflow-x-auto rounded-2xl bg-black/40 p-4 text-xs leading-6 text-slate-200">
        {value}
      </pre>
    </Panel>
  );
}
