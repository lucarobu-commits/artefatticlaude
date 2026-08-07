import type { ReactNode } from "react";

interface KpiCardProps {
  etichetta: string;
  valore: string;
  sottotitolo?: string;
  tono?: "neutro" | "verde" | "arancio" | "rosso";
  icona?: ReactNode;
}

const TONI: Record<NonNullable<KpiCardProps["tono"]>, string> = {
  neutro: "text-ink",
  verde: "text-green",
  arancio: "text-orange",
  rosso: "text-red",
};

export function KpiCard({ etichetta, valore, sottotitolo, tono = "neutro", icona }: KpiCardProps) {
  return (
    <div className="rounded-[9px] border border-border bg-surface p-4 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-soft">
        {icona}
        <span className="truncate">{etichetta}</span>
      </div>
      <div className={`mt-1.5 text-[21px] sm:text-[22px] font-bold leading-tight ${TONI[tono]}`}>{valore}</div>
      {sottotitolo && <div className="mt-0.5 text-xs text-ink-soft truncate">{sottotitolo}</div>}
    </div>
  );
}
