"use client";

import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { cn, normalizeCedula } from "@/lib/utils";
import type { AttendeeUpsert } from "@/lib/types";

interface Props {
  onUpload: (rows: AttendeeUpsert[]) => Promise<void>;
}

/** Encuentra el valor de una fila buscando llaves por nombre aproximado. */
function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const rawKey of Object.keys(row)) {
    const norm = rawKey.toLowerCase().trim();
    if (keys.some((k) => norm.includes(k))) {
      return String(row[rawKey] ?? "").trim();
    }
  }
  return "";
}

export default function ExcelUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      setBusy(true);
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        });

        const seen = new Set<string>();
        const rows: AttendeeUpsert[] = [];

        for (const raw of json) {
          const cedula = normalizeCedula(
            pick(raw, ["cedula", "cédula", "documento", "identificacion", "id"])
          );
          const nombre = pick(raw, ["nombre", "name", "apellido", "asistente"]);
          const entidad = pick(raw, [
            "entidad",
            "empresa",
            "organizacion",
            "organización",
            "institucion",
            "institución",
          ]);
          if (!cedula || !nombre) continue;
          if (seen.has(cedula)) continue;
          seen.add(cedula);
          rows.push({ cedula, nombre, entidad: entidad || null });
        }

        if (rows.length === 0) {
          setError(
            "No se encontraron columnas 'Cédula' y 'Nombre' con datos válidos."
          );
          return;
        }

        await onUpload(rows);
      } catch (err) {
        console.error(err);
        setError("No se pudo procesar el archivo. ¿Es un .xlsx válido?");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onUpload]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          dragging
            ? "border-brand-500 bg-brand-100/60"
            : "border-line bg-paper/40 hover:border-ink/40 hover:bg-paper/70"
        )}
      >
        {busy ? (
          <Loader2 className="mb-3 h-9 w-9 animate-spin text-brand-500" />
        ) : (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-brand-500/40 bg-brand-100/50 text-brand-300 transition group-hover:-translate-y-0.5">
            <UploadCloud className="h-6 w-6" />
          </div>
        )}
        <p className="text-sm font-semibold text-ink">
          {busy ? "Procesando archivo…" : "Arrastra tu Excel aquí"}
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">
          o haz clic para seleccionarlo
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Columnas: Cédula, Nombre y Entidad · .xlsx / .xls
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-danger-600/30 bg-danger-100/60 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
