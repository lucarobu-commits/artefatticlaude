interface SliderProps {
  etichetta: string;
  valore: number;
  min: number;
  max: number;
  step?: number;
  suffisso?: string;
  aiuto?: string;
  onChange: (valore: number) => void;
}

export function Slider({ etichetta, valore, min, max, step = 1, suffisso = "", aiuto, onChange }: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink">{etichetta}</label>
        <span className="text-sm font-semibold text-accent tabular-nums">
          {valore.toLocaleString("it-IT")}
          {suffisso}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valore}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 h-11"
        aria-label={etichetta}
      />
      <div className="flex justify-between text-[11px] text-ink-soft -mt-1">
        <span>
          {min.toLocaleString("it-IT")}
          {suffisso}
        </span>
        <span>
          {max.toLocaleString("it-IT")}
          {suffisso}
        </span>
      </div>
      {aiuto && <p className="mt-1 text-xs text-ink-soft leading-snug">{aiuto}</p>}
    </div>
  );
}
