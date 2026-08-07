import type {
  AnnoProiezione,
  CalcoloFiscale,
  KpiParametri,
  Pacchetto,
  Parametri,
  Semaforo,
  StrumentoStack,
} from "./types";

/** Regime forfettario: 5% agevolato per i primi 5 anni dall'apertura P.IVA, poi 15%. */
export function aliquotaImpostaAnno(annoSolare: number, annoInizio: number): number {
  return annoSolare - annoInizio < 5 ? 0.05 : 0.15;
}

/**
 * Tassazione forfettaria su un fatturato annuo.
 * imponibile = fatturato × coeff. ATECO
 * contributi INPS Gestione Separata: calcolati "dentro" il fatturato (base imponibile
 * al netto del contributo stesso), da cui la divisione per (1 + aliqInps × 0.5).
 */
export function calcFisco(
  fatturato: number,
  annoSolare: number,
  params: Pick<Parametri, "ateco" | "aliq_inps" | "anno_inizio">
): CalcoloFiscale {
  const aliqImp = aliquotaImpostaAnno(annoSolare, params.anno_inizio);
  const aliqInps = params.aliq_inps / 100;
  const imponibile = fatturato * (params.ateco / 100);
  const contributi = (imponibile * aliqInps) / (1 + aliqInps * 0.5);
  const imposta = imponibile * aliqImp;
  const netto = fatturato - imposta - contributi;
  const aliqEff = fatturato > 0 ? (imposta + contributi) / fatturato : 0;
  return { imponibile, imposta, contributi, netto, aliqEff };
}

export function costiAnnuiTotali(costi: { importo: number; freq: "mese" | "anno" }[]): number {
  return costi.reduce((tot, c) => tot + (c.freq === "mese" ? c.importo * 12 : c.importo), 0);
}

export function costiMensiliTotali(costi: { importo: number; freq: "mese" | "anno" }[]): number {
  return costiAnnuiTotali(costi) / 12;
}

export function pianoAttivo(strumento: StrumentoStack) {
  return strumento.piani.find((p) => p.id === strumento.piano_attivo) ?? strumento.piani[0];
}

export function stackMensileTotale(stack: StrumentoStack[]): number {
  return stack.reduce((tot, s) => tot + (pianoAttivo(s)?.prezzo ?? 0), 0);
}

export function stackAnnuoTotale(stack: StrumentoStack[]): number {
  return stackMensileTotale(stack) * 12;
}

/** Prezzo, costo variabile e ore medie dei pacchetti à la carte, usati per stimare l'MRR per cliente. */
export function mediePacchetti(pacchetti: Pacchetto[]): { prezzoMedio: number; costoVarMedio: number; oreMedie: number } {
  if (pacchetti.length === 0) return { prezzoMedio: 0, costoVarMedio: 0, oreMedie: 0 };
  const prezzoMedio = pacchetti.reduce((s, p) => s + p.prezzo, 0) / pacchetti.length;
  const costoVarMedio = pacchetti.reduce((s, p) => s + p.costo_var, 0) / pacchetti.length;
  const oreMedie = pacchetti.reduce((s, p) => s + p.ore_mese, 0) / pacchetti.length;
  return { prezzoMedio, costoVarMedio, oreMedie };
}

/** Ricavo ricorrente mensile medio per cliente attivo, dato il tasso di adozione e le voci medie. */
export function mrrPerCliente(params: Pick<Parametri, "adoz" | "vocipercl">, prezzoMedioVoce: number): number {
  return (params.adoz / 100) * params.vocipercl * prezzoMedioVoce;
}

interface BreakEvenInput {
  vivere: number;
  costiAzAnnui: number;
  annoSolare: number;
  ateco: number;
  aliq_inps: number;
  anno_inizio: number;
}

/**
 * Fatturato annuo minimo (break-even reale) tale che netto − costi_az = vivere × 12.
 * Risolto per iterazione a punto fisso (5 passi sono sufficienti a convergere).
 */
export function breakEvenReale(input: BreakEvenInput): number {
  const vivereAnnuo = input.vivere * 12;
  let guess = (vivereAnnuo + input.costiAzAnnui) / 0.59;
  for (let i = 0; i < 5; i++) {
    const f = calcFisco(guess, input.annoSolare, input);
    guess = vivereAnnuo + input.costiAzAnnui + f.imposta + f.contributi;
  }
  return guess;
}

