import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

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
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-aura-success" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-aura-error" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-aura-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-aura-info" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-aura-success/30';
      case 'error':
        return 'border-aura-error/30';
      case 'warning':
        return 'border-aura-warning/30';
      case 'info':
        return 'border-aura-info/30';
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl',
        'bg-[#141414] border backdrop-blur-xl',
        'animate-slide-up transition-all duration-300',
        getBorderColor()
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        {message && <p className="text-xs text-white/60 mt-1">{message}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-aura-primary hover:text-aura-primary-light mt-2 font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => onDismiss?.(id)}
          className="flex-shrink-0 text-white/40 hover:text-white/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Toast Container Component
export interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onDismiss'>>;
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 w-full max-w-sm p-4',
        getPositionClasses()
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;
