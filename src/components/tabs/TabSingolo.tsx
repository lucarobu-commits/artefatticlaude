import { useMemo, useState } from "react";
import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { Modulo } from "../../lib/types";
import { calcFisco } from "../../lib/calcoli";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { Sezione, Insight } from "../ui/Sezione";
import { Slider } from "../ui/Slider";
import { euro, percento } from "../../lib/format";

export function TabSingolo({ calc }: { calc: Calcolatore }) {
  const { parametri, moduli, salva, elimina } = calc;

  const oreModuliTotali = useMemo(() => moduli.reduce((s, m) => s + m.ore, 0), [moduli]);

  const [setupProposto, setSetupProposto] = useState(parametri.setup);
  const [oreStimate, setOreStimate] = useState(oreModuliTotali || 20);
  const [anniVita, setAnniVita] = useState(3);
  const [sviluppiExtraAnno, setSviluppiExtraAnno] = useState(parametri.svilpercl);

  const costoOreSetup = oreStimate * parametri.tariffa;
  const margineSetup = setupProposto > 0 ? ((setupProposto - costoOreSetup) / setupProposto) * 100 : 0;

  const righeAnni = useMemo(() => {
    const righe: { anno: number; ricavoSetup: number; ricavoRinnovo: number; ricavoSviluppi: number; totale: number; netto: number }[] = [];
    for (let i = 0; i < anniVita; i++) {
      const annoSolare = parametri.anno_inizio + i;
      const ricavoSetup = i === 0 ? setupProposto : 0;
      const ricavoRinnovo = i === 0 ? 0 : parametri.rinnovo;
      const ricavoSviluppi = sviluppiExtraAnno * (parametri.tariffa * parametri.oresvil);
      const totale = ricavoSetup + ricavoRinnovo + ricavoSviluppi;
      const fisco = calcFisco(totale, annoSolare, parametri);
      righe.push({ anno: i + 1, ricavoSetup, ricavoRinnovo, ricavoSviluppi, totale, netto: fisco.netto });
    }
    return righe;
  }, [anniVita, setupProposto, sviluppiExtraAnno, parametri]);

  const ltvTotale = righeAnni.reduce((s, r) => s + r.totale, 0);
  const ltvNetto = righeAnni.reduce((s, r) => s + r.netto, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Valore di un singolo cliente (LTV)</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Simula il ciclo di vita di un cliente tipo: setup iniziale, rinnovi e sviluppi extra negli anni successivi.
        </p>
      </div>

      <PannelloEdit<Modulo>
        titolo="Moduli inclusi nel setup"
        righe={moduli}
        campi={[
          { chiave: "nome", tipo: "testo", etichetta: "Nome modulo", principale: true },
          { chiave: "ore", tipo: "numero", etichetta: "Ore", min: 0, step: 0.5 },
        ]}
        nuovaRiga={() => ({ id: crypto.randomUUID(), device_id: parametri.device_id, nome: "", ore: 0 })}
        onSalva={async (daSalvare, daEliminare) => {
          for (const r of daSalvare) await salva("moduli", r);
          for (const id of daEliminare) await elimina("moduli", id);
        }}
        renderLettura={(m) => (
          <div className="flex justify-between text-sm">
            <span>{m.nome}</span>
            <span className="text-ink-soft">{m.ore} h</span>
          </div>
        )}
      />

      <Sezione titolo="Parametri del cliente simulato">
        <Slider etichetta="Setup proposto" valore={setupProposto} min={500} max={3000} step={50} suffisso=" €" onChange={setSetupProposto} />
        <Slider etichetta="Ore stimate di sviluppo" valore={oreStimate} min={0} max={100} step={1} suffisso=" h" onChange={setOreStimate} />
        <Slider etichetta="Anni di vita del cliente" valore={anniVita} min={1} max={10} step={1} onChange={setAnniVita} />
        <Slider etichetta="Sviluppi extra all'anno" valore={sviluppiExtraAnno} min={0} max={3} step={0.1} onChange={setSviluppiExtraAnno} />
      </Sezione>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard etichetta={`LTV totale (${anniVita} anni)`} valore={euro(ltvTotale)} sottotitolo={`netto: ${euro(ltvNetto)}`} />
        <KpiCard
          etichetta="Margine sul setup"
          valore={percento(margineSetup)}
          sottotitolo={`costo ore: ${euro(costoOreSetup)}`}
          tono={margineSetup >= 40 ? "verde" : margineSetup >= 15 ? "arancio" : "rosso"}
        />
      </div>

      <div className="rounded-[9px] border border-border bg-surface p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Setup → rinnovi → sviluppi → netto</h3>
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="border-b border-border text-ink-soft">
              <th className="py-2 pr-2 text-left font-medium">Anno</th>
              <th className="py-2 px-2 text-right font-medium">Setup</th>
              <th className="py-2 px-2 text-right font-medium">Rinnovo</th>
              <th className="py-2 px-2 text-right font-medium">Sviluppi</th>
              <th className="py-2 px-2 text-right font-medium">Fatturato</th>
              <th className="py-2 pl-2 text-right font-medium">Netto</th>
            </tr>
          </thead>
          <tbody>
            {righeAnni.map((r) => (
              <tr key={r.anno} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-2">Anno {r.anno}</td>
                <td className="py-2 px-2 text-right tabular-nums">{r.ricavoSetup ? euro(r.ricavoSetup) : "—"}</td>
                <td className="py-2 px-2 text-right tabular-nums">{r.ricavoRinnovo ? euro(r.ricavoRinnovo) : "—"}</td>
                <td className="py-2 px-2 text-right tabular-nums">{r.ricavoSviluppi ? euro(r.ricavoSviluppi) : "—"}</td>
                <td className="py-2 px-2 text-right tabular-nums font-medium">{euro(r.totale)}</td>
                <td className="py-2 pl-2 text-right tabular-nums">{euro(r.netto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {margineSetup < 15 && (
        <Insight>
          Il margine sul setup è basso ({percento(margineSetup)}): il prezzo copre a malapena le ore di lavoro. Valuta di
          alzare il setup proposto o ridurre le ore stimate scomponendo meglio i moduli.
        </Insight>
      )}
      {margineSetup >= 15 && margineSetup < 40 && (
        <Insight>
          Margine nella media ({percento(margineSetup)}). C'è spazio per alzare leggermente il prezzo di setup senza
          perdere competitività.
        </Insight>
      )}
    </div>
  );
}
