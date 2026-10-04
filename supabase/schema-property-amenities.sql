create table if not exists public.property_amenities (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 name text not null,
 category text not null default 'Tiện ích & địa điểm',
 travel_minutes integer,
 distance_km numeric(7,2),
 note text,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists property_amenities_property_idx on public.property_amenities(property_id,sort_order,created_at);
alter table public.property_amenities enable row level security;

alter table public.property_amenities add column if not exists image_url text;
