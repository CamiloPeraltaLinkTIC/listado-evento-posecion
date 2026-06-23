"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastState {
  message: string;
  type: "success" | "error";
}

interface Props {
  toast: ToastState | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 px-4">
      <div
        className={cn(
          "card lift flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-in-up",
          isSuccess
            ? "border-l-4 border-l-moss-500"
            : "border-l-4 border-l-danger-600"
        )}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-moss-600" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0 text-danger-600" />
        )}
        <p className="text-sm font-medium text-ink">{toast.message}</p>
        <button
          onClick={onDismiss}
          className="ml-1 rounded-md p-1 text-ink-faint transition hover:bg-paper hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
