"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { EntityWithUsage } from "@/lib/types";
import type { ToastState } from "./Toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onNotify: (message: string, type: ToastState["type"]) => void;
}

function linkFor(token: string): string {
  if (typeof window === "undefined") return `/i/${token}`;
  return `${window.location.origin}/i/${token}`;
}

export default function EntitiesModal({ open, onClose, onNotify }: Props) {
  const [entities, setEntities] = useState<EntityWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [cupo, setCupo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/entities", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      onNotify(data?.error ?? "No se pudieron cargar las entidades.", "error");
      setLoading(false);
      return;
    }
    setEntities(data.entities ?? []);
    setLoading(false);
  }, [onNotify]);

  useEffect(() => {
    if (open) {
      setNombre("");
      setCupo("");
      setError("");
      fetchEntities();
    }
  }, [open, fetchEntities]);

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cupoNum = Math.trunc(Number(cupo));
    if (!nombre.trim()) {
      setError("Escribe el nombre de la entidad.");
      return;
    }
    if (!Number.isFinite(cupoNum) || cupoNum < 1) {
      setError("El cupo debe ser un número mayor o igual a 1.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), cupo: cupoNum }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear la entidad.");
        return;
      }
      setNombre("");
      setCupo("");
      await fetchEntities();
      const vinc = Number(data?.vinculados ?? 0);
      onNotify(
        vinc > 0
          ? `Entidad "${data.entity.nombre}" creada · ${vinc} asistente(s) ya cargados vinculados`
          : `Entidad "${data.entity.nombre}" creada`,
        vinc > 0 ? "info" : "success"
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      onNotify("No se pudo copiar.", "error");
    }
  }

  async function handleDelete(id: string, nombreEnt: string) {
    if (
      !window.confirm(
        `¿Eliminar la entidad "${nombreEnt}"? Sus asistentes ya cargados se conservan, pero quedan sin entidad y el enlace dejará de funcionar.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/entities/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      onNotify(data?.error ?? "No se pudo eliminar.", "error");
      return;
    }
    await fetchEntities();
    onNotify(`Entidad "${nombreEnt}" eliminada`, "info");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="card lift flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-line px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/40 bg-brand-100/50 text-brand-300">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="eyebrow">Invitaciones</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                Entidades y cupos
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

        {/* Crear entidad */}
        <form
          onSubmit={handleCreate}
          className="border-b border-line px-6 py-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="eyebrow mb-1.5 block">Nombre de la entidad</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Consejo Nacional Electoral"
                className="w-full rounded-lg border border-line bg-paper/50 px-4 py-2.5 text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:bg-card"
              />
            </div>
            <div className="sm:w-32">
              <label className="eyebrow mb-1.5 block">Cupo</label>
              <input
                value={cupo}
                onChange={(e) => setCupo(e.target.value)}
                placeholder="400"
                inputMode="numeric"
                className="w-full rounded-lg border border-line bg-paper/50 px-4 py-2.5 font-mono text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:bg-card"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-moss-500 px-4 py-2.5 text-sm font-semibold text-[#06210f] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Crear
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-danger-600/30 bg-danger-100/60 px-3 py-2 text-sm text-danger-600">
              {error}
            </p>
          )}
        </form>

        {/* Lista de entidades */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-ink-faint">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : entities.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-faint">
              Aún no has creado entidades. Crea la primera arriba.
            </div>
          ) : (
            <ul className="space-y-3">
              {entities.map((e) => {
                const lleno = e.used >= e.cupo;
                const pct =
                  e.cupo > 0 ? Math.min(100, (e.used / e.cupo) * 100) : 0;
                return (
                  <li
                    key={e.id}
                    className="rounded-xl border border-line bg-paper/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {e.nombre}
                        </p>
                        <p className="font-mono text-xs text-ink-soft">
                          <span
                            className={
                              lleno ? "text-danger-600" : "text-moss-600"
                            }
                          >
                            {e.used}
                          </span>{" "}
                          / {e.cupo} puestos
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(e.id, e.nombre)}
                        title="Eliminar entidad"
                        className="shrink-0 rounded-md p-1.5 text-ink-faint transition hover:bg-danger-100/60 hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card">
                      <div
                        className={
                          lleno ? "h-full bg-danger-600" : "h-full bg-moss-500"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Enlace */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                        <span className="truncate font-mono text-xs text-ink-soft">
                          {linkFor(e.token)}
                        </span>
                      </div>
                      <button
                        onClick={() => copyText(linkFor(e.token), `${e.id}:link`)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-brand-500 hover:text-ink active:scale-95"
                      >
                        {copied === `${e.id}:link` ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-moss-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Enlace
                          </>
                        )}
                      </button>
                    </div>

                    {/* Código de acceso */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
                        <KeyRound className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                        <span className="font-mono text-xs tracking-widest text-ink">
                          {e.access_code}
                        </span>
                        <span className="text-xs text-ink-faint">
                          código de acceso
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          copyText(e.access_code, `${e.id}:code`)
                        }
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-brand-500 hover:text-ink active:scale-95"
                      >
                        {copied === `${e.id}:code` ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-moss-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Código
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
