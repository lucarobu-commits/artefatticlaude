import type { AnnoProiezione, CalcoloFiscale, KpiParametri, Parametri, Semaforo, StrumentoStack } from "./types";

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
}

/**
 * Proiezione a 4 anni dei progetti erogati e dei ricavi.
 * Servizio a progetto (una tantum): Livello 1, Livello 2, ed Evoluzione — quest'ultima colpisce
 * ogni anno una % del parco clienti già serviti negli anni precedenti (non i nuovi dell'anno,
 * che devono ancora completare il progetto iniziale prima di poter richiedere un'Evoluzione).
 * Di chi avvia il percorso Evoluzione, solo una % (conv_evoluzione) converte in fatturato pagato:
 * il resto è lavoro svolto ma non fatturato, tracciato a parte in `evoluzioniNonPagate`.
 * Nota: il brief espone solo 3 slider di acquisizione per livello (Anno 1/2/3); l'Anno 4 assume
 * lo stesso ritmo di acquisizione dell'Anno 3 (regime "a velocità di crociera").
 */
export function calcAnni(dati: DatiProiezione): AnnoProiezione[] {
  const { parametri: p, costiAzAnnui, techStackAnnuo } = dati;
  const nuoviL1PerAnno = [p.n1_l1, p.n2_l1, p.n3_l1, p.n3_l1];
  const nuoviL2PerAnno = [p.n1_l2, p.n2_l2, p.n3_l2, p.n3_l2];

  let portafoglio = 0;
  const anni: AnnoProiezione[] = [];

  for (let i = 0; i < 4; i++) {
    const anno = i + 1;
    const annoSolare = p.anno_inizio + i;
    const nuoviL1 = nuoviL1PerAnno[i];
    const nuoviL2 = nuoviL2PerAnno[i];
    const portafoglioPrecedente = portafoglio;
    portafoglio = portafoglioPrecedente + nuoviL1 + nuoviL2;

    const ricaviL1 = nuoviL1 * p.prezzo_l1;
    const ricaviL2 = nuoviL2 * p.prezzo_l2;
    const percorsiEvoluzione = portafoglioPrecedente * (p.adoz_evoluzione / 100);
    const evoluzioniPagate = percorsiEvoluzione * (p.conv_evoluzione / 100);
    const evoluzioniNonPagate = percorsiEvoluzione - evoluzioniPagate;
    const ricaviEvoluzione = evoluzioniPagate * p.prezzo_evoluzione;
    const fatturato = ricaviL1 + ricaviL2 + ricaviEvoluzione;

    const fisco = calcFisco(fatturato, annoSolare, p);
    const netto = fisco.netto - (costiAzAnnui + techStackAnnuo);

    const breakEven = breakEvenReale({
      vivere: p.vivere,
      costiAzAnnui: costiAzAnnui + techStackAnnuo,
      annoSolare,
      ateco: p.ateco,
      aliq_inps: p.aliq_inps,
      anno_inizio: p.anno_inizio,
    });

    anni.push({
      anno,
      annoSolare,
      aliqImp: aliquotaImpostaAnno(annoSolare, p.anno_inizio),
      nuoviL1,
      nuoviL2,
      portafoglio,
      ricaviL1,
      ricaviL2,
      ricaviEvoluzione,
      percorsiEvoluzione,
      evoluzioniNonPagate,
      fatturato,
      fisco,
      costiAzAnnui,
      techStackAnnuo,
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
  const progettiL2Necessari = parametri.prezzo_l2 > 0 ? Math.ceil(fatturatoMinimo / parametri.prezzo_l2) : 0;
  const nettoAnno1 = anno1.netto;

  const nettoMensileTarget = parametri.vivere - parametri.stipendio;
  const nettoMensileAnno1 = nettoAnno1 / 12;
  const gapMensile = nettoMensileTarget - nettoMensileAnno1;

  const runwayMesi = parametri.riserva;

  let semaforo: Semaforo = "verde";
  if (gapMensile > 0) {
    const sogliaArancio = nettoMensileTarget * 0.3;
    semaforo = gapMensile <= sogliaArancio ? "arancio" : "rosso";
  }

  return { semaforo, fatturatoMinimo, progettiL2Necessari, runwayMesi, nettoAnno1, gapMensile };
}
