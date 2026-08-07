import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Costo, Modulo, Pacchetto, Parametri, StrumentoStack } from "../lib/types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurato = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigurato
  ? createClient(url as string, anonKey as string)
  : null;

export interface DatiRemoti {
  parametri: Parametri | null;
  costi: Costo[];
  moduli: Modulo[];
  pacchetti: Pacchetto[];
  stack: StrumentoStack[];
}

export async function fetchDatiDevice(deviceId: string): Promise<DatiRemoti> {
  if (!supabase) throw new Error("Supabase non configurato");

  const [parametriRes, costiRes, moduliRes, pacchettiRes, stackRes] = await Promise.all([
    supabase.from("parametri").select("*").eq("device_id", deviceId).maybeSingle(),
    supabase.from("costi").select("*").eq("device_id", deviceId).order("nome"),
    supabase.from("moduli").select("*").eq("device_id", deviceId).order("nome"),
    supabase.from("pacchetti").select("*").eq("device_id", deviceId).order("nome"),
    supabase.from("stack").select("*").eq("device_id", deviceId).order("nome"),
  ]);

  for (const res of [parametriRes, costiRes, moduliRes, pacchettiRes, stackRes]) {
    if (res.error) throw res.error;
  }

  return {
    parametri: (parametriRes.data as Parametri | null) ?? null,
    costi: (costiRes.data as Costo[]) ?? [],
    moduli: (moduliRes.data as Modulo[]) ?? [],
    pacchetti: (pacchettiRes.data as Pacchetto[]) ?? [],
    stack: (stackRes.data as StrumentoStack[]) ?? [],
  };
}

export async function upsertParametri(parametri: Parametri): Promise<void> {
  if (!supabase) throw new Error("Supabase non configurato");
  const { error } = await supabase.from("parametri").upsert(parametri, { onConflict: "device_id" });
  if (error) throw error;
}

type Tabella = "costi" | "moduli" | "pacchetti" | "stack";

export async function salvaRiga<T extends { id: string }>(tabella: Tabella, riga: T): Promise<void> {
  if (!supabase) throw new Error("Supabase non configurato");
  const { error } = await supabase.from(tabella).upsert(riga, { onConflict: "id" });
  if (error) throw error;
}

export async function eliminaRiga(tabella: Tabella, id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase non configurato");
  const { error } = await supabase.from(tabella).delete().eq("id", id);
  if (error) throw error;
}
