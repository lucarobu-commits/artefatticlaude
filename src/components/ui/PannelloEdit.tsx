import { useEffect, useRef, useState, type ReactNode } from "react";

export interface OpzioneSelect {
  valore: string;
  etichetta: string;
}

export interface CampoConfig<T> {
  chiave: Extract<keyof T, string>;
  tipo: "testo" | "numero" | "select";
  etichetta: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  opzioni?: OpzioneSelect[] | ((riga: T) => OpzioneSelect[]);
  /** Campo principale (es. "nome"): va full-width su mobile e riceve il focus dopo l'aggiunta. */
  principale?: boolean;
}

interface PannelloEditProps<T extends { id: string; device_id: string }> {
  titolo: string;
  righe: T[];
  campi: CampoConfig<T>[];
  nuovaRiga: () => T;
  onSalva: (daSalvare: T[], daEliminare: string[]) => void | Promise<void>;
  renderLettura?: (riga: T) => ReactNode;
  /** Editor aggiuntivo per contenuto annidato (es. i piani di uno strumento tech stack). */
  contenutoExtra?: (riga: T, aggiorna: (patch: Partial<T>) => void) => ReactNode;
  vuoto?: string;
}

function valoreCampo<T>(riga: T, chiave: Extract<keyof T, string>, tipo: CampoConfig<T>["tipo"]): string {
  const v = riga[chiave];
  if (tipo === "numero") return String(v ?? 0);
  return String(v ?? "");
}

export function PannelloEdit<T extends { id: string; device_id: string }>({
  titolo,
  righe,
  campi,
  nuovaRiga,
  onSalva,
  renderLettura,
  contenutoExtra,
  vuoto = "Nessuna voce. Usa “+ Modifica” per aggiungerne una.",
}: PannelloEditProps<T>) {
  const [aperto, setAperto] = useState(false);
  const [righeLocali, setRigheLocali] = useState<T[]>([]);
  const [eliminate, setEliminate] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const refs = useRef<Record<string, Record<string, HTMLInputElement | HTMLSelectElement | null>>>({});

  useEffect(() => {
    if (!focusId) return;
    const campoPrincipale = campi.find((c) => c.principale)?.chiave;
    if (!campoPrincipale) return;
    const el = refs.current[focusId]?.[campoPrincipale];
    el?.focus();
    setFocusId(null);
  }, [focusId, righeLocali, campi]);

  function apri() {
    setRigheLocali(righe.map((r) => ({ ...r })));
    setEliminate(new Set());
    refs.current = {};
    setAperto(true);
  }

  function annulla() {
    setAperto(false);
    setRigheLocali([]);
    setEliminate(new Set());
    refs.current = {};
  }

  function aggiungi() {
    const riga = nuovaRiga();
    setRigheLocali((prev) => [...prev, riga]);
    setFocusId(riga.id);
  }

  function rimuovi(id: string) {
    const eraOriginale = righe.some((r) => r.id === id);
    if (eraOriginale) setEliminate((prev) => new Set(prev).add(id));
    setRigheLocali((prev) => prev.filter((r) => r.id !== id));
  }

  function aggiornaRigaLocale(id: string, patch: Partial<T>) {
    setRigheLocali((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function salva() {
    setSalvando(true);
    const daSalvare = righeLocali.map((riga) => {
      const finale = { ...riga };
      const refRiga = refs.current[riga.id] ?? {};
      for (const campo of campi) {
        const el = refRiga[campo.chiave];
        if (!el) continue;
        const valore = el.value;
        (finale as any)[campo.chiave] = campo.tipo === "numero" ? Number(valore) || 0 : valore;
      }
      return finale;
    });
    await onSalva(daSalvare, Array.from(eliminate));
    setSalvando(false);
    setAperto(false);
    refs.current = {};
  }

  return (
    <div className="rounded-[9px] border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{titolo}</h3>
        {!aperto && (
          <button
            type="button"
            onClick={apri}
            className="text-xs font-medium text-accent hover:underline shrink-0 min-h-[32px] px-1"
          >
            ✎ Modifica
          </button>
        )}
      </div>

      {!aperto && (
        <div className="border-t border-border">
          {righe.length === 0 && <p className="px-4 py-4 text-sm text-ink-soft">{vuoto}</p>}
          {righe.map((riga) => (
            <div key={riga.id} className="border-b border-border last:border-b-0 px-4 py-2.5">
              {renderLettura ? (
                renderLettura(riga)
              ) : (
                <span className="text-sm">{valoreCampo(riga, campi[0]?.chiave, "testo")}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {aperto && (
        <div className="animate-slide-down border-t-[1.5px] border-accent bg-accent-soft">
          <div className="p-3 flex flex-col gap-2">
            {righeLocali.length === 0 && (
              <p className="text-sm text-ink-soft px-1 py-2">Nessuna voce ancora. Aggiungine una qui sotto.</p>
            )}
            {righeLocali.map((riga) => (
              <div key={riga.id} className="rounded-lg bg-surface border border-border p-2.5">
                <div className="flex flex-wrap gap-2 items-center">
                  {campi.map((campo) => {
                    const opzioni = typeof campo.opzioni === "function" ? campo.opzioni(riga) : campo.opzioni;
                    const larghezza = campo.principale ? "flex-1 basis-full sm:basis-auto min-w-[140px]" : "w-24 shrink-0";
                    return (
                      <div key={campo.chiave} className={larghezza}>
                        {campo.tipo === "select" ? (
                          <select
                            ref={(el) => {
                              refs.current[riga.id] ??= {};
                              refs.current[riga.id][campo.chiave] = el;
                            }}
                            defaultValue={valoreCampo(riga, campo.chiave, campo.tipo)}
                            className="w-full min-h-[44px] rounded-md border border-border bg-surface px-2 text-sm"
                          >
                            {(opzioni ?? []).map((o) => (
                              <option key={o.valore} value={o.valore}>
                                {o.etichetta}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            ref={(el) => {
                              refs.current[riga.id] ??= {};
                              refs.current[riga.id][campo.chiave] = el;
                            }}
                            type={campo.tipo === "numero" ? "number" : "text"}
                            defaultValue={valoreCampo(riga, campo.chiave, campo.tipo)}
                            placeholder={campo.placeholder ?? campo.etichetta}
                            min={campo.min}
                            max={campo.max}
                            step={campo.step ?? (campo.tipo === "numero" ? 1 : undefined)}
                            aria-label={campo.etichetta}
                            className="w-full min-h-[44px] rounded-md border border-border bg-surface px-2.5 text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => rimuovi(riga.id)}
                    aria-label={`Elimina ${titolo}`}
                    className="ml-auto shrink-0 h-11 w-11 grid place-items-center rounded-md text-red hover:bg-red-soft text-lg"
                  >
                    &times;
                  </button>
                </div>
                {contenutoExtra && (
                  <div className="mt-2">{contenutoExtra(riga, (patch) => aggiornaRigaLocale(riga.id, patch))}</div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={aggiungi}
              className="min-h-[44px] rounded-lg border-2 border-dashed border-accent/40 text-accent text-sm font-medium hover:bg-accent-soft"
            >
              + Aggiungi voce
            </button>
          </div>

          <div className="flex gap-2 justify-end px-3 pb-3">
            <button
              type="button"
              onClick={annulla}
              className="min-h-[44px] px-4 rounded-md border border-border bg-surface text-sm font-medium"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={salva}
              disabled={salvando}
              className="min-h-[44px] px-4 rounded-md bg-accent text-white text-sm font-medium disabled:opacity-60"
            >
              {salvando ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
