import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { AnnoProiezione } from "../../lib/types";
import { BarraProgresso } from "../ui/BarraProgresso";
import { euro, euroCompatto, numero, percento } from "../../lib/format";

function CardAnno({ anno }: { anno: AnnoProiezione }) {
  return (
    <div
      className={`min-w-[240px] sm:min-w-0 rounded-[9px] border p-4 flex flex-col gap-3 ${
        anno.superaBreakEven ? "border-green bg-green-soft" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Anno {anno.anno}</span>
        <span className="text-xs text-ink-soft">{anno.annoSolare} · forf. {percento(anno.aliqImp * 100)}</span>
      </div>

      <div>
        <div className="text-[21px] font-bold leading-tight">{euroCompatto(anno.netto)}</div>
        <div className="text-xs text-ink-soft">netto annuo</div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <span className="text-ink-soft">Progetti erogati (tot.)</span>
        <span className="text-right font-medium">{anno.portafoglio}</span>
        <span className="text-ink-soft">Nuovi L1 / L2</span>
        <span className="text-right font-medium">
          +{anno.nuoviL1} / +{anno.nuoviL2}
        </span>
        <span className="text-ink-soft">Fatturato</span>
        <span className="text-right font-medium">{euroCompatto(anno.fatturato)}</span>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-ink-soft mb-1">
          <span>Verso break-even</span>
          <span>{percento(Math.min(999, anno.progressoBreakEven * 100))}</span>
        </div>
        <BarraProgresso valore={anno.progressoBreakEven} />
      </div>

      {anno.superaBreakEven && <div className="text-xs font-medium text-green">✓ Break-even raggiunto</div>}
    </div>
  );
}

function RigaTabella({ etichetta, valori, formato = euro }: { etichetta: string; valori: number[]; formato?: (n: number) => string }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-3 text-ink-soft whitespace-nowrap">{etichetta}</td>
      {valori.map((v, i) => (
        <td key={i} className="py-2 px-2 text-right tabular-nums">
          {formato(v)}
        </td>
      ))}
    </tr>
  );
}

export function TabAnnoPerAnno({ calc }: { calc: Calcolatore }) {
  const { anni } = calc;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Proiezione a 4 anni</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Portafoglio, ricavi e netto anno per anno, con l'aliquota forfettaria applicata automaticamente (5% nei primi 5
          anni dall'apertura P.IVA, poi 15%).
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-4 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {anni.map((a) => (
          <CardAnno key={a.anno} anno={a} />
        ))}
      </div>

      <div className="rounded-[9px] border border-border bg-surface p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Dettaglio per fonte di ricavo</h3>
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3 text-left font-medium text-ink-soft">Voce</th>
              {anni.map((a) => (
                <th key={a.anno} className="py-2 px-2 text-right font-medium text-ink-soft">
                  Anno {a.anno}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <RigaTabella etichetta="Ricavi Livello 1" valori={anni.map((a) => a.ricaviL1)} />
            <RigaTabella etichetta="Ricavi Livello 2" valori={anni.map((a) => a.ricaviL2)} />
            <RigaTabella etichetta="Ricavi Evoluzione" valori={anni.map((a) => a.ricaviEvoluzione)} />
            <RigaTabella
              etichetta="Evoluzioni non pagate"
              valori={anni.map((a) => a.evoluzioniNonPagate)}
              formato={(n) => (n > 0 ? `${numero(n)} progetti` : "—")}
            />
            <RigaTabella etichetta="Fatturato totale" valori={anni.map((a) => a.fatturato)} />
            <RigaTabella etichetta="Imposta + INPS" valori={anni.map((a) => a.fisco.imposta + a.fisco.contributi)} />
            <RigaTabella etichetta="Costi aziendali + stack" valori={anni.map((a) => a.costiAzAnnui + a.techStackAnnuo)} />
            <RigaTabella etichetta="Netto" valori={anni.map((a) => a.netto)} />
            <RigaTabella etichetta="Fatturato break-even" valori={anni.map((a) => a.breakEven)} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
