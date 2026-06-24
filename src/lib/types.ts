export interface Attendee {
  id: string;
  cedula: string;
  nombre: string;
  entidad: string | null;
  entity_id: string | null;
  has_attended: boolean;
  arrival_time: string | null;
  created_at: string;
}

/** Entidad con enlace de invitación y cupo de puestos. */
export interface Entity {
  id: string;
  nombre: string;
  token: string;
  access_code: string;
  cupo: number;
  created_at: string;
}

/** Entidad acompañada de cuántos puestos lleva ocupados. */
export interface EntityWithUsage extends Entity {
  used: number;
}

/** Vista pública (sin token) que recibe el responsable en su enlace. */
export interface InviteInfo {
  nombre: string;
  cupo: number;
  used: number;
  attendees: { cedula: string; nombre: string }[];
}

/** Fila lista para upsert (sin campos generados por la base de datos). */
export interface AttendeeUpsert {
  cedula: string;
  nombre: string;
  entidad?: string | null;
}

export type StatusFilter = "all" | "attended" | "pending";

/** Resumen de una importación desde Excel. */
export interface ImportStats {
  validos: number;
  omitidos: number; // filas con datos pero sin cédula o nombre
  duplicados: number; // cédulas repetidas dentro del mismo archivo
}
