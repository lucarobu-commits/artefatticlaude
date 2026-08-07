interface BarraProgressoProps {
  valore: number; // 0..1 (può superare 1, viene clampato visivamente)
  colore?: string;
}

function coloreDaValore(valore: number): string {
  if (valore >= 1) return "var(--color-green)";
  if (valore >= 0.6) return "var(--color-accent)";
  if (valore >= 0.3) return "var(--color-orange)";
  return "var(--color-red)";
}

export function BarraProgresso({ valore, colore }: BarraProgressoProps) {
  const percentuale = Math.max(0, Math.min(1, valore)) * 100;
  return (
    <div className="h-[7px] w-full rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={Math.round(percentuale)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${percentuale}%`, background: colore ?? coloreDaValore(valore) }}
      />
    </div>
  );
}
