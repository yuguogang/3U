"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  action,
  duration = 5000,
  dismissible = true,
  onDismiss,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-aura-success" />;
      case "error":
        return <XCircle className="h-5 w-5 text-aura-error" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-aura-warning" />;
      case "info":
        return <Info className="h-5 w-5 text-aura-info" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-aura-success/30";
      case "error":
        return "border-aura-error/30";
      case "warning":
        return "border-aura-warning/30";
      case "info":
        return "border-aura-info/30";
    }
  };

  return (
    <div
      role={type === "error" || type === "warning" ? "alert" : "status"}
      aria-live={type === "error" || type === "warning" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl",
        "bg-[#141414] border backdrop-blur-xl",
        "animate-slide-up transition-all duration-300",
        getBorderColor()
      )}
    >
      <div className="mt-0.5 shrink-0">{getIcon()}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        {message && <p className="mt-1 text-xs text-white/60">{message}</p>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-medium text-aura-primary transition-colors hover:text-aura-primary-light"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={() => onDismiss?.(id)}
          className="shrink-0 text-white/40 transition-colors hover:text-white/70"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = "top-right",
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-center":
        return "top-4 left-1/2 -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2";
    }
  };

  return (
    <div
      className={cn("fixed z-[100] flex w-full max-w-sm flex-col gap-2 px-4", getPositionClasses())}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;
