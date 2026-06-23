"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

interface Props {
  toast: ToastState | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    // Los avisos con detalle (error/info) se muestran un poco más.
    const t = setTimeout(onDismiss, toast.type === "success" ? 3500 : 5500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 px-4">
      <div
        className={cn(
          "card lift flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-in-up border-l-4",
          toast.type === "success" && "border-l-moss-500",
          toast.type === "error" && "border-l-danger-600",
          toast.type === "info" && "border-l-brand-500"
        )}
      >
        {toast.type === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-moss-600" />
        ) : toast.type === "error" ? (
          <AlertCircle className="h-5 w-5 shrink-0 text-danger-600" />
        ) : (
          <Info className="h-5 w-5 shrink-0 text-brand-300" />
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
