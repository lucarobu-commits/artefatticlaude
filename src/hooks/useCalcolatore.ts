import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { getDeviceId } from "./useDeviceId";
import {
  eliminaRiga,
  fetchDatiDevice,
  salvaRiga,
  supabaseConfigurato,
  upsertParametri,
} from "./useSupabase";
import {
  DEFAULT_COSTI,
  DEFAULT_MODULI,
  DEFAULT_PACCHETTI,
  DEFAULT_PARAMETRI,
  DEFAULT_STACK,
} from "../lib/defaults";
import { leggiCache, salvaCache, type CacheDati } from "../lib/localCache";
import {
  calcAnni,
  calcKpiParametri,
  costiAnnuiTotali,
  mediePacchetti,
  stackAnnuoTotale,
  stackMensileTotale,
} from "../lib/calcoli";
import type { Costo, Modulo, Pacchetto, Parametri, StrumentoStack } from "../lib/types";

type Tabella = "costi" | "moduli" | "pacchetti" | "stack";
type StatoSync = "sincronizzato" | "sincronizzazione" | "offline" | "errore";

function conDeviceId<T extends { id: string }>(righe: Omit<T, "device_id">[], deviceId: string): T[] {
  return righe.map((r) => ({ ...r, device_id: deviceId }) as unknown as T);
}

