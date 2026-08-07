import type { Calcolatore } from "../../hooks/useCalcolatore";
import { KpiCard } from "../ui/KpiCard";
import { Semaforo } from "../ui/Semaforo";
import { Sezione, Insight } from "../ui/Sezione";
import { Slider } from "../ui/Slider";
import { euro, euroCompatto, numero } from "../../lib/format";

function generaDettaglioSemaforo(calc: Calcolatore): string {
  const { kpi } = calc;
  if (kpi.semaforo === "verde") return `Margine di ${euro(-kpi.gapMensile)} al mese sopra il fabbisogno.`;
  return `Mancano ${euro(kpi.gapMensile)} al mese per coprire le spese nell'Anno 1.`;
}

function generaInsight(calc: Calcolatore): string {
  const { kpi, parametri } = calc;
  if (kpi.semaforo === "verde") {
    return `Con questi parametri copri le spese già nell'Anno 1, con un margine di ${euro(-kpi.gapMensile)} al mese. Puoi permetterti di crescere più lentamente o alzare la riserva.`;
  }
  const l1InPiu = Math.max(1, Math.ceil((kpi.gapMensile * 12) / (parametri.prezzo_l1 || 1)));
  if (kpi.semaforo === "arancio") {
    return `Ti mancano circa ${euro(kpi.gapMensile)} al mese per coprire le spese nell'Anno 1. Bastano ${l1InPiu} progetti Livello 1 in più all'anno (o qualche Livello 2 in più) per chiudere il gap.`;
  }
  return `Il gap mensile è di ${euro(kpi.gapMensile)}: il piano attuale non sostiene la transizione nell'Anno 1. Valuta più progetti all'anno (${l1InPiu}+ Livello 1, o punta su più Livello 2), oppure allunga i tempi mantenendo il lavoro dipendente più a lungo.`;
}

export function TabParametri({ calc }: { calc: Calcolatore }) {
  const { parametri, aggiornaParametro, kpi } = calc;

  return (
    <div className="flex flex-col gap-4">
      <Semaforo stato={kpi.semaforo} dettaglio={generaDettaglioSemaforo(calc)} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard etichetta="Fatturato minimo" valore={euroCompatto(kpi.fatturatoMinimo)} sottotitolo="per anno, per vivere" />
        <KpiCard etichetta="Progetti L2 necessari" valore={numero(kpi.progettiL2Necessari)} sottotitolo="equivalenti, all'anno" />
        <KpiCard etichetta="Runway" valore={`${numero(kpi.runwayMesi)} mesi`} sottotitolo="riserva liquida" />
        <KpiCard
          etichetta="Netto Anno 1"
          valore={euroCompatto(kpi.nettoAnno1)}
          tono={kpi.nettoAnno1 >= 0 ? "verde" : "rosso"}
        />
        <KpiCard
          etichetta="Gap mensile"
          valore={euro(kpi.gapMensile)}
          sottotitolo={kpi.gapMensile <= 0 ? "coperto" : "da colmare"}
          tono={kpi.gapMensile <= 0 ? "verde" : kpi.gapMensile <= parametri.vivere * 0.3 ? "arancio" : "rosso"}
        />
      </div>

      <Sezione titolo="Pricing" descrizione="I tre servizi che offri, tutti a progetto (una tantum).">
        <Slider
          etichetta="Livello 1 — Analisi + file MD"
          valore={parametri.prezzo_l1}
          min={200}
          max={1500}
          step={50}
          suffisso=" €"
          onChange={(v) => aggiornaParametro("prezzo_l1", v)}
        />
        <Slider
          etichetta="Livello 2 — Implementazione completa"
          valore={parametri.prezzo_l2}
          min={800}
          max={5000}
          step={100}
          suffisso=" €"
          onChange={(v) => aggiornaParametro("prezzo_l2", v)}
        />
        <Slider
          etichetta="Evoluzione — prezzo medio a preventivo"
          valore={parametri.prezzo_evoluzione}
          min={200}
          max={3000}
          step={50}
          suffisso=" €"
          aiuto="Il prezzo varia progetto per progetto; questo è il valore medio da usare nelle proiezioni."
          onChange={(v) => aggiornaParametro("prezzo_evoluzione", v)}
        />
      </Sezione>

      <Sezione titolo="Acquisizione — Livello 1" descrizione="Nuovi progetti Livello 1 per anno.">
        <Slider etichetta="Anno 1" valore={parametri.n1_l1} min={0} max={30} onChange={(v) => aggiornaParametro("n1_l1", v)} />
        <Slider etichetta="Anno 2" valore={parametri.n2_l1} min={0} max={30} onChange={(v) => aggiornaParametro("n2_l1", v)} />
        <Slider etichetta="Anno 3 (e successivi)" valore={parametri.n3_l1} min={0} max={30} onChange={(v) => aggiornaParametro("n3_l1", v)} />
      </Sezione>

      <Sezione titolo="Acquisizione — Livello 2" descrizione="Nuovi progetti Livello 2 per anno.">
        <Slider etichetta="Anno 1" valore={parametri.n1_l2} min={0} max={20} onChange={(v) => aggiornaParametro("n1_l2", v)} />
        <Slider etichetta="Anno 2" valore={parametri.n2_l2} min={0} max={20} onChange={(v) => aggiornaParametro("n2_l2", v)} />
        <Slider etichetta="Anno 3 (e successivi)" valore={parametri.n3_l2} min={0} max={20} onChange={(v) => aggiornaParametro("n3_l2", v)} />
      </Sezione>

      <Sezione titolo="Evoluzione progetto" descrizione="Quanti clienti già serviti in passato tornano ogni anno per un'Evoluzione.">
        <Slider
          etichetta="% parco clienti che richiede un'Evoluzione/anno"
          valore={parametri.adoz_evoluzione}
          min={0}
          max={100}
          suffisso=" %"
          onChange={(v) => aggiornaParametro("adoz_evoluzione", v)}
        />
      </Sezione>

      <Sezione titolo="Situazione personale" descrizione="I tuoi numeri per capire quanto sei coperto durante la transizione.">
        <Slider
          etichetta="Spese mensili per vivere"
          valore={parametri.vivere}
          min={500}
          max={5000}
          step={50}
          suffisso=" €"
          onChange={(v) => aggiornaParametro("vivere", v)}
        />
        <Slider
          etichetta="Mesi di riserva"
          valore={parametri.riserva}
          min={0}
          max={24}
          suffisso=" mesi"
          onChange={(v) => aggiornaParametro("riserva", v)}
        />
        <Slider
          etichetta="Reddito da lavoro dipendente"
          valore={parametri.stipendio}
          min={0}
          max={3000}
          step={50}
          suffisso=" €/mese"
          aiuto="Se lavori ancora come dipendente durante la transizione, riduce il gap da coprire con l'attività."
          onChange={(v) => aggiornaParametro("stipendio", v)}
        />
      </Sezione>

      <Insight>{generaInsight(calc)}</Insight>
    </div>
  );
}
