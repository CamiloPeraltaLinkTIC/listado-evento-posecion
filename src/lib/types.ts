export interface Attendee {
  id: string;
  cedula: string;
  nombre: string;
  entidad: string | null;
  has_attended: boolean;
  arrival_time: string | null;
  created_at: string;
}

/** Fila lista para upsert (sin campos generados por la base de datos). */
export interface AttendeeUpsert {
  cedula: string;
  nombre: string;
  entidad?: string | null;
}

export type StatusFilter = "all" | "attended" | "pending";
