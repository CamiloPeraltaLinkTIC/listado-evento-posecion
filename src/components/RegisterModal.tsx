"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { normalizeCedula } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onRegister: (cedula: string, nombre: string) => Promise<void>;
  initialCedula?: string;
  initialNombre?: string;
}

export default function RegisterModal({
  open,
  onClose,
  onRegister,
  initialCedula = "",
  initialNombre = "",
}: Props) {
  const [cedula, setCedula] = useState(initialCedula);
  const [nombre, setNombre] = useState(initialNombre);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Precarga los campos cada vez que se abre el modal.
  useEffect(() => {
    if (open) {
      setCedula(initialCedula);
      setNombre(initialNombre);
      setError("");
    }
  }, [open, initialCedula, initialNombre]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ced = normalizeCedula(cedula);
    if (!ced || !nombre.trim()) {
      setError("Cédula y nombre son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await onRegister(ced, nombre.trim());
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar la persona."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="card lift w-full max-w-md rounded-t-2xl sm:rounded-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-line px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-moss-500/40 bg-moss-100 text-moss-600">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="eyebrow">Nueva asistencia</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Registrar asistencia
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="space-y-4">
            <div>
              <label className="eyebrow mb-1.5 block">Cédula</label>
              <input
                autoFocus
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="1023456789"
                inputMode="numeric"
                className="w-full rounded-lg border border-line bg-paper/50 px-4 py-2.5 font-mono text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:bg-card"
              />
            </div>
            <div>
              <label className="eyebrow mb-1.5 block">Nombre completo</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="María Gómez"
                className="w-full rounded-lg border border-line bg-paper/50 px-4 py-2.5 text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:bg-card"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-danger-600/30 bg-danger-100/60 px-3 py-2 text-sm text-danger-600">
                {error}
              </p>
            )}

            <p className="text-xs text-ink-faint">
              Se marcará como asistido.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-moss-500 py-3 text-sm font-semibold text-[#06210f] transition hover:brightness-110 hover:shadow-[0_0_18px_-4px_rgba(43,212,127,0.8)] active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Registrar asistencia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
