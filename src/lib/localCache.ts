import type { Costo, Modulo, Parametri, StrumentoStack } from "./types";

const CHIAVE_CACHE = "calcolatore_cache_v2";

export interface CacheDati {
  parametri: Parametri;
  costi: Costo[];
  moduli: Modulo[];
  stack: StrumentoStack[];
}

/**
 * Copia locale (per-dispositivo) di tutti i dati dell'app, indipendente da Supabase.
 * Garantisce che le modifiche non vadano perse tra un refresh e l'altro anche senza
 * cloud configurato, ed è usata come sorgente per "seminare" Supabase al primo collegamento
 * di questo dispositivo, così le modifiche già fatte non vengono sovrascritte dai default.
 */
export function leggiCache(): CacheDati | null {
  try {
    const raw = localStorage.getItem(CHIAVE_CACHE);
    if (!raw) return null;
    return JSON.parse(raw) as CacheDati;
  } catch {
    return null;
  }
}

export function salvaCache(dati: CacheDati): void {
  try {
    localStorage.setItem(CHIAVE_CACHE, JSON.stringify(dati));
  } catch {
    // localStorage pieno o non disponibile (es. navigazione privata): si continua solo in memoria.
  }
}
