import type { ReactNode } from "react";

interface SezioneProps {
  titolo: string;
  descrizione?: string;
  children: ReactNode;
}

export function Sezione({ titolo, descrizione, children }: SezioneProps) {
  return (
    <section className="rounded-[9px] border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink">{titolo}</h2>
      {descrizione && <p className="mt-0.5 text-xs text-ink-soft leading-snug">{descrizione}</p>}
      <div className="mt-3.5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Insight({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-accent-soft border border-accent/20 px-3.5 py-3 text-[13px] leading-relaxed text-ink">
      <span className="font-semibold text-accent">💡 </span>
      {children}
    </div>
  );
}
