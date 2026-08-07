import type { Calcolatore } from "../../hooks/useCalcolatore";
import type { Pacchetto } from "../../lib/types";
import { mrrPerCliente } from "../../lib/calcoli";
import { KpiCard } from "../ui/KpiCard";
import { PannelloEdit } from "../ui/PannelloEdit";
import { Sezione } from "../ui/Sezione";
import { Slider } from "../ui/Slider";
import { euro, percento } from "../../lib/format";

export function TabPacchetti({ calc }: { calc: Calcolatore }) {
  const { parametri, aggiornaParametro, pacchetti, salva, elimina, prezzoMedioVoce, costoVarMedioVoce, oreMedieVoce, anni } = calc;

  const mrrMedio = mrrPerCliente(parametri, prezzoMedioVoce);
  const costoMedio = (parametri.adoz / 100) * parametri.vocipercl * costoVarMedioVoce;
  const margineNetto = mrrMedio > 0 ? ((mrrMedio - costoMedio) / mrrMedio) * 100 : 0;
  const oreMedioPerCliente = (parametri.adoz / 100) * parametri.vocipercl * oreMedieVoce;

  const portafoglioAnno1 = anni[0]?.portafoglio ?? 0;
  const oreTotaliMese = portafoglioAnno1 * oreMedioPerCliente;
  const ricaviAnno4 = anni[3]?.ricaviPacchetti ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Pacchetti ricorrenti à la carte</h2>
        <p className="text-xs text-ink-soft leading-snug">
          Voci mensili aggiuntive (hosting, aggiornamenti, supporto…) che i clienti possono attivare oltre al piano base.
        </p>
      </div>

      <PannelloEdit<Pacchetto>
        titolo="Voci disponibili"
        righe={pacchetti}
        campi={[
          { chiave: "nome", tipo: "testo", etichetta: "Nome voce", principale: true },
          { chiave: "prezzo", tipo: "numero", etichetta: "€/mese", min: 0, step: 1 },
          { chiave: "ore_mese", tipo: "numero", etichetta: "Ore tue/mese", min: 0, step: 0.5 },
          { chiave: "costo_var", tipo: "numero", etichetta: "Costo var. €", min: 0, step: 1 },
        ]}
        nuovaRiga={() => ({
          id: crypto.randomUUID(),
          device_id: parametri.device_id,
          nome: "",
          prezzo: 0,
          ore_mese: 0,
          costo_var: 0,
        })}
        onSalva={async (daSalvare, daEliminare) => {
          for (const r of daSalvare) await salva("pacchetti", r);
          for (const id of daEliminare) await elimina("pacchetti", id);
        }}
        renderLettura={(p) => (
          <div className="flex justify-between text-sm gap-2">
            <span className="flex-1 min-w-0 truncate">{p.nome}</span>
            <span className="text-ink-soft whitespace-nowrap shrink-0">
              {euro(p.prezzo)}/mese · {p.ore_mese}h · costo {euro(p.costo_var)}
            </span>
          </div>
        )}
      />

      <Sezione titolo="Adozione" descrizione="Quanti clienti attivano pacchetti extra, e quanti in media.">
        <Slider
          etichetta="Clienti che attivano almeno 1 voce"
          valore={parametri.adoz}
          min={0}
          max={100}
          suffisso=" %"
          onChange={(v) => aggiornaParametro("adoz", v)}
        />
        <Slider
          etichetta="Voci medie per cliente attivo"
          valore={parametri.vocipercl}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => aggiornaParametro("vocipercl", v)}
        />
      </Sezione>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard etichetta="MRR medio per cliente" valore={euro(mrrMedio)} />
        <KpiCard
          etichetta="Margine netto"
          valore={percento(margineNetto)}
          tono={margineNetto >= 50 ? "verde" : margineNetto >= 20 ? "arancio" : "rosso"}
        />
        <KpiCard
          etichetta="Ore tue/mese"
          valore={`${oreTotaliMese.toLocaleString("it-IT", { maximumFractionDigits: 1 })} h`}
          sottotitolo={`con ${portafoglioAnno1} clienti (Anno 1)`}
        />
        <KpiCard etichetta="Proiezione Anno 4" valore={euro(ricaviAnno4)} sottotitolo="ricavi da pacchetti" />
      </div>
    </div>
  );
}
