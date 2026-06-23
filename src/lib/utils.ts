import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases condicionales y resuelve conflictos de Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normaliza una cédula: quita espacios, puntos y guiones. */
export function normalizeCedula(value: string): string {
  return String(value ?? "").replace(/[\s.\-]/g, "").trim();
}

/** Quita tildes/diacríticos y pasa a minúsculas, para buscar de forma flexible. */
export function fold(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
