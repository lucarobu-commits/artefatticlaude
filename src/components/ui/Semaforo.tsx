import type { Semaforo as SemaforoTipo } from "../../lib/types";

const CONFIG: Record<SemaforoTipo, { bg: string; titolo: string }> = {
  verde: { bg: "bg-green", titolo: "Il piano regge: sei in traiettoria di sostenibilità" },
  arancio: { bg: "bg-orange", titolo: "Attenzione: manca poco, ma il gap va colmato" },
  rosso: { bg: "bg-red", titolo: "Il piano attuale non copre le tue spese: rivedi i parametri" },
};

interface SemaforoProps {
  stato: SemaforoTipo;
  dettaglio: string;
}

export function Semaforo({ stato, dettaglio }: SemaforoProps) {
  const cfg = CONFIG[stato];
  return (
    <div className={`w-full rounded-[10px] ${cfg.bg} px-4 py-3.5 text-white shadow-sm`}>
      <div className="text-[15px] font-semibold leading-snug">{cfg.titolo}</div>
      <div className="mt-0.5 text-[13px] opacity-90 leading-snug">{dettaglio}</div>
    </div>
  );
}
