export interface Parametri {
  device_id: string;
  // Pricing base
  setup: number; // prezzo medio setup una tantum (€)
  rinnovo: number; // canone rinnovo annuale (€)
  tariffa: number; // tariffa oraria per sviluppi extra (€/h)
  oresvil: number; // ore medie per sviluppo extra
  // Acquisizione
  n1: number; // nuovi clienti Anno 1
  n2: number; // nuovi clienti Anno 2
  n3: number; // nuovi clienti Anno 3 (e Anno 4, regime a regime)
  svilpercl: number; // sviluppi extra per cliente all'anno
  // Personali
  vivere: number; // spese mensili per vivere (€)
  riserva: number; // mesi di riserva liquida
  stipendio: number; // reddito netto da lavoro dipendente (€/mese), riduce il gap
  churn: number; // tasso di abbandono clienti annuo (%)
  // Pacchetti ricorrenti
  adoz: number; // % clienti che attivano almeno una voce ricorrente
  vocipercl: number; // voci medie attivate per cliente
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
}

export interface Pacchetto {
  id: string;
  device_id: string;
  nome: string;
  prezzo: number; // €/mese fatturati al cliente
  ore_mese: number; // ore tue di gestione al mese
  costo_var: number; // costo variabile mensile (€)
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
  nuoviClienti: number;
  portafoglio: number;
  ricaviSetup: number;
  ricaviRinnovi: number;
  ricaviSviluppi: number;
  ricaviPacchetti: number;
  fatturato: number;
  fisco: CalcoloFiscale;
  costiAzAnnui: number;
  techStackAnnuo: number;
  costiPacchettiAnnui: number;
  netto: number;
  breakEven: number;
  progressoBreakEven: number; // 0..1+
  superaBreakEven: boolean;
}

export type Semaforo = "verde" | "arancio" | "rosso";

export interface KpiParametri {
  semaforo: Semaforo;
  fatturatoMinimo: number;
  setupNecessari: number;
  runwayMesi: number;
  nettoAnno1: number;
  gapMensile: number;
}
