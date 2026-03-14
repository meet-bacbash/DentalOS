-- DentalOS schema for Supabase Postgres

create table if not exists users (
  id bigserial primary key,
  email text unique not null,
  full_name text not null,
  hashed_password text not null,
  role text not null check (role in ('admin','provider','front_desk','patient')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists providers (
  id bigserial primary key,
  user_id bigint unique not null references users(id) on delete cascade,
  specialty text,
  npi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patients (
  id bigserial primary key,
  first_name text not null,
  last_name text not null,
  dob date,
  gender text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists insurance (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  provider_name text not null,
  policy_number text not null,
  group_number text,
  coverage_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists medical_history (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  allergies text,
  medications text,
  conditions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_charts (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  chart_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointments (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  provider_id bigint not null references providers(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  status text not null default 'scheduled' check (status in ('scheduled','confirmed','completed','no_show','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists treatments (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  appointment_id bigint references appointments(id) on delete set null,
  code text,
  description text not null,
  estimated_cost numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists treatment_plans (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  plan_data jsonb not null default '{}'::jsonb,
  priority text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists claims (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  treatment_id bigint references treatments(id) on delete set null,
  insurance_id bigint references insurance(id) on delete set null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','submitted','paid','denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  appointment_id bigint references appointments(id) on delete set null,
  amount numeric(10,2) not null,
  method text not null check (method in ('cash','card','insurance')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ehr_notes (
  id bigserial primary key,
  patient_id bigint not null references patients(id) on delete cascade,
  appointment_id bigint references appointments(id) on delete set null,
  subjective text,
  objective text,
  assessment text,
  plan text,
  xray_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  user_id bigint references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
