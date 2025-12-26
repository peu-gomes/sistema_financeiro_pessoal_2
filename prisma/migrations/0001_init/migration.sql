-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Table: Lancamento
create table if not exists "Lancamento" (
  "id" uuid primary key default gen_random_uuid(),
  "data" timestamptz not null,
  "historico" text not null,
  "documento" text,
  "criadoEm" timestamptz default now(),
  "atualizadoEm" timestamptz
);

-- Table: Partida
create table if not exists "Partida" (
  "id" uuid primary key default gen_random_uuid(),
  "contaCodigo" text not null,
  "contaNome" text not null,
  "natureza" text not null,
  "valor" double precision not null,
  "lancamentoId" uuid not null,
  constraint fk_partida_lancamento foreign key ("lancamentoId") references "Lancamento"("id") on delete cascade
);

create index if not exists idx_partida_lancamentoId on "Partida" ("lancamentoId");
