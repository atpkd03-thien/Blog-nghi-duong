-- Project landing content migration V18
alter table public.projects add column if not exists potential_description text;

create table if not exists public.project_places (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section text not null default 'amenity' check (section in ('amenity','connection','travel')),
  name text not null,
  category text not null default 'Tiện ích',
  travel_minutes integer,
  distance_km numeric(8,2),
  note text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_places_project_idx on public.project_places(project_id,section,sort_order,created_at);
alter table public.project_places enable row level security;

-- Public visitors can only see content belonging to published projects.
drop policy if exists "public read project places" on public.project_places;
create policy "public read project places" on public.project_places for select to public
using (exists (select 1 from public.projects p where p.id=project_places.project_id and p.status='published'));

-- Authenticated staff can manage landing content. Restrict further to admin/editor if desired.
drop policy if exists "staff manage project places" on public.project_places;
create policy "staff manage project places" on public.project_places for all to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

-- Tổng quan dự án: nhiều ảnh cho slider, tối đa 12 ảnh được enforced ở giao diện admin.
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_images_project_idx on public.project_images(project_id, sort_order, created_at);
alter table public.project_images enable row level security;
