"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TransactionState = "pending" | "confirming" | "success" | "error";

export interface TransactionStatusProps {
  status: TransactionState;
  hash?: string;
  title?: string;
  description?: string;
  confirmations?: number;
  totalConfirmations?: number;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  hash,
  title,
  description,
  confirmations = 0,
  totalConfirmations = 3,
  onRetry,
  onClose,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />,
          title: title || "Waiting for Confirmation",
          description: description || "Please confirm the transaction in your wallet",
          color: "text-aura-primary",
        };
      case "confirming":
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-aura-warning" />,
          title: title || "Confirming Transaction",
          description: description || `Confirming... (${confirmations}/${totalConfirmations})`,
          color: "text-aura-warning",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-aura-success" />,
          title: title || "Transaction Successful",
          description: description || "Your transaction has been confirmed",
          color: "text-aura-success",
        };
      case "error":
        return {
          icon: <XCircle className="w-8 h-8 text-aura-error" />,
          title: title || "Transaction Failed",
          description: description || "Something went wrong. Please try again.",
          color: "text-aura-error",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <GlassCard variant="elevated" className={cn("p-6", className)}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          {config.icon}
        </div>
        <h3 className={cn("mb-2 text-lg font-semibold", config.color)}>
          {config.title}
        </h3>
        <p className="mb-4 text-sm text-white/60">{config.description}</p>

        {status === "confirming" && (
          <div className="mb-4 w-full max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-aura-warning transition-all duration-300"
                style={{ width: `${(confirmations / totalConfirmations) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              {confirmations} of {totalConfirmations} confirmations
            </p>
          </div>
        )}

        {hash && (
          <a
            href={`https://bscscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-1 text-sm text-aura-primary transition-colors hover:text-aura-primary-light"
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <div className="flex w-full items-center gap-3">
          {status === "error" && onRetry && (
            <Button onClick={onRetry} className="flex-1 bg-aura-primary text-white hover:bg-aura-primary-dark">
              Retry
            </Button>
          )}
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-white hover:bg-white/5"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default TransactionStatus;
