import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const type = options?.type || 'info';
      const duration = options?.duration ?? 3500;

      const newToast: ToastItem = {
        id,
        title,
        description: options?.description,
        type,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Render Stack - Bottom Right Serko Floating Pills */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const iconMap = {
            success: <CheckCircle2 className="w-4 h-4 text-[#158142] shrink-0" />,
            info: <Info className="w-4 h-4 text-[#1B98F2] shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-[#FF8C51] shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-[#E53E3E] shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start justify-between gap-3 p-3.5 bg-white/95 backdrop-blur-md border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{iconMap[t.type]}</div>
                <div>
                  <h4 className="text-xs font-semibold text-[#000000] tracking-tight">{t.title}</h4>
                  {t.description && (
                    <p className="text-[11px] text-[#71717A] mt-0.5 leading-relaxed">{t.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-[#A1A1AA] hover:text-[#000000] p-1 rounded-md hover:bg-black/[0.04] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

