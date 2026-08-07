# Calcolatore Sostenibilità Economica

Web app per pianificare la crescita di un portafoglio clienti da freelance in regime forfettario: proiezioni a 4 anni, LTV cliente, pacchetti ricorrenti, tech stack e fiscalità — con persistenza su Supabase, senza login.

## Stack

React + Vite + TypeScript, Tailwind CSS v4, Supabase (Postgres), deploy su Vercel.

## Setup locale

```bash
npm install
cp .env.example .env   # inserisci URL e anon key del tuo progetto Supabase
npm run dev
```

## Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Apri l'SQL editor ed esegui `supabase/migration.sql` per creare le tabelle (`parametri`, `costi`, `moduli`, `pacchetti`, `stack`).
3. Copia `Project URL` e `anon public key` nel file `.env` come `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Se le variabili d'ambiente non sono configurate, o Supabase non è raggiungibile, l'app funziona comunque in **modalità offline**: usa i valori di default e mantiene i dati solo in memoria per la sessione corrente (non persistiti).

### Nota sulla sicurezza dei dati

Non c'è un vero login: ogni dispositivo genera un UUID casuale (`device_id`) salvato in `localStorage` e usato per isolare i propri dati. Le policy RLS in Supabase sono aperte (chiunque abbia la anon key può leggere/scrivere qualunque `device_id`); l'isolamento è quindi "by obscurity", adeguato per un tool interno a basso rischio ma non per dati sensibili. Per condividere i dati tra due dispositivi, basta copiare il valore di `calcolatore_device_id` dal `localStorage` del primo dispositivo a quello del secondo.

## Deploy su Vercel

1. Collega il repository GitHub a un nuovo progetto Vercel.
2. Aggiungi le environment variable `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nelle impostazioni del progetto Vercel.
3. Ogni push crea automaticamente un preview deploy.

## Struttura del progetto

```
src/
  hooks/
    useDeviceId.ts        UUID del dispositivo (localStorage)
    useSupabase.ts         client Supabase + funzioni CRUD
    useCalcolatore.ts      stato globale + calcoli derivati
  components/
    tabs/                  le 7 sezioni dell'app
    ui/                     componenti generici (KpiCard, PannelloEdit, Slider, ...)
  lib/
    calcoli.ts              formule di calcolo (fiscalità, proiezioni, break-even)
    defaults.ts             valori di default
    types.ts                tipi condivisi
supabase/
  migration.sql             schema del database
```

## Script

- `npm run dev` — sviluppo locale
- `npm run build` — build di produzione (type-check + bundle)
- `npm run preview` — anteprima della build
- `npm run lint` — lint con oxlint
