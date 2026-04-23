-- Control Pan — Schema
-- Ejecutar en: https://supabase.com/dashboard/project/hofhgqkitfmjobqqhacp/sql/new

create table if not exists locales (
  id       bigint primary key generated always as identity,
  nombre   text    not null unique,
  precio   numeric not null,
  estado   text    not null default 'ACTIVO',
  contacto text    default ''
);

create table if not exists salidas (
  id         bigint primary key generated always as identity,
  fecha      date    not null,
  local      text    not null,
  kg         numeric not null,
  precio     numeric not null,
  deuda      numeric not null,
  comment    text    default '',
  unidad     text    not null default 'kg',
  created_at timestamptz default now()
);

create table if not exists pagos (
  id         bigint primary key generated always as identity,
  fecha      date    not null,
  local      text    not null,
  monto      numeric not null,
  forma      text    not null default 'EFECTIVO',
  comment    text    default '',
  created_at timestamptz default now()
);

-- Deshabilitar RLS (app de uso privado/interno)
alter table locales disable row level security;
alter table salidas disable row level security;
alter table pagos   disable row level security;

-- Agregar columna unidad si la tabla ya existe
alter table salidas add column if not exists unidad text not null default 'kg';
