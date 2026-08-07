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
  const setupInPiu = Math.max(1, Math.ceil((kpi.gapMensile * 12) / (parametri.setup || 1)));
  if (kpi.semaforo === "arancio") {
    return `Ti mancano circa ${euro(kpi.gapMensile)} al mese per coprire le spese nell'Anno 1. Bastano ${setupInPiu} setup in più all'anno, o un piccolo aumento della tariffa/rinnovo, per chiudere il gap.`;
  }
  return `Il gap mensile è di ${euro(kpi.gapMensile)}: il piano attuale non sostiene la transizione nell'Anno 1. Valuta più setup all'anno (${setupInPiu}+), un prezzo di setup più alto, o allunga i tempi mantenendo il lavoro dipendente più a lungo.`;
}

export function TabParametri({ calc }: { calc: Calcolatore }) {
  const { parametri, aggiornaParametro, kpi } = calc;

  return (
    <div className="flex flex-col gap-4">
      <Semaforo stato={kpi.semaforo} dettaglio={generaDettaglioSemaforo(calc)} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard etichetta="Fatturato minimo" valore={euroCompatto(kpi.fatturatoMinimo)} sottotitolo="per anno, per vivere" />
        <KpiCard etichetta="Setup necessari" valore={numero(kpi.setupNecessari)} sottotitolo="all'anno" />
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

      <Sezione titolo="Pricing" descrizione="Quanto fatturi per ogni cliente, nel tempo.">
        <Slider
          etichetta="Setup medio"
          valore={parametri.setup}
          min={500}
          max={3000}
          step={50}
          suffisso=" €"
          onChange={(v) => aggiornaParametro("setup", v)}
        />
        <Slider
          etichetta="Rinnovo annuale"
          valore={parametri.rinnovo}
          min={50}
          max={600}
          step={10}
          suffisso=" €"
          onChange={(v) => aggiornaParametro("rinnovo", v)}
        />
        <Slider
          etichetta="Tariffa oraria"
          valore={parametri.tariffa}
          min={30}
          max={120}
          step={5}
          suffisso=" €/h"
          onChange={(v) => aggiornaParametro("tariffa", v)}
        />
        <Slider
          etichetta="Ore per sviluppo extra"
          valore={parametri.oresvil}
          min={1}
          max={20}
          step={1}
          suffisso=" h"
          onChange={(v) => aggiornaParametro("oresvil", v)}
        />
      </Sezione>

      <Sezione titolo="Acquisizione clienti" descrizione="Quanti nuovi clienti prevedi di acquisire ogni anno.">
        <Slider etichetta="Nuovi setup — Anno 1" valore={parametri.n1} min={0} max={30} onChange={(v) => aggiornaParametro("n1", v)} />
        <Slider etichetta="Nuovi setup — Anno 2" valore={parametri.n2} min={0} max={30} onChange={(v) => aggiornaParametro("n2", v)} />
        <Slider etichetta="Nuovi setup — Anno 3" valore={parametri.n3} min={0} max={30} onChange={(v) => aggiornaParametro("n3", v)} />
        <Slider
          etichetta="Sviluppi extra per cliente/anno"
          valore={parametri.svilpercl}
          min={0}
          max={3}
          step={0.1}
          onChange={(v) => aggiornaParametro("svilpercl", v)}
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
        <Slider
          etichetta="Churn clienti"
          valore={parametri.churn}
          min={0}
          max={30}
          suffisso=" %"
          aiuto="% di clienti che perdi ogni anno (mancato rinnovo)."
          onChange={(v) => aggiornaParametro("churn", v)}
        />
      </Sezione>

      <Insight>{generaInsight(calc)}</Insight>
    </div>
  );
}
