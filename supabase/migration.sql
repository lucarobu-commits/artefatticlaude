-- Calcolatore Sostenibilità Economica — schema Supabase
-- Esegui questo file nell'SQL editor del progetto Supabase prima del primo deploy.

create extension if not exists "pgcrypto";

create table if not exists parametri (
  device_id uuid primary key,
  setup numeric not null default 1500,
  rinnovo numeric not null default 200,
  tariffa numeric not null default 60,
  oresvil numeric not null default 4,
  n1 numeric not null default 4,
  n2 numeric not null default 8,
  n3 numeric not null default 14,
  svilpercl numeric not null default 0.5,
  vivere numeric not null default 1900,
  riserva numeric not null default 5,
  stipendio numeric not null default 0,
  churn numeric not null default 5,
  adoz numeric not null default 60,
  vocipercl numeric not null default 1.5,
  ateco numeric not null default 67,
  aliq_imp numeric not null default 5,
  aliq_inps numeric not null default 26.1,
  anno_inizio integer not null default 2025,
  simfatt numeric not null default 3000,
  updated_at timestamptz not null default now()
);

create table if not exists costi (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  nome text not null default '',
  importo numeric not null default 0,
  freq text not null default 'mese' check (freq in ('mese', 'anno'))
);
create index if not exists costi_device_id_idx on costi (device_id);

create table if not exists moduli (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  nome text not null default '',
  ore numeric not null default 0
);
create index if not exists moduli_device_id_idx on moduli (device_id);

create table if not exists pacchetti (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  nome text not null default '',
  prezzo numeric not null default 0,
  ore_mese numeric not null default 0,
  costo_var numeric not null default 0
);
create index if not exists pacchetti_device_id_idx on pacchetti (device_id);

create table if not exists stack (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  nome text not null default '',
  piano_attivo text not null default '',
  piani jsonb not null default '[]'::jsonb
);
create index if not exists stack_device_id_idx on stack (device_id);

-- Row Level Security: l'app non usa un login, quindi non esiste un utente autenticato
-- (auth.uid()) da confrontare con device_id. L'isolamento tra dispositivi è applicato
-- lato client filtrando sempre per device_id (un UUID casuale generato localmente),
-- non è un vero controllo di sicurezza server-side. Chiunque conosca (o indovini) un
-- device_id può leggerne/scriverne i dati tramite la anon key. Va bene per un tool
-- interno a basso rischio; se in futuro servisse isolamento reale, aggiungere Supabase
-- Auth e sostituire queste policy con controlli su auth.uid().
alter table parametri enable row level security;
alter table costi enable row level security;
alter table moduli enable row level security;
alter table pacchetti enable row level security;
alter table stack enable row level security;

create policy "accesso anon completo" on parametri for all using (true) with check (true);
create policy "accesso anon completo" on costi for all using (true) with check (true);
create policy "accesso anon completo" on moduli for all using (true) with check (true);
create policy "accesso anon completo" on pacchetti for all using (true) with check (true);
create policy "accesso anon completo" on stack for all using (true) with check (true);
