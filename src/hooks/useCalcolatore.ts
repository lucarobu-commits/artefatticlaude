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

  // Caricamento iniziale dei dati del device da Supabase, con fallback offline sui default.
  useEffect(() => {
    let annullato = false;

    async function carica() {
      if (!supabaseConfigurato) {
        setOffline(true);
        setStatoSync("offline");
        setCaricato(true);
        return;
      }

      try {
        const dati = await fetchDatiDevice(deviceId);
        if (annullato) return;

        const primoAccesso = dati.parametri === null;

        setParametri(dati.parametri ?? { ...DEFAULT_PARAMETRI, device_id: deviceId });
        setCosti(primoAccesso ? conDeviceId(DEFAULT_COSTI, deviceId) : dati.costi);
        setModuli(primoAccesso ? conDeviceId(DEFAULT_MODULI, deviceId) : dati.moduli);
        setPacchetti(primoAccesso ? conDeviceId(DEFAULT_PACCHETTI, deviceId) : dati.pacchetti);
        setStack(primoAccesso ? conDeviceId(DEFAULT_STACK, deviceId) : dati.stack);

        setOffline(false);
        setStatoSync("sincronizzato");
        setCaricato(true);

        if (primoAccesso) {
          // Semina i valori di default sul primo accesso, best-effort (non blocca la UI).
          void seminaDefault(deviceId);
        }
      } catch {
        if (annullato) return;
        setOffline(true);
        setStatoSync("offline");
        setCaricato(true);
      }
    }

    async function seminaDefault(id: string) {
      try {
        await upsertParametri({ ...DEFAULT_PARAMETRI, device_id: id });
        await Promise.all([
          ...conDeviceId<Costo>(DEFAULT_COSTI, id).map((r) => salvaRiga("costi", r)),
          ...conDeviceId<Modulo>(DEFAULT_MODULI, id).map((r) => salvaRiga("moduli", r)),
          ...conDeviceId<Pacchetto>(DEFAULT_PACCHETTI, id).map((r) => salvaRiga("pacchetti", r)),
          ...conDeviceId<StrumentoStack>(DEFAULT_STACK, id).map((r) => salvaRiga("stack", r)),
        ]);
      } catch {
        // Nessun dato locale a rischio: si riproverà al prossimo salvataggio esplicito dell'utente.
      }
    }

    carica();
    return () => {
      annullato = true;
    };
  }, [deviceId]);

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
