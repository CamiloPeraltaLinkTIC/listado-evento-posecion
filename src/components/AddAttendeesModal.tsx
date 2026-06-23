"use client";

import { FileUp, X } from "lucide-react";
import type { AttendeeUpsert } from "@/lib/types";
import ExcelUpload from "./ExcelUpload";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpload: (rows: AttendeeUpsert[]) => Promise<void>;
}

export default function AddAttendeesModal({ open, onClose, onUpload }: Props) {
  if (!open) return null;

  async function handleImport(rows: AttendeeUpsert[]) {
    await onUpload(rows);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="card lift w-full max-w-lg rounded-t-2xl sm:rounded-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-line px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/40 bg-brand-100/50 text-brand-300">
              <FileUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="eyebrow">Carga masiva</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Importar Excel
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="-mr-1 rounded-md p-1.5 text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p className="mb-4 text-sm text-ink-soft">
            Sube un archivo con las columnas{" "}
            <span className="font-mono text-xs text-ink">Cédula</span> y{" "}
            <span className="font-mono text-xs text-ink">Nombre</span>. Los
            duplicados por cédula se actualizan automáticamente.
          </p>
          <ExcelUpload onUpload={handleImport} />
        </div>
      </div>
    </div>
  );
}
