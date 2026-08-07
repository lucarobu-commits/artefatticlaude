import type { Costo, Modulo, Pacchetto, Parametri, StrumentoStack } from "./types";

export const DEFAULT_PARAMETRI: Omit<Parametri, "device_id"> = {
  setup: 1500,
  rinnovo: 200,
  tariffa: 60,
  oresvil: 4,
  n1: 4,
  n2: 8,
  n3: 14,
  svilpercl: 0.5,
  vivere: 1900,
  riserva: 5,
  stipendio: 0,
  churn: 5,
  adoz: 60,
  vocipercl: 1.5,
  ateco: 67,
  aliq_imp: 5,
  aliq_inps: 26.1,
  anno_inizio: 2025,
  simfatt: 3000,
};

export const DEFAULT_COSTI: Omit<Costo, "device_id">[] = [
  { id: "default-costo-1", nome: "Commercialista", importo: 100, freq: "mese" },
  { id: "default-costo-2", nome: "Strumenti vari", importo: 30, freq: "mese" },
];

export const DEFAULT_MODULI: Omit<Modulo, "device_id">[] = [
  { id: "default-modulo-1", nome: "Base", ore: 8 },
  { id: "default-modulo-2", nome: "Cassa", ore: 8 },
  { id: "default-modulo-3", nome: "Magazzino", ore: 4 },
  { id: "default-modulo-4", nome: "Setup + formazione", ore: 4 },
];

export const DEFAULT_PACCHETTI: Omit<Pacchetto, "device_id">[] = [
  { id: "default-pacchetto-1", nome: "Hosting + backup", prezzo: 15, ore_mese: 0, costo_var: 5 },
  { id: "default-pacchetto-2", nome: "Aggiornamenti", prezzo: 20, ore_mese: 0.5, costo_var: 0 },
  { id: "default-pacchetto-3", nome: "Reportistica", prezzo: 25, ore_mese: 1, costo_var: 0 },
  { id: "default-pacchetto-4", nome: "Supporto prioritario", prezzo: 40, ore_mese: 2, costo_var: 0 },
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
    nome: "Dominio + email",
    piano_attivo: "base",
    piani: [{ id: "base", nome: "Base", prezzo: 5 }],
  },
];

export const ATECO_OPZIONI = [
  { valore: 40, etichetta: "40% — Commercio all'ingrosso e al dettaglio" },
  { valore: 54, etichetta: "54% — Commercio ambulante" },
  { valore: 62, etichetta: "62% — Costruzioni e attività immobiliari" },
  { valore: 67, etichetta: "67% — Industrie, artigianato, servizi (professionisti)" },
  { valore: 78, etichetta: "78% — Intermediari di commercio" },
  { valore: 86, etichetta: "86% — Attività professionali, scientifiche e tecniche" },
];

export const ANNI_APERTURA_PIVA = [2021, 2022, 2023, 2024, 2025, 2026];
