import { useMemo, useState } from "react";
import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { Modulo } from "../../lib/types";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { Sezione } from "../ui/Sezione";
import { Slider } from "../ui/Slider";
import { euro, percento } from "../../lib/format";

const CAMPI_MODULO: Parameters<typeof PannelloEdit<Modulo>>[0]["campi"] = [
  { chiave: "nome", tipo: "testo", etichetta: "Nome voce", principale: true },
];

export function TabSingolo({ calc }: { calc: Calcolatore }) {
  const { parametri, moduli, salva, elimina } = calc;

  const moduliL1 = useMemo(() => moduli.filter((m) => m.livello === "L1"), [moduli]);
  const moduliL2 = useMemo(() => moduli.filter((m) => m.livello === "L2"), [moduli]);

  const [orizzonteAnni, setOrizzonteAnni] = useState(3);

  const evoluzionePerAnno = (parametri.adoz_evoluzione / 100) * (parametri.conv_evoluzione / 100) * parametri.prezzo_evoluzione;

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
        <h2 className="text-sm font-semibold mb-1">Livello 1 vs Livello 2</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Due servizi a prezzo fisso e scalabili: cosa include ciascuno, e quanto valgono nel tempo considerando le
          Evoluzioni future.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard etichetta="Livello 1" valore={euro(parametri.prezzo_l1)} sottotitolo="prezzo fisso" />
        <KpiCard etichetta="Livello 2" valore={euro(parametri.prezzo_l2)} sottotitolo="prezzo fisso" />
      </div>

      <PannelloEdit<Modulo>
        titolo="Cosa include — Livello 1"
        righe={moduliL1}
        campi={CAMPI_MODULO}
        nuovaRiga={() => ({ id: crypto.randomUUID(), device_id: parametri.device_id, nome: "", livello: "L1" })}
        onSalva={async (daSalvare, daEliminare) => {
          for (const r of daSalvare) await salva("moduli", r);
          for (const id of daEliminare) await elimina("moduli", id);
        }}
        renderLettura={(m) => <div className="text-sm">{m.nome}</div>}
      />

      <PannelloEdit<Modulo>
        titolo="Cosa include — Livello 2"
        righe={moduliL2}
        campi={CAMPI_MODULO}
        nuovaRiga={() => ({ id: crypto.randomUUID(), device_id: parametri.device_id, nome: "", livello: "L2" })}
        onSalva={async (daSalvare, daEliminare) => {
          for (const r of daSalvare) await salva("moduli", r);
          for (const id of daEliminare) await elimina("moduli", id);
        }}
        renderLettura={(m) => <div className="text-sm">{m.nome}</div>}
      />

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
          Dal 2° anno, ogni cliente vale in media {euro(evoluzionePerAnno)}/anno in più grazie alle Evoluzioni pagate
          ({percento(parametri.adoz_evoluzione)} avvia il percorso × {percento(parametri.conv_evoluzione)} converte in
          fatturato × {euro(parametri.prezzo_evoluzione)}).
        </p>
      </div>
    </div>
  );
}
