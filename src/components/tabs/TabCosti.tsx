import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { Costo } from "../../lib/types";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { euro, numero, percento } from "../../lib/format";

const OPZIONI_FREQ = [
  { valore: "mese", etichetta: "Al mese" },
  { valore: "anno", etichetta: "All'anno" },
];

export function TabCosti({ calc, onVaiStack }: { calc: Calcolatore; onVaiStack: () => void }) {
  const { parametri, costi, salva, elimina, costiAzAnnui, techStackMensile, anni } = calc;

  const costiAzMensili = costiAzAnnui / 12;
  const costiOperativiMensili = costiAzMensili + techStackMensile;
  const fatturatoAnno1 = anni[0]?.fatturato ?? 0;
  const fiscoAnno1 = anni[0]?.fisco;
  const fiscalitaMensile = fiscoAnno1 ? (fiscoAnno1.imposta + fiscoAnno1.contributi) / 12 : 0;
  const totaleUsciteMensili = costiOperativiMensili + fiscalitaMensile;
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
        <KpiCard etichetta="Costi operativi/mese" valore={euro(costiOperativiMensili)} sottotitolo={`di cui tech stack ${euro(techStackMensile)}`} />
        <KpiCard etichetta="Fiscalità/mese" valore={euro(fiscalitaMensile)} sottotitolo="dettaglio qui sotto ↓" />
        <KpiCard etichetta="Totale uscite/mese" valore={euro(totaleUsciteMensili)} sottotitolo="operativi + fiscalità" tono="rosso" />
        <KpiCard etichetta="Setup necessari" valore={numero(setupPerCoprire)} sottotitolo="/anno, per pareggiare" />
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
        <h3 className="text-sm font-semibold mb-1">Fiscalità stimata (sola lettura)</h3>
        <p className="text-xs text-ink-soft mb-3">
          Da dove viene: il fatturato previsto per l'Anno 1 (tab "Anno per anno") passa dal coefficiente ATECO e dalle
          aliquote impostate nel tab "Fiscalità". Cambia i parametri lì per aggiornare questa stima.
        </p>
        <div className="rounded-lg border border-border overflow-hidden text-sm">
          <div className="flex justify-between px-3 py-2 border-b border-border">
            <span className="text-ink-soft">Fatturato previsto — Anno 1</span>
            <span className="tabular-nums">{euro(fatturatoAnno1)}</span>
          </div>
          <div className="flex justify-between px-3 py-2 border-b border-border">
            <span className="text-ink-soft">× coefficiente ATECO ({parametri.ateco}%) = imponibile</span>
            <span className="tabular-nums">{euro(fiscoAnno1?.imponibile ?? 0)}</span>
          </div>
          <div className="flex justify-between px-3 py-2 border-b border-border">
            <span className="text-ink-soft">− imposta ({percento((anni[0]?.aliqImp ?? 0) * 100)})</span>
            <span className="tabular-nums text-red">−{euro(fiscoAnno1?.imposta ?? 0)}</span>
          </div>
          <div className="flex justify-between px-3 py-2 border-b border-border">
            <span className="text-ink-soft">− contributi INPS ({parametri.aliq_inps}%)</span>
            <span className="tabular-nums text-orange">−{euro(fiscoAnno1?.contributi ?? 0)}</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-accent-soft font-semibold">
            <span>= totale annuo, diviso 12</span>
            <span className="tabular-nums">{euro(fiscalitaMensile)}/mese</span>
          </div>
        </div>
      </div>
    </div>
  );
}
