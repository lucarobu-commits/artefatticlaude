import { useState } from "react";
import { useCalcolatore } from "./hooks/useCalcolatore";
import { TabParametri } from "./components/tabs/TabParametri";
import { TabAnnoPerAnno } from "./components/tabs/TabAnnoPerAnno";
import { TabSingolo } from "./components/tabs/TabSingolo";
import { TabStack } from "./components/tabs/TabStack";
import { TabFiscalita } from "./components/tabs/TabFiscalita";
import { TabCosti } from "./components/tabs/TabCosti";

const TABS = [
  { id: "parametri", etichetta: "Parametri" },
  { id: "anni", etichetta: "Anno per anno" },
  { id: "singolo", etichetta: "L1 vs L2" },
  { id: "stack", etichetta: "Tech stack" },
  { id: "fiscalita", etichetta: "Fiscalità" },
  { id: "costi", etichetta: "Costi fissi" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function IndicatoreSync({ stato }: { stato: "sincronizzato" | "sincronizzazione" | "offline" | "errore" }) {
  if (stato === "sincronizzato") return null;
  const config = {
    sincronizzazione: { testo: "Salvataggio…", classe: "text-ink-soft" },
    offline: { testo: "Modalità offline — dati salvati solo su questo dispositivo", classe: "text-orange" },
    errore: { testo: "Sync non riuscita — riprovo al prossimo salvataggio", classe: "text-red" },
  }[stato];
  return <div className={`text-center text-xs py-1.5 px-4 bg-surface border-b border-border ${config.classe}`}>{config.testo}</div>;
}

function App() {
  const calc = useCalcolatore();
  const [tabAttivo, setTabAttivo] = useState<TabId>("parametri");

  if (!calc.caricato) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg text-ink-soft text-sm">
        Caricamento…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="px-4 pt-3.5 pb-1">
          <h1 className="text-[15px] font-bold text-ink leading-tight">Sostenibilità economica</h1>
          <p className="text-[11px] text-ink-soft">Pianifica la transizione verso l'attività in proprio</p>
        </div>
        <nav className="flex overflow-x-auto no-scrollbar px-2" aria-label="Sezioni">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabAttivo(tab.id)}
              className={`shrink-0 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
                tabAttivo === tab.id ? "border-accent text-accent" : "border-transparent text-ink-soft"
              }`}
              aria-current={tabAttivo === tab.id ? "page" : undefined}
            >
              {tab.etichetta}
            </button>
          ))}
        </nav>
      </header>

      <IndicatoreSync stato={calc.statoSync} />

      <main className="flex-1 px-4 py-4 max-w-3xl w-full mx-auto">
        {tabAttivo === "parametri" && <TabParametri calc={calc} />}
        {tabAttivo === "anni" && <TabAnnoPerAnno calc={calc} />}
        {tabAttivo === "singolo" && <TabSingolo calc={calc} />}
        {tabAttivo === "stack" && <TabStack calc={calc} />}
        {tabAttivo === "fiscalita" && <TabFiscalita calc={calc} />}
        {tabAttivo === "costi" && <TabCosti calc={calc} onVaiStack={() => setTabAttivo("stack")} />}
      </main>

      <footer className="text-center text-[11px] text-ink-soft py-4">
        Device ID: {calc.deviceId.slice(0, 8)}… · dati collegati a questo dispositivo
      </footer>
    </div>
  );
}

export default App;