export function useCalcolatore() {
  const deviceId = useMemo(() => getDeviceId(), []);

  const [parametri, setParametri] = useState<Parametri>({ ...DEFAULT_PARAMETRI, device_id: deviceId });
  const [costi, setCosti] = useState<Costo[]>(conDeviceId(DEFAULT_COSTI, deviceId));
  const [moduli, setModuli] = useState<Modulo[]>(conDeviceId(DEFAULT_MODULI, deviceId));
  const [pacchetti, setPacchetti] = useState<Pacchetto[]>(conDeviceId(DEFAULT_PACCHETTI, deviceId));
  const [stack, setStack] = useState<StrumentoStack[]>(conDeviceId(DEFAULT_STACK, deviceId));

  const [caricato, setCaricato] = useState(false);
  const [offline, setOffline] = useState(!supabaseConfigurato);
  const [statoSync, setStatoSync] = useState<StatoSync>(supabaseConfigurato ? "sincronizzazione" : "offline");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primoCaricamento = useRef(true);

  // Caricamento iniziale: Supabase se configurato e raggiungibile, altrimenti la cache
  // locale di questo dispositivo (localStorage), altrimenti i valori di default.
  // La cache locale ha sempre la precedenza sui default "vuoti", così le modifiche fatte
  // su questo dispositivo non vengono mai perse — né al refresh, né collegando Supabase in un secondo momento.
  useEffect(() => {
    let annullato = false;
    const cache = leggiCache();

    function applicaCache(c: CacheDati) {
      setParametri({ ...c.parametri, device_id: deviceId });
      setCosti(c.costi.map((r) => ({ ...r, device_id: deviceId })));
      setModuli(c.moduli.map((r) => ({ ...r, device_id: deviceId })));
      setPacchetti(c.pacchetti.map((r) => ({ ...r, device_id: deviceId })));
      setStack(c.stack.map((r) => ({ ...r, device_id: deviceId })));
    }

    async function carica() {
      if (!supabaseConfigurato) {
        if (cache) applicaCache(cache);
        setOffline(true);
        setStatoSync("offline");
        setCaricato(true);
        return;
      }

      try {
        const dati = await fetchDatiDevice(deviceId);
        if (annullato) return;

        const primoAccesso = dati.parametri === null;

        const parametriIniziali = dati.parametri ?? cache?.parametri ?? { ...DEFAULT_PARAMETRI, device_id: deviceId };
        const costiIniziali = primoAccesso ? (cache?.costi ?? conDeviceId(DEFAULT_COSTI, deviceId)) : dati.costi;
        const moduliIniziali = primoAccesso ? (cache?.moduli ?? conDeviceId(DEFAULT_MODULI, deviceId)) : dati.moduli;
        const pacchettiIniziali = primoAccesso ? (cache?.pacchetti ?? conDeviceId(DEFAULT_PACCHETTI, deviceId)) : dati.pacchetti;
        const stackIniziale = primoAccesso ? (cache?.stack ?? conDeviceId(DEFAULT_STACK, deviceId)) : dati.stack;

        setParametri(parametriIniziali);
        setCosti(costiIniziali);
        setModuli(moduliIniziali);
        setPacchetti(pacchettiIniziali);
        setStack(stackIniziale);

        setOffline(false);
        setStatoSync("sincronizzato");
        setCaricato(true);

        if (primoAccesso) {
          // Primo collegamento di questo dispositivo a Supabase: semina il cloud con la cache
          // locale se esiste (preserva le modifiche già fatte offline), altrimenti con i default.
          void seminaIniziale({
            parametri: parametriIniziali,
            costi: costiIniziali,
            moduli: moduliIniziali,
            pacchetti: pacchettiIniziali,
            stack: stackIniziale,
          });
        }
      } catch {
        if (annullato) return;
        if (cache) applicaCache(cache);
        setOffline(true);
        setStatoSync("offline");
        setCaricato(true);
      }
    }

    async function seminaIniziale(dati: CacheDati) {
      try {
        await upsertParametri(dati.parametri);
        await Promise.all([
          ...dati.costi.map((r) => salvaRiga("costi", r)),
          ...dati.moduli.map((r) => salvaRiga("moduli", r)),
          ...dati.pacchetti.map((r) => salvaRiga("pacchetti", r)),
          ...dati.stack.map((r) => salvaRiga("stack", r)),
        ]);
      } catch {
        // Nessun dato locale a rischio: si riproverà al prossimo salvataggio esplicito dell'utente.
      }
    }

    carica();
    return () => {
      annullato = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // Specchio locale di tutti i dati (indipendente da Supabase): garantisce che nessuna
  // modifica su questo dispositivo vada persa tra un refresh e l'altro. Debounce breve per
  // non scrivere su localStorage ad ogni tick durante il trascinamento di uno slider.
  const primoSalvataggioCache = useRef(true);
  const debounceCacheRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!caricato) return;
    if (primoSalvataggioCache.current) {
      primoSalvataggioCache.current = false;
      return;
    }
    if (debounceCacheRef.current) clearTimeout(debounceCacheRef.current);
    debounceCacheRef.current = setTimeout(() => {
      salvaCache({ parametri, costi, moduli, pacchetti, stack });
    }, 300);
    return () => {
      if (debounceCacheRef.current) clearTimeout(debounceCacheRef.current);
    };
  }, [caricato, parametri, costi, moduli, pacchetti, stack]);

  // Upsert dei parametri con debounce 800ms per non saturare Supabase durante il drag degli slider.
  useEffect(() => {
    if (!caricato || !supabaseConfigurato) return;
    if (primoCaricamento.current) {
      primoCaricamento.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatoSync("sincronizzazione");
    debounceRef.current = setTimeout(async () => {
      try {
        await upsertParametri(parametri);
        setStatoSync("sincronizzato");
        setOffline(false);
      } catch {
        setStatoSync("errore");
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parametri, caricato]);

  const aggiornaParametro = useCallback(<K extends keyof Parametri>(chiave: K, valore: Parametri[K]) => {
    setParametri((p) => ({ ...p, [chiave]: valore }));
  }, []);

  const setter: Record<Tabella, Dispatch<SetStateAction<any[]>>> = {
    costi: setCosti,
    moduli: setModuli,
    pacchetti: setPacchetti,
    stack: setStack,
  };

  const salva = useCallback(
    async <T extends { id: string; device_id: string }>(tabella: Tabella, riga: T) => {
      setter[tabella]((righe: T[]) => {
        const esiste = righe.some((r) => r.id === riga.id);
        return esiste ? righe.map((r) => (r.id === riga.id ? riga : r)) : [...righe, riga];
      });
      if (!supabaseConfigurato) return;
      try {
        setStatoSync("sincronizzazione");
        await salvaRiga(tabella, riga);
        setStatoSync("sincronizzato");
      } catch {
        setStatoSync("errore");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const elimina = useCallback(async (tabella: Tabella, id: string) => {
    setter[tabella]((righe: { id: string }[]) => righe.filter((r) => r.id !== id));
    if (!supabaseConfigurato) return;
    try {
      setStatoSync("sincronizzazione");
      await eliminaRiga(tabella, id);
      setStatoSync("sincronizzato");
    } catch {
      setStatoSync("errore");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const costiAzAnnui = useMemo(() => costiAnnuiTotali(costi), [costi]);
  const techStackMensile = useMemo(() => stackMensileTotale(stack), [stack]);
  const techStackAnnuo = useMemo(() => stackAnnuoTotale(stack), [stack]);
  const { prezzoMedio, costoVarMedio, oreMedie } = useMemo(() => mediePacchetti(pacchetti), [pacchetti]);

  const anni = useMemo(
    () =>
      calcAnni({
        parametri,
        costiAzAnnui,
        techStackAnnuo,
        prezzoMedioVoce: prezzoMedio,
        costoVarMedioVoce: costoVarMedio,
      }),
    [parametri, costiAzAnnui, techStackAnnuo, prezzoMedio, costoVarMedio]
  );

  const kpi = useMemo(() => calcKpiParametri(anni, parametri), [anni, parametri]);

  return {
    deviceId,
    caricato,
    offline,
    statoSync,
    parametri,
    aggiornaParametro,
    costi,
    moduli,
    pacchetti,
    stack,
    salva,
    elimina,
    costiAzAnnui,
    techStackMensile,
    techStackAnnuo,
    prezzoMedioVoce: prezzoMedio,
    costoVarMedioVoce: costoVarMedio,
    oreMedieVoce: oreMedie,
    anni,
    kpi,
  };
}

export type Calcolatore = ReturnType<typeof useCalcolatore>;
