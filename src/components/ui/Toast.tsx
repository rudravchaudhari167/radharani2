"use client";

import { useState, useCallback, createContext, useContext, type ReactNode, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function Toaster({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <AnimatePresence>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </AnimatePresence>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(true);

  const icons = {
    success: <CheckCircle size={20} className="text-emerald-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />,
    warning: <AlertCircle size={20} className="text-amber-500" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-amber-50 border-amber-200",
  };

  const textColors = {
    success: "text-emerald-800",
    error: "text-red-800",
    info: "text-blue-800",
    warning: "text-amber-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-6 right-6 z-[100] w-full max-w-sm rounded-xl border shadow-xl",
        "bg-white/95 backdrop-blur-sm shadow-lg",
        bgColors[toast.type],
        textColors[toast.type]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text)]">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{toast.message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 200);
          }}
          className="flex-shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "error", title, message }),
    info: (title: string, message?: string) => addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
  };
}