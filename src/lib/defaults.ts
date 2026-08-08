import type { Costo, Modulo, Parametri, StrumentoStack } from "./types";

/** Anno corrente calcolato a runtime, così i default restano sensati indipendentemente da quando si apre l'app. */
const ANNO_CORRENTE = new Date().getFullYear();

export const DEFAULT_PARAMETRI: Omit<Parametri, "device_id"> = {
  prezzo_l1: 600,
  prezzo_l2: 2000,
  prezzo_evoluzione: 800,
  n1_l1: 3,
  n2_l1: 5,
  n3_l1: 8,
  n1_l2: 1,
  n2_l2: 3,
  n3_l2: 5,
  adoz_evoluzione: 40,
  conv_evoluzione: 60,
  vivere: 1900,
  riserva: 5,
  stipendio: 0,
  ateco: 67,
  aliq_imp: 5,
  aliq_inps: 26.1,
  anno_inizio: ANNO_CORRENTE,
  simfatt: 3000,
};

export const DEFAULT_COSTI: Omit<Costo, "device_id">[] = [
  { id: "default-costo-1", nome: "Commercialista", importo: 100, freq: "mese" },
  { id: "default-costo-2", nome: "Strumenti vari", importo: 30, freq: "mese" },
];

export const DEFAULT_MODULI: Omit<Modulo, "device_id">[] = [
  { id: "default-modulo-1", nome: "Analisi situazione attuale", livello: "L1" },
  { id: "default-modulo-2", nome: "Caricamento file MD", livello: "L1" },
  { id: "default-modulo-3", nome: "Analisi approfondita", livello: "L2" },
  { id: "default-modulo-4", nome: "Implementazione Business OS", livello: "L2" },
  { id: "default-modulo-5", nome: "Formazione", livello: "L2" },
  { id: "default-modulo-6", nome: "Bonus agenti marketing e sales", livello: "L2" },
];

export const DEFAULT_STACK: Omit<StrumentoStack, "device_id">[] = [
  {
    id: "default-stack-1",
    nome: "Lovable",
    piano_attivo: "pro",
    piani: [
      { id: "free", nome: "Free", prezzo: 0 },
      { id: "pro", nome: "Pro", prezzo: 25 },
      { id: "team", nome: "Team", prezzo: 50 },
    ],
  },
  {
    id: "default-stack-2",
    nome: "Supabase",
    piano_attivo: "free",
    piani: [{ id: "free", nome: "Free", prezzo: 0 }],
  },
  {
    id: "default-stack-3",
    nome: "Vercel",
    piano_attivo: "hobby",
    piani: [{ id: "hobby", nome: "Hobby", prezzo: 0 }],
  },
  {
    id: "default-stack-4",
    nome: "Claude Pro",
    piano_attivo: "pro",
    piani: [
      { id: "free", nome: "Free", prezzo: 0 },
      { id: "pro", nome: "Pro", prezzo: 18 },
    ],
  },
  {
    id: "default-stack-5",
    nome: "Brevo",
    piano_attivo: "starter",
    piani: [
      { id: "free", nome: "Free", prezzo: 0 },
      { id: "starter", nome: "Starter", prezzo: 7 },
    ],
  },
];

export const ATECO_OPZIONI = [
  { valore: 40, etichetta: "40% — Commercio all'ingrosso e al dettaglio" },
  { valore: 54, etichetta: "54% — Commercio ambulante" },
  { valore: 62, etichetta: "62% — Costruzioni e attività immobiliari" },
  { valore: 67, etichetta: "67% — Altre attività economiche (servizi, consulenza)" },
  { valore: 78, etichetta: "78% — Attività professionali, scientifiche e tecniche" },
  { valore: 86, etichetta: "86% — Sanità e assistenza sociale" },
];

/** Range dinamico: 4 anni passati, l'anno corrente e il prossimo — resta rilevante senza bisogno di aggiornamenti manuali. */
export const ANNI_APERTURA_PIVA = Array.from({ length: 6 }, (_, i) => ANNO_CORRENTE - 4 + i);
