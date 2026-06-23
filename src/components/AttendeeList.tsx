"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import {
  Check,
  Clock,
  Download,
  Loader2,
  Printer,
  RotateCcw,
  Search,
  UserPlus,
  Users2,
} from "lucide-react";
import { cn, fold, normalizeCedula } from "@/lib/utils";
import { printTicket } from "@/lib/printTicket";
import type { Attendee, StatusFilter } from "@/lib/types";

interface Props {
  attendees: Attendee[];
  loading: boolean;
  confirmingId: string | null;
  onConfirm: (attendee: Attendee) => void;
  onRevert: (attendee: Attendee) => void;
  onAddUser: (query: string) => void;
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "attended", label: "Asistieron" },
];

export default function AttendeeList({
  attendees,
  loading,
  confirmingId,
  onConfirm,
  onRevert,
  onAddUser,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const raw = query.trim();
    // Cada palabra debe aparecer en el nombre (en cualquier orden, sin tildes).
    const tokens = fold(raw).split(/\s+/).filter(Boolean);
    const qCedula = normalizeCedula(raw);

    return attendees.filter((a) => {
      if (filter === "attended" && !a.has_attended) return false;
      if (filter === "pending" && a.has_attended) return false;
      if (!raw) return true;

      const nombre = fold(a.nombre);
      const matchNombre =
        tokens.length > 0 && tokens.every((t) => nombre.includes(t));
      const matchCedula =
        qCedula.length > 0 && normalizeCedula(a.cedula).includes(qCedula);
      return matchNombre || matchCedula;
    });
  }, [attendees, query, filter]);

  function handleExport() {
    const rows = attendees.map((a) => ({
      Cédula: a.cedula,
      Nombre: a.nombre,
      Asistió: a.has_attended ? "Sí" : "No",
      "Hora de llegada": a.arrival_time
        ? format(new Date(a.arrival_time), "yyyy-MM-dd HH:mm", { locale: es })
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 16 }, { wch: 32 }, { wch: 10 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
    const stamp = format(new Date(), "yyyy-MM-dd_HHmm");
    XLSX.writeFile(wb, `asistencia-cne-${stamp}.xlsx`);
  }

  return (
    <div className="card lift overflow-hidden rounded-2xl">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Asistentes
          </h2>
          <span className="font-mono text-xs text-ink-faint">
            {filtered.length}/{attendees.length}
          </span>
        </div>
        <button
          onClick={handleExport}
          disabled={attendees.length === 0}
          title="Exportar la lista completa a Excel"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-brand-500 hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cédula o nombre…"
            className="w-full rounded-lg border border-line bg-paper/50 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-ink focus:bg-card"
          />
        </div>

        <div className="flex shrink-0 rounded-lg border border-line bg-paper/50 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition sm:flex-none",
                filter === f.key
                  ? "bg-brand-500 text-white"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estados */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-faint">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm">Cargando asistentes…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center text-ink-faint">
          <Users2 className="mb-3 h-10 w-10" />
          <p className="mb-4 max-w-xs text-sm">
            {attendees.length === 0
              ? "Aún no hay asistentes. Importa un Excel o agrega una asistencia."
              : query.trim()
                ? `No se encontró a “${query.trim()}”. ¿Deseas agregar su asistencia?`
                : "No hay resultados para este filtro."}
          </p>
          <button
            onClick={() => onAddUser(query)}
            className="flex items-center gap-2 rounded-lg bg-moss-500 px-4 py-2.5 text-sm font-semibold text-[#06210f] transition hover:brightness-110 hover:shadow-[0_0_18px_-4px_rgba(43,212,127,0.8)] active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            Registrar asistencia
          </button>
        </div>
      ) : (
        <ul className="max-h-[58vh] divide-y divide-line overflow-y-auto lg:max-h-[62vh]">
          {filtered.map((a) => {
            const isConfirming = confirmingId === a.id;
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 transition",
                  a.has_attended ? "bg-moss-100/40" : "hover:bg-paper/60"
                )}
              >
                {/* Indicador / inicial */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold uppercase",
                    a.has_attended
                      ? "border-moss-500/30 bg-moss-100 text-moss-600"
                      : "border-line bg-card text-ink-soft"
                  )}
                >
                  {a.nombre.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{a.nombre}</p>
                  <p className="font-mono text-xs text-ink-faint">
                    CC {a.cedula}
                  </p>
                </div>

                {a.has_attended ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {a.arrival_time && (
                      <span className="hidden items-center gap-1 font-mono text-xs text-ink-faint sm:flex">
                        <Clock className="h-3 w-3" />
                        {format(new Date(a.arrival_time), "p", { locale: es })}
                      </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full border border-moss-500/30 bg-moss-100 px-2.5 py-1 text-xs font-semibold text-moss-600">
                      <Check className="h-3.5 w-3.5" />
                      Asistió
                    </span>
                    <button
                      onClick={() =>
                        printTicket({ nombre: a.nombre, cedula: a.cedula })
                      }
                      title="Reimprimir tiquete"
                      aria-label={`Reimprimir tiquete de ${a.nombre}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-ink-faint transition hover:border-brand-500 hover:text-brand-300 active:scale-95"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRevert(a)}
                      disabled={isConfirming}
                      title="Restablecer a pendiente"
                      aria-label={`Restablecer a ${a.nombre} a pendiente`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-ink-faint transition hover:border-danger-600/40 hover:text-danger-600 active:scale-95 disabled:opacity-50"
                    >
                      {isConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onConfirm(a)}
                    disabled={isConfirming}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 hover:shadow-[0_0_18px_-4px_rgba(43,143,255,0.7)] active:scale-95 disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Confirmar</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
