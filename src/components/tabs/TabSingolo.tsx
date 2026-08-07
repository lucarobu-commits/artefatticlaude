import { useMemo, useState } from "react";
import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { Modulo } from "../../lib/types";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { Sezione, Insight } from "../ui/Sezione";
import { Slider } from "../ui/Slider";
import { euro, percento } from "../../lib/format";

const CAMPI_MODULO: Parameters<typeof PannelloEdit<Modulo>>[0]["campi"] = [
  { chiave: "nome", tipo: "testo", etichetta: "Nome voce", principale: true },
  { chiave: "ore", tipo: "numero", etichetta: "Ore", min: 0, step: 0.5 },
];

export function TabSingolo({ calc }: { calc: Calcolatore }) {
  const { parametri, moduli, salva, elimina } = calc;

  const moduliL1 = useMemo(() => moduli.filter((m) => m.livello === "L1"), [moduli]);
  const moduliL2 = useMemo(() => moduli.filter((m) => m.livello === "L2"), [moduli]);
  const oreL1 = useMemo(() => moduliL1.reduce((s, m) => s + m.ore, 0), [moduliL1]);
  const oreL2 = useMemo(() => moduliL2.reduce((s, m) => s + m.ore, 0), [moduliL2]);

  const [orizzonteAnni, setOrizzonteAnni] = useState(3);

  const costoOreL1 = oreL1 * parametri.tariffa;
  const costoOreL2 = oreL2 * parametri.tariffa;
  const margineL1 = parametri.prezzo_l1 > 0 ? ((parametri.prezzo_l1 - costoOreL1) / parametri.prezzo_l1) * 100 : 0;
  const margineL2 = parametri.prezzo_l2 > 0 ? ((parametri.prezzo_l2 - costoOreL2) / parametri.prezzo_l2) * 100 : 0;

  const evoluzionePerAnno = (parametri.adoz_evoluzione / 100) * parametri.prezzo_evoluzione;

  const righeOrizzonte = useMemo(() => {
    const righe: { anno: number; l1: number; l2: number }[] = [];
    let cumulL1 = parametri.prezzo_l1;
    let cumulL2 = parametri.prezzo_l2;
    righe.push({ anno: 1, l1: cumulL1, l2: cumulL2 });
    for (let anno = 2; anno <= orizzonteAnni; anno++) {
      cumulL1 += evoluzionePerAnno;
      cumulL2 += evoluzionePerAnno;
      righe.push({ anno, l1: cumulL1, l2: cumulL2 });
    }
    return righe;
  }, [orizzonteAnni, parametri.prezzo_l1, parametri.prezzo_l2, evoluzionePerAnno]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Livello 1 vs Livello 2 — marginalità</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Confronta i due pacchetti: quanto costano in ore interne rispetto al prezzo, e quanto valgono nel tempo
          considerando le Evoluzioni future.
        </p>
      </div>

      <PannelloEdit<Modulo>
        titolo="Voci incluse — Livello 1"
        righe={moduliL1}
        campi={CAMPI_MODULO}
        nuovaRiga={() => ({ id: crypto.randomUUID(), device_id: parametri.device_id, nome: "", ore: 0, livello: "L1" })}
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

      <PannelloEdit<Modulo>
        titolo="Voci incluse — Livello 2"
        righe={moduliL2}
        campi={CAMPI_MODULO}
        nuovaRiga={() => ({ id: crypto.randomUUID(), device_id: parametri.device_id, nome: "", ore: 0, livello: "L2" })}
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

      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          etichetta="Livello 1"
          valore={euro(parametri.prezzo_l1)}
          sottotitolo={`${oreL1}h interne · costo ${euro(costoOreL1)}`}
          tono={margineL1 >= 40 ? "verde" : margineL1 >= 15 ? "arancio" : "rosso"}
        />
        <KpiCard
          etichetta="Livello 2"
          valore={euro(parametri.prezzo_l2)}
          sottotitolo={`${oreL2}h interne · costo ${euro(costoOreL2)}`}
          tono={margineL2 >= 40 ? "verde" : margineL2 >= 15 ? "arancio" : "rosso"}
        />
        <KpiCard etichetta="Margine L1" valore={percento(margineL1)} tono={margineL1 >= 40 ? "verde" : margineL1 >= 15 ? "arancio" : "rosso"} />
        <KpiCard etichetta="Margine L2" valore={percento(margineL2)} tono={margineL2 >= 40 ? "verde" : margineL2 >= 15 ? "arancio" : "rosso"} />
      </div>

      <Sezione titolo="Valore nel tempo" descrizione="Quanto vale un cliente L1 o L2 su più anni, includendo le Evoluzioni attese.">
        <Slider etichetta="Orizzonte" valore={orizzonteAnni} min={1} max={6} step={1} suffisso=" anni" onChange={setOrizzonteAnni} />
      </Sezione>

      <div className="rounded-[9px] border border-border bg-surface p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Valore cumulato — L1 vs L2</h3>
        <table className="w-full text-xs min-w-[320px]">
          <thead>
            <tr className="border-b border-border text-ink-soft">
              <th className="py-2 pr-2 text-left font-medium">Anno</th>
              <th className="py-2 px-2 text-right font-medium">Livello 1</th>
              <th className="py-2 pl-2 text-right font-medium">Livello 2</th>
            </tr>
          </thead>
          <tbody>
            {righeOrizzonte.map((r) => (
              <tr key={r.anno} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-2">Anno {r.anno}</td>
                <td className="py-2 px-2 text-right tabular-nums">{euro(r.l1)}</td>
                <td className="py-2 pl-2 text-right tabular-nums font-medium">{euro(r.l2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-ink-soft leading-snug">
          Dal 2° anno, ogni cliente vale in media {euro(evoluzionePerAnno)}/anno in più grazie alle Evoluzioni ({percento(parametri.adoz_evoluzione)} di probabilità × {euro(parametri.prezzo_evoluzione)}).
        </p>
      </div>

      {margineL1 < 15 && (
        <Insight>
          Il margine su Livello 1 è basso ({percento(margineL1)}): le {oreL1}h stimate costano quasi quanto il prezzo.
          Valuta di alzare il prezzo L1 o snellire le voci incluse.
        </Insight>
      )}
      {margineL2 < 15 && (
        <Insight>
          Il margine su Livello 2 è basso ({percento(margineL2)}): le {oreL2}h stimate costano quasi quanto il prezzo.
          Valuta di alzare il prezzo L2 o rivedere lo scope (formazione, bonus agenti).
        </Insight>
      )}
    </div>
  );
}
