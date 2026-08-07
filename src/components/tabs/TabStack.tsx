import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { PianoStack, StrumentoStack } from "../../lib/types";
import { pianoAttivo } from "../../lib/calcoli";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { euro, percento } from "../../lib/format";

function EditorPiani({ piani, onCambia }: { piani: PianoStack[]; onCambia: (piani: PianoStack[]) => void }) {
  function aggiorna(id: string, patch: Partial<PianoStack>) {
    onCambia(piani.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function rimuovi(id: string) {
    onCambia(piani.filter((p) => p.id !== id));
  }
  function aggiungi() {
    onCambia([...piani, { id: crypto.randomUUID(), nome: "", prezzo: 0 }]);
  }

  return (
    <div className="border-t border-border pt-2 mt-1">
      <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wide mb-1.5">Piani disponibili</p>
      <div className="flex flex-col gap-1.5">
        {piani.map((p) => (
          <div key={p.id} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={p.nome}
              onChange={(e) => aggiorna(p.id, { nome: e.target.value })}
              placeholder="Nome piano"
              className="flex-1 min-w-0 min-h-[38px] rounded-md border border-border bg-surface px-2 text-sm"
            />
            <input
              type="number"
              value={p.prezzo}
              onChange={(e) => aggiorna(p.id, { prezzo: Number(e.target.value) || 0 })}
              placeholder="€/mese"
              min={0}
              className="w-20 shrink-0 min-h-[38px] rounded-md border border-border bg-surface px-2 text-sm"
            />
            <button
              type="button"
              onClick={() => rimuovi(p.id)}
              aria-label="Elimina piano"
              className="shrink-0 h-9 w-9 grid place-items-center rounded-md text-red hover:bg-red-soft text-base"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={aggiungi}
          className="min-h-[38px] rounded-md border border-dashed border-accent/40 text-accent text-xs font-medium hover:bg-accent-soft"
        >
          + Aggiungi piano
        </button>
      </div>
    </div>
  );
}

export function TabStack({ calc }: { calc: Calcolatore }) {
  const { parametri, stack, salva, elimina, techStackMensile, techStackAnnuo, costiAzAnnui } = calc;

  const costiFissiMensili = costiAzAnnui / 12 + techStackMensile;
  const percentualeSuFissi = costiFissiMensili > 0 ? (techStackMensile / costiFissiMensili) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Tech stack</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Gli strumenti che usi per gestire l'attività. Il costo del piano attivo si somma automaticamente ai costi fissi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard etichetta="Stack/mese" valore={euro(techStackMensile)} />
        <KpiCard etichetta="Stack/anno" valore={euro(techStackAnnuo)} />
        <KpiCard etichetta="% costi fissi" valore={percento(percentualeSuFissi)} />
      </div>

      <PannelloEdit<StrumentoStack>
        titolo="Strumenti"
        righe={stack}
        campi={[
          { chiave: "nome", tipo: "testo", etichetta: "Nome strumento", principale: true },
          {
            chiave: "piano_attivo",
            tipo: "select",
            etichetta: "Piano attivo",
            opzioni: (riga) => riga.piani.map((p) => ({ valore: p.id, etichetta: `${p.nome || "—"} · ${euro(p.prezzo)}` })),
          },
        ]}
        nuovaRiga={() => {
          const idPiano = crypto.randomUUID();
          return {
            id: crypto.randomUUID(),
            device_id: parametri.device_id,
            nome: "",
            piano_attivo: idPiano,
            piani: [{ id: idPiano, nome: "Free", prezzo: 0 }],
          };
        }}
        onSalva={async (daSalvare, daEliminare) => {
          for (const r of daSalvare) await salva("stack", r);
          for (const id of daEliminare) await elimina("stack", id);
        }}
        renderLettura={(s) => {
          const attivo = pianoAttivo(s);
          return (
            <div className="flex justify-between text-sm gap-2">
              <span className="flex-1 min-w-0 truncate">{s.nome}</span>
              <span className="text-ink-soft whitespace-nowrap shrink-0">
                {attivo?.nome ?? "—"} · {euro(attivo?.prezzo ?? 0)}/mese
              </span>
            </div>
          );
        }}
        contenutoExtra={(riga, aggiorna) => (
          <EditorPiani piani={riga.piani} onCambia={(piani) => aggiorna({ piani })} />
        )}
      />
    </div>
  );
}
