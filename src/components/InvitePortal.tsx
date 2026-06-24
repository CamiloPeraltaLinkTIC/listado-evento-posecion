"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  UserPlus,
  Users2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { normalizeCedula } from "@/lib/utils";
import { INVITE_CODE_HEADER } from "@/lib/constants";
import type { AttendeeUpsert, InviteInfo } from "@/lib/types";
import ExcelUpload from "./ExcelUpload";
import Toast, { type ToastState } from "./Toast";

interface Props {
  token: string;
}

export default function InvitePortal({ token }: Props) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Puerta de código de acceso.
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [gateError, setGateError] = useState("");
  const [checking, setChecking] = useState(false);

  // Alta manual de una persona.
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [manualError, setManualError] = useState("");

  const storageKey = `invite_code_${token}`;

  const notify = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
  }, []);

  /** Trae la info del enlace usando un código; devuelve el estado HTTP. */
  const loadWithCode = useCallback(
    async (accessCode: string): Promise<number> => {
      const res = await fetch(`/api/invite/${token}`, {
        cache: "no-store",
        headers: { [INVITE_CODE_HEADER]: accessCode },
      });
      if (res.ok) {
        const data = (await res.json()) as InviteInfo;
        setInfo(data);
        setAuthed(true);
      } else if (res.status === 404) {
        setInvalid(true);
      }
      return res.status;
    },
    [token]
  );

  // Al cargar: si ya hay un código guardado en esta sesión, intenta entrar.
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(storageKey)
        : null;
    if (saved) {
      setCode(saved);
      loadWithCode(saved).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadWithCode, storageKey]);

  async function handleGate(e: React.FormEvent) {
    e.preventDefault();
    setGateError("");
    const value = code.trim();
    if (!value) {
      setGateError("Ingresa el código de acceso.");
      return;
    }
    setChecking(true);
    try {
      const status = await loadWithCode(value);
      if (status === 200) {
        window.sessionStorage.setItem(storageKey, value);
      } else if (status === 401) {
        setGateError("Código de acceso incorrecto.");
      } else if (status !== 404) {
        setGateError("No se pudo validar el código. Inténtalo de nuevo.");
      }
    } catch {
      setGateError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setChecking(false);
    }
  }

  const fetchInfo = useCallback(async () => {
    await loadWithCode(code);
  }, [loadWithCode, code]);

  /** Envía filas al servidor; lanza Error con el mensaje real si falla. */
  const enviar = useCallback(
    async (rows: { cedula: string; nombre: string }[]) => {
      const res = await fetch(`/api/invite/${token}/load`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [INVITE_CODE_HEADER]: code,
        },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "No se pudo cargar la lista.");
      }
      return data as {
        agregados: number;
        actualizados: number;
        conflictos: number;
        used: number;
        cupo: number;
      };
    },
    [token, code]
  );

  // Carga desde Excel (reutiliza el mismo componente del panel admin).
  const handleExcel = useCallback(
    async (rows: AttendeeUpsert[]) => {
      const data = await enviar(
        rows.map((r) => ({ cedula: r.cedula, nombre: r.nombre }))
      );
      await fetchInfo();
      const extra =
        data.conflictos > 0
          ? ` · ${data.conflictos} ya estaban en otra entidad`
          : "";
      notify(
        `${data.agregados} agregados, ${data.actualizados} actualizados${extra}`,
        data.conflictos > 0 ? "info" : "success"
      );
    },
    [enviar, fetchInfo, notify]
  );

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    setManualError("");
    const ced = normalizeCedula(cedula);
    if (!ced || !nombre.trim()) {
      setManualError("Cédula y nombre son obligatorios.");
      return;
    }
    setSavingManual(true);
    try {
      await enviar([{ cedula: ced, nombre: nombre.trim() }]);
      setCedula("");
      setNombre("");
      await fetchInfo();
      notify("Persona agregada a la lista", "success");
    } catch (err) {
      setManualError(
        err instanceof Error ? err.message : "No se pudo agregar."
      );
    } finally {
      setSavingManual(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </main>
    );
  }

  if (invalid) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card lift max-w-md rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-danger-600" />
          <h1 className="font-display text-xl font-semibold text-ink">
            Enlace no válido
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Este enlace no existe o fue revocado. Solicita uno nuevo al
            organizador del evento.
          </p>
        </div>
      </main>
    );
  }

  // Puerta: pedir el código de acceso antes de mostrar nada de la entidad.
  if (!authed || !info) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="card lift overflow-hidden rounded-2xl">
            <div className="flag-bar h-1.5 w-full" />
            <div className="p-8">
              <div className="mb-6 inline-block rounded-xl bg-white px-4 py-3 ring-1 ring-brand-500/30">
                <Image
                  src="/cne-logo.png"
                  alt="Consejo Nacional Electoral de Colombia"
                  width={360}
                  height={180}
                  priority
                  unoptimized
                  className="h-auto w-[160px]"
                />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                Carga de invitados
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Ingresa el código de acceso que te entregó el organizador para
                continuar.
              </p>

              <form onSubmit={handleGate} className="mt-7 space-y-4">
                <div>
                  <label className="eyebrow mb-1.5 block">
                    Código de acceso
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-faint" />
                    <input
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="ABCD2345"
                      className="w-full rounded-lg border border-line bg-paper/50 py-3 pl-10 pr-4 font-mono uppercase tracking-widest text-ink outline-none transition placeholder:text-ink-faint focus:border-ink focus:bg-card"
                    />
                  </div>
                </div>

                {gateError && (
                  <p className="rounded-lg border border-danger-600/30 bg-danger-100/60 px-3 py-2 text-sm text-danger-600">
                    {gateError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={checking || !code.trim()}
                  className="glow flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {checking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const disponibles = Math.max(0, info.cupo - info.used);
  const lleno = disponibles === 0;
  const pct = info.cupo > 0 ? Math.min(100, (info.used / info.cupo) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-7 sm:py-10">
      {/* Encabezado */}
      <header className="mb-7 border-b border-line pb-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-brand-500/30">
            <Image
              src="/cne-logo.png"
              alt="Consejo Nacional Electoral de Colombia"
              width={300}
              height={150}
              priority
              unoptimized
              className="h-auto w-[104px] sm:w-[120px]"
            />
          </div>
          <div>
            <p className="eyebrow">Carga de invitados</p>
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
              {info.nombre}
            </h1>
          </div>
        </div>
      </header>

      {/* Cupo */}
      <div className="card lift mb-6 rounded-2xl p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow">Puestos</h2>
          <p className="font-mono text-sm text-ink-soft">
            <span className="font-semibold text-ink">{info.used}</span> /{" "}
            {info.cupo}
          </p>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-paper">
          <div
            className={lleno ? "h-full bg-danger-600" : "h-full bg-moss-500"}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          {lleno
            ? "Has alcanzado el cupo. No puedes agregar más personas."
            : `Te quedan ${disponibles} puesto(s) disponibles.`}
        </p>
      </div>

      {/* Carga por Excel */}
      <div className="card lift mb-6 rounded-2xl p-5">
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">
          Cargar por Excel
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          Sube un archivo con las columnas{" "}
          <span className="font-mono text-xs text-ink">Cédula</span> y{" "}
          <span className="font-mono text-xs text-ink">Nombre</span>. No se
          podrá superar tu cupo.
        </p>
        <ExcelUpload onUpload={handleExcel} />
      </div>

      {/* Alta manual */}
      <div className="card lift mb-6 rounded-2xl p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Agregar una persona
        </h2>
        <form onSubmit={handleManual} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Cédula"
              inputMode="numeric"
              disabled={lleno}
              className="w-full rounded-lg border border-line bg-paper/50 px-4 py-2.5 font-mono text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:bg-card disabled:opacity-50"
            />
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              disabled={lleno}
              className="w-full rounded-lg border border-line bg-paper/50 px-4 py-2.5 text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500 focus:bg-card disabled:opacity-50"
            />
          </div>
          {manualError && (
            <p className="rounded-lg border border-danger-600/30 bg-danger-100/60 px-3 py-2 text-sm text-danger-600">
              {manualError}
            </p>
          )}
          <button
            type="submit"
            disabled={savingManual || lleno}
            className="flex items-center justify-center gap-2 rounded-lg bg-moss-500 px-5 py-2.5 text-sm font-semibold text-[#06210f] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            {savingManual ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Agregar
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lista cargada */}
      <div className="card lift overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Lista cargada
          </h2>
          <span className="font-mono text-xs text-ink-faint">
            {info.attendees.length}
          </span>
        </div>
        {info.attendees.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-ink-faint">
            <Users2 className="mb-3 h-9 w-9" />
            <p className="text-sm">Aún no has cargado a nadie.</p>
          </div>
        ) : (
          <ul className="max-h-[50vh] divide-y divide-line overflow-y-auto">
            {info.attendees.map((a) => (
              <li
                key={a.cedula}
                className="flex items-center gap-3 px-5 py-3"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-moss-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {a.nombre}
                  </p>
                  <p className="font-mono text-xs text-ink-faint">
                    CC {a.cedula}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
