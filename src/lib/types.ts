export type Livello = "L1" | "L2";

export interface Parametri {
  device_id: string;
  // Pricing — servizi a progetto, una tantum
  prezzo_l1: number; // Livello 1: analisi + caricamento file MD (€)
  prezzo_l2: number; // Livello 2: analisi approfondita + implementazione + formazione + bonus agenti (€)
  prezzo_evoluzione: number; // prezzo medio "a preventivo" di un progetto di Evoluzione (€)
  tariffa: number; // tariffa oraria interna, usata per stimare la marginalità (€/h)
  // Acquisizione — nuovi progetti L1/L2 per anno
  n1_l1: number; // nuovi L1 — Anno 1
  n2_l1: number; // nuovi L1 — Anno 2
  n3_l1: number; // nuovi L1 — Anno 3 (e Anno 4, a regime)
  n1_l2: number; // nuovi L2 — Anno 1
  n2_l2: number; // nuovi L2 — Anno 2
  n3_l2: number; // nuovi L2 — Anno 3 (e Anno 4, a regime)
  adoz_evoluzione: number; // % del parco clienti già serviti che ogni anno richiede un'Evoluzione
  // Personali
  vivere: number; // spese mensili per vivere (€)
  riserva: number; // mesi di riserva liquida
  stipendio: number; // reddito netto da lavoro dipendente (€/mese), riduce il gap
  // Fiscalità
  ateco: number; // coefficiente di redditività ATECO (%)
  aliq_imp: number; // aliquota simulatore manuale (5 o 15) - non usata nella proiezione automatica
  aliq_inps: number; // aliquota contributiva INPS (%)
  anno_inizio: number; // anno di apertura P.IVA
  simfatt: number; // fatturato mensile usato nel simulatore fiscalità
}

export type Frequenza = "mese" | "anno";

export interface Costo {
  id: string;
  device_id: string;
  nome: string;
  importo: number;
  freq: Frequenza;
}

export interface Modulo {
  id: string;
  device_id: string;
  nome: string;
  ore: number;
  livello: Livello; // a quale pacchetto (L1 o L2) appartiene questa voce
}

export interface PianoStack {
  id: string;
  nome: string;
  prezzo: number;
}

export interface StrumentoStack {
  id: string;
  device_id: string;
  nome: string;
  piano_attivo: string; // id del piano selezionato in `piani`
  piani: PianoStack[];
}

export interface CalcoloFiscale {
  imponibile: number;
  imposta: number;
  contributi: number;
  netto: number;
  aliqEff: number; // pressione fiscale + contributiva effettiva sul fatturato
}

export interface AnnoProiezione {
  anno: number; // indice 1..4
  annoSolare: number;
  aliqImp: number; // 0.05 o 0.15, applicata quell'anno
  nuoviL1: number;
  nuoviL2: number;
  portafoglio: number; // totale progetti L1+L2 erogati cumulativamente fino a quest'anno incluso
  ricaviL1: number;
  ricaviL2: number;
  ricaviEvoluzione: number;
  fatturato: number;
  fisco: CalcoloFiscale;
  costiAzAnnui: number;
  techStackAnnuo: number;
  netto: number;
  breakEven: number;
  progressoBreakEven: number; // 0..1+
  superaBreakEven: boolean;
}

export type Semaforo = "verde" | "arancio" | "rosso";

export interface KpiParametri {
  semaforo: Semaforo;
  fatturatoMinimo: number;
  progettiL2Necessari: number;
  runwayMesi: number;
  nettoAnno1: number;
  gapMensile: number;
}
