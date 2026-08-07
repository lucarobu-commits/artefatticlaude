import { useMemo, useState } from "react";
import type { Calcolatore } from "../../hooks/useCalcolatore";
import { ANNI_APERTURA_PIVA, ATECO_OPZIONI } from "../../lib/defaults";
import { Sezione } from "../ui/Sezione";
import { Slider } from "../ui/Slider";
import { BarraProgresso } from "../ui/BarraProgresso";
import { euro, percento } from "../../lib/format";

const INPS_STANDARD = 26.1;

export function TabFiscalita({ calc }: { calc: Calcolatore }) {
  const { parametri, aggiornaParametro } = calc;
  const [inpsPersonalizzata, setInpsPersonalizzata] = useState(parametri.aliq_inps !== INPS_STANDARD);

  const sim = useMemo(() => {
    const fatturatoMensile = parametri.simfatt;
    const imponibile = fatturatoMensile * (parametri.ateco / 100);
    const aliqInps = parametri.aliq_inps / 100;
    const contributi = (imponibile * aliqInps) / (1 + aliqInps * 0.5);
    const imposta = imponibile * (parametri.aliq_imp / 100);
    const netto = fatturatoMensile - imposta - contributi;
    return { fatturatoMensile, imponibile, imposta, contributi, netto };
  }, [parametri.simfatt, parametri.ateco, parametri.aliq_inps, parametri.aliq_imp]);

  const annoCorrente = new Date().getFullYear();
  const anniDaApertura = annoCorrente - parametri.anno_inizio;
  const regimeAttuale = anniDaApertura < 5 ? "agevolato al 5%" : "ordinario forfettario al 15%";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Fiscalità — regime forfettario</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Questi parametri guidano il calcolo automatico dell'imposta in tutte le proiezioni. Sei nel regime{" "}
          <strong>{regimeAttuale}</strong> per l'anno {annoCorrente}.
        </p>
      </div>

      <Sezione titolo="Cassa previdenziale">
        <div>
          <label className="text-sm font-medium text-ink">Contributi</label>
          <select
            value={inpsPersonalizzata ? "custom" : "standard"}
            onChange={(e) => {
              const custom = e.target.value === "custom";
              setInpsPersonalizzata(custom);
              if (!custom) aggiornaParametro("aliq_inps", INPS_STANDARD);
            }}
            className="mt-1.5 w-full min-h-[44px] rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="standard">INPS Gestione Separata — {INPS_STANDARD}%</option>
            <option value="custom">Aliquota personalizzata</option>
          </select>
          {inpsPersonalizzata && (
            <div className="mt-3">
              <Slider
                etichetta="Aliquota contributiva"
                valore={parametri.aliq_inps}
                min={10}
                max={35}
                step={0.1}
                suffisso=" %"
                onChange={(v) => aggiornaParametro("aliq_inps", v)}
              />
            </div>
          )}
        </div>
      </Sezione>

      <Sezione titolo="Coefficiente di redditività ATECO">
        <select
          value={parametri.ateco}
          onChange={(e) => aggiornaParametro("ateco", Number(e.target.value))}
          className="w-full min-h-[44px] rounded-md border border-border bg-surface px-3 text-sm"
        >
          {ATECO_OPZIONI.map((o) => (
            <option key={o.valore} value={o.valore}>
              {o.etichetta}
            </option>
          ))}
        </select>
      </Sezione>

      <Sezione titolo="Apertura P.IVA" descrizione="Determina automaticamente quando passi dal 5% al 15% nelle proiezioni.">
        <select
          value={parametri.anno_inizio}
          onChange={(e) => aggiornaParametro("anno_inizio", Number(e.target.value))}
          className="w-full min-h-[44px] rounded-md border border-border bg-surface px-3 text-sm"
        >
          {ANNI_APERTURA_PIVA.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Sezione>

      <Sezione titolo="Simulatore fatturato mensile" descrizione="Aliquota manuale, indipendente dalla proiezione automatica.">
        <div className="flex gap-2">
          {[5, 15].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => aggiornaParametro("aliq_imp", val)}
              className={`flex-1 min-h-[44px] rounded-md border text-sm font-medium transition-colors ${
                parametri.aliq_imp === val ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-ink-soft"
              }`}
            >
              Imposta {val}%
            </button>
          ))}
        </div>

        <Slider
          etichetta="Fatturato mensile simulato"
          valore={parametri.simfatt}
          min={500}
          max={15000}
          step={100}
          suffisso=" €"
          onChange={(v) => aggiornaParametro("simfatt", v)}
        />

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2.5 px-3 text-ink-soft">Fatturato</td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums">{euro(sim.fatturatoMensile)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 px-3 text-ink-soft">Imponibile</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{euro(sim.imponibile)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 px-3 text-ink-soft">Imposta ({parametri.aliq_imp}%)</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-red">{euro(sim.imposta)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 px-3 text-ink-soft">INPS ({parametri.aliq_inps}%)</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-orange">{euro(sim.contributi)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Netto</td>
                <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-green">{euro(sim.netto)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <div className="flex justify-between text-[11px] text-ink-soft mb-1">
              <span>Imposta</span>
              <span>{percento((sim.imposta / sim.fatturatoMensile) * 100)}</span>
            </div>
            <BarraProgresso valore={sim.imposta / sim.fatturatoMensile} colore="var(--color-red)" />
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-ink-soft mb-1">
              <span>INPS</span>
              <span>{percento((sim.contributi / sim.fatturatoMensile) * 100)}</span>
            </div>
            <BarraProgresso valore={sim.contributi / sim.fatturatoMensile} colore="var(--color-orange)" />
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-ink-soft mb-1">
              <span>Netto</span>
              <span>{percento((sim.netto / sim.fatturatoMensile) * 100)}</span>
            </div>
            <BarraProgresso valore={sim.netto / sim.fatturatoMensile} colore="var(--color-green)" />
          </div>
        </div>
      </Sezione>
    </div>
  );
}
