import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { Costo } from "../../lib/types";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { euro, numero } from "../../lib/format";

const OPZIONI_FREQ = [
  { valore: "mese", etichetta: "Al mese" },
  { valore: "anno", etichetta: "All'anno" },
];

export function TabCosti({ calc, onVaiStack }: { calc: Calcolatore; onVaiStack: () => void }) {
  const { parametri, costi, salva, elimina, costiAzAnnui, techStackMensile, anni } = calc;

  const costiAzMensili = costiAzAnnui / 12;
  const fiscoAnno1 = anni[0]?.fisco;
  const fiscalitaMensile = fiscoAnno1 ? (fiscoAnno1.imposta + fiscoAnno1.contributi) / 12 : 0;
  const totaleUsciteMensili = costiAzMensili + techStackMensile + fiscalitaMensile;
  const setupPerCoprire = parametri.setup > 0 ? Math.ceil((totaleUsciteMensili * 12) / parametri.setup) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Costi fissi e uscite mensili</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Il quadro completo di quanto esce ogni mese: costi aziendali, tech stack e stima fiscale sul fatturato Anno 1.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard etichetta="Costi az./mese" valore={euro(costiAzMensili)} sottotitolo={`incl. tech stack ${euro(techStackMensile)}`} />
        <KpiCard etichetta="Fiscalità/mese" valore={euro(fiscalitaMensile)} sottotitolo="imposta + INPS, Anno 1" />
        <KpiCard etichetta="Totale uscite/mese" valore={euro(totaleUsciteMensili)} tono="rosso" />
        <KpiCard etichetta="Setup necessari" valore={numero(setupPerCoprire)} sottotitolo="all'anno, per coprire tutto" />
      </div>

      <PannelloEdit<Costo>
        titolo="Costi aziendali generici"
        righe={costi}
        campi={[
          { chiave: "nome", tipo: "testo", etichetta: "Nome costo", principale: true },
          { chiave: "importo", tipo: "numero", etichetta: "Importo €", min: 0, step: 1 },
          { chiave: "freq", tipo: "select", etichetta: "Frequenza", opzioni: OPZIONI_FREQ },
        ]}
        nuovaRiga={() => ({ id: crypto.randomUUID(), device_id: parametri.device_id, nome: "", importo: 0, freq: "mese" })}
        onSalva={async (daSalvare, daEliminare) => {
          for (const r of daSalvare) await salva("costi", r);
          for (const id of daEliminare) await elimina("costi", id);
        }}
        renderLettura={(c) => (
          <div className="flex justify-between text-sm">
            <span>{c.nome}</span>
            <span className="text-ink-soft">
              {euro(c.importo)} {c.freq === "mese" ? "/mese" : "/anno"}
            </span>
          </div>
        )}
      />

      <div className="rounded-[9px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Tech stack</h3>
          <button type="button" onClick={onVaiStack} className="text-xs font-medium text-accent hover:underline min-h-[32px] px-1">
            Vai al tab Stack →
          </button>
        </div>
        <p className="text-sm text-ink-soft">
          {euro(techStackMensile)}/mese — gestisci gli strumenti e i piani attivi direttamente nel tab dedicato.
        </p>
      </div>

      <div className="rounded-[9px] border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold mb-2">Fiscalità stimata (sola lettura)</h3>
        <p className="text-xs text-ink-soft mb-3">Calcolata sul fatturato previsto nell'Anno 1 della proiezione.</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-semibold tabular-nums">{euro(fiscoAnno1?.imposta ?? 0)}</div>
            <div className="text-[11px] text-ink-soft">Imposta/anno</div>
          </div>
          <div>
            <div className="text-sm font-semibold tabular-nums">{euro(fiscoAnno1?.contributi ?? 0)}</div>
            <div className="text-[11px] text-ink-soft">INPS/anno</div>
          </div>
          <div>
            <div className="text-sm font-semibold tabular-nums">{euro(fiscalitaMensile)}</div>
            <div className="text-[11px] text-ink-soft">Media/mese</div>
          </div>
        </div>
      </div>
    </div>
  );
}
