"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Upload, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { normalizeCedula } from "@/lib/utils";
import type { Attendee, AttendeeUpsert } from "@/lib/types";
import StatsBar from "./StatsBar";
import AttendeeList from "./AttendeeList";
import AddAttendeesModal from "./AddAttendeesModal";
import RegisterModal from "./RegisterModal";
import Toast, { type ToastState } from "./Toast";

export default function Dashboard() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [prefill, setPrefill] = useState({ cedula: "", nombre: "" });
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
  }, []);

  const fetchAttendees = useCallback(async () => {
    const { data, error } = await supabase
      .from("attendees")
      .select("*")
      .order("has_attended", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      notify("Error al cargar asistentes: " + error.message, "error");
      setLoading(false);
      return;
    }
    setAttendees((data as Attendee[]) ?? []);
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  // --- Sincronización en tiempo real entre dispositivos ---
  useEffect(() => {
    const channel = supabase
      .channel("attendees-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendees" },
        (payload) => {
          setAttendees((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Attendee;
              if (prev.some((a) => a.id === row.id)) {
                return prev.map((a) => (a.id === row.id ? row : a));
              }
              return [...prev, row];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Attendee;
              return prev.map((a) => (a.id === row.id ? row : a));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as { id: string };
              return prev.filter((a) => a.id !== old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Confirmar asistencia (optimista) ---
  const handleConfirm = useCallback(
    async (attendee: Attendee) => {
      setConfirmingId(attendee.id);
      const arrival = new Date().toISOString();

      // Mutación local inmediata para UX rápida.
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendee.id
            ? { ...a, has_attended: true, arrival_time: arrival }
            : a
        )
      );

      const { error } = await supabase
        .from("attendees")
        .update({ has_attended: true, arrival_time: arrival })
        .eq("id", attendee.id);

      setConfirmingId(null);

      if (error) {
        // Revertir si falla.
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === attendee.id
              ? { ...a, has_attended: false, arrival_time: null }
              : a
          )
        );
        notify("No se pudo confirmar: " + error.message, "error");
        return;
      }
      notify(`✓ ${attendee.nombre} confirmado`, "success");
    },
    [notify]
  );

  // --- Restablecer asistencia (deshacer, optimista) ---
  const handleRevert = useCallback(
    async (attendee: Attendee) => {
      setConfirmingId(attendee.id);
      const previousArrival = attendee.arrival_time;

      // Vuelve a pendiente de inmediato.
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendee.id
            ? { ...a, has_attended: false, arrival_time: null }
            : a
        )
      );

      const { error } = await supabase
        .from("attendees")
        .update({ has_attended: false, arrival_time: null })
        .eq("id", attendee.id);

      setConfirmingId(null);

      if (error) {
        // Revertir el cambio local si falla.
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === attendee.id
              ? { ...a, has_attended: true, arrival_time: previousArrival }
              : a
          )
        );
        notify("No se pudo restablecer: " + error.message, "error");
        return;
      }
      notify(`${attendee.nombre} restablecido a pendiente`, "success");
    },
    [notify]
  );

  // --- Subida masiva desde Excel (upsert) ---
  const handleUpload = useCallback(
    async (rows: AttendeeUpsert[]) => {
      const { error } = await supabase
        .from("attendees")
        .upsert(rows, { onConflict: "cedula", ignoreDuplicates: false });

      if (error) {
        notify("Error al subir: " + error.message, "error");
        throw error;
      }
      await fetchAttendees();
      notify(`${rows.length} asistentes cargados/actualizados`, "success");
    },
    [fetchAttendees, notify]
  );

  // --- Registro en sitio: crea a la persona y la marca como asistida ---
  const handleRegister = useCallback(
    async (cedula: string, nombre: string) => {
      const { error } = await supabase.from("attendees").insert({
        cedula,
        nombre,
        has_attended: true,
        arrival_time: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "Ya existe una persona con esa cédula. Búscala en la lista para confirmar su asistencia."
          );
        }
        throw new Error(error.message);
      }
      await fetchAttendees();
      notify(`${nombre} registrado y marcado como asistido`, "success");
    },
    [fetchAttendees, notify]
  );

  // Abre el modal de registro, precargando lo que se buscó.
  const handleAddUser = useCallback((query: string) => {
    const ced = normalizeCedula(query);
    const looksCedula = ced.length > 0 && /^\d+$/.test(ced);
    setPrefill({
      cedula: looksCedula ? ced : "",
      nombre: looksCedula ? "" : query.trim(),
    });
    setShowRegister(true);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const attended = attendees.filter((a) => a.has_attended).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-7 sm:py-10">
      {/* Encabezado institucional */}
      <header className="mb-7 border-b border-line pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-brand-500/30">
              <Image
                src="/cne-logo.png"
                alt="Consejo Nacional Electoral de Colombia"
                width={300}
                height={150}
                priority
                unoptimized
                className="h-auto w-[104px] sm:w-[128px]"
              />
            </div>
            <span className="hidden h-11 w-px bg-line sm:block" />
            <div className="hidden sm:block">
              <p className="eyebrow">Declaración de Presidente Electo</p>
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
                Control de Asistencia
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm font-medium text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
        {/* Título compacto para móvil (el logo ya identifica la entidad) */}
        <div className="mt-3 sm:hidden">
          <p className="eyebrow">Declaración de Presidente Electo</p>
          <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-ink">
            Control de Asistencia
          </h1>
        </div>
      </header>

      {/* Barra de acciones */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="eyebrow">Estado de la jornada</h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-500 hover:text-ink active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar Excel</span>
          </button>
          <button
            onClick={() => handleAddUser("")}
            className="flex items-center gap-2 rounded-lg bg-moss-500 px-4 py-2.5 text-sm font-semibold text-[#06210f] transition hover:brightness-110 hover:shadow-[0_0_18px_-4px_rgba(43,212,127,0.8)] active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            Registrar asistencia
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <StatsBar total={attendees.length} attended={attended} />

        <AttendeeList
          attendees={attendees}
          loading={loading}
          confirmingId={confirmingId}
          onConfirm={handleConfirm}
          onRevert={handleRevert}
          onAddUser={handleAddUser}
        />
      </div>

      <AddAttendeesModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onUpload={handleUpload}
      />

      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onRegister={handleRegister}
        initialCedula={prefill.cedula}
        initialNombre={prefill.nombre}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <footer className="mt-10 flex items-center justify-center gap-2 border-t border-line pt-5 text-center font-mono text-[11px] uppercase tracking-widest text-ink-faint">
        <span className="flag-bar inline-block h-2.5 w-4 rounded-[2px]" />
        Consejo Nacional Electoral · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