export interface DatiProiezione {
  parametri: Parametri;
  costiAzAnnui: number;
  techStackAnnuo: number;
  prezzoMedioVoce: number;
  costoVarMedioVoce: number;
}

/**
 * Proiezione a 4 anni del portafoglio clienti e dei ricavi.
 * Nota: il brief espone solo 3 slider di acquisizione (Anno 1/2/3); l'Anno 4 assume
 * lo stesso ritmo di acquisizione dell'Anno 3 (regime "a velocità di crociera").
 */
export function calcAnni(dati: DatiProiezione): AnnoProiezione[] {
  const { parametri: p, costiAzAnnui, techStackAnnuo, prezzoMedioVoce, costoVarMedioVoce } = dati;
  const nuoviPerAnno = [p.n1, p.n2, p.n3, p.n3];
  const mrr = mrrPerCliente(p, prezzoMedioVoce);

  let portafoglio = 0;
  const anni: AnnoProiezione[] = [];

  for (let i = 0; i < 4; i++) {
    const anno = i + 1;
    const annoSolare = p.anno_inizio + i;
    const nuoviClienti = nuoviPerAnno[i];
    portafoglio = Math.round(portafoglio * (1 - p.churn / 100)) + nuoviClienti;

    const ricaviSetup = nuoviClienti * p.setup;
    const ricaviRinnovi = Math.max(0, portafoglio - nuoviClienti) * p.rinnovo;
    const ricaviSviluppi = portafoglio * p.svilpercl * (p.tariffa * p.oresvil);
    const ricaviPacchetti = portafoglio * mrr * 12;
    const fatturato = ricaviSetup + ricaviRinnovi + ricaviSviluppi + ricaviPacchetti;

    const fisco = calcFisco(fatturato, annoSolare, p);
    const costiPacchettiAnnui = portafoglio * (p.adoz / 100) * p.vocipercl * costoVarMedioVoce * 12;
    const netto = fisco.netto - (costiAzAnnui + techStackAnnuo + costiPacchettiAnnui);

    const breakEven = breakEvenReale({
      vivere: p.vivere,
      costiAzAnnui: costiAzAnnui + techStackAnnuo + costiPacchettiAnnui,
      annoSolare,
      ateco: p.ateco,
      aliq_inps: p.aliq_inps,
      anno_inizio: p.anno_inizio,
    });

    anni.push({
      anno,
      annoSolare,
      aliqImp: aliquotaImpostaAnno(annoSolare, p.anno_inizio),
      nuoviClienti,
      portafoglio,
      ricaviSetup,
      ricaviRinnovi,
      ricaviSviluppi,
      ricaviPacchetti,
      fatturato,
      fisco,
      costiAzAnnui,
      techStackAnnuo,
      costiPacchettiAnnui,
      netto,
      breakEven,
      progressoBreakEven: breakEven > 0 ? fatturato / breakEven : 0,
      superaBreakEven: fatturato >= breakEven,
    });
  }

  return anni;
}

/** KPI di sintesi mostrati in cima al tab Parametri, incluso il semaforo di transizione. */
export function calcKpiParametri(anni: AnnoProiezione[], parametri: Parametri): KpiParametri {
  const anno1 = anni[0];
  const fatturatoMinimo = anno1.breakEven;
  const setupNecessari = parametri.setup > 0 ? Math.ceil(fatturatoMinimo / parametri.setup) : 0;
  const nettoAnno1 = anno1.netto;

  const nettoMensileTarget = parametri.vivere - parametri.stipendio;
  const nettoMensileAnno1 = nettoAnno1 / 12;
  const gapMensile = nettoMensileTarget - nettoMensileAnno1;

  const runwayMesi = gapMensile > 0 && parametri.riserva > 0 ? parametri.riserva : parametri.riserva;

  let semaforo: Semaforo = "verde";
  if (gapMensile > 0) {
    const sogliaArancio = nettoMensileTarget * 0.3;
    semaforo = gapMensile <= sogliaArancio ? "arancio" : "rosso";
  }

  return { semaforo, fatturatoMinimo, setupNecessari, runwayMesi, nettoAnno1, gapMensile };
}
