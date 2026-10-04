-- Run this only if the Projects migration has not already been applied.
create table if not exists public.projects(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,location text,description text,image_url text,status text not null default 'draft' check(status in ('draft','published','archived')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.properties add column if not exists project_id uuid references public.projects(id) on delete set null;
create index if not exists properties_project_id_idx on public.properties(project_id);
alter table public.projects enable row level security;
create policy if not exists "public read published projects" on public.projects for select to public using(status='published' or (select auth.uid()) is not null);
create policy if not exists "staff manage projects" on public.projects for all to authenticated using((select auth.uid()) is not null) with check((select auth.uid()) is not null);


-- Website settings (contact + branding)
create table if not exists public.site_settings (id integer primary key default 1 check (id = 1), brand_name text not null default 'TÂN DŨNG SALES', tagline text not null default 'Bất động sản & Du lịch', phone text not null default '0900000000', zalo_url text not null default 'https://zalo.me/0900000000', facebook_url text not null default 'https://facebook.com/', logo_url text, updated_at timestamptz not null default now());
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select to public using (true);
drop policy if exists "admin manage site settings" on public.site_settings;
create policy "admin manage site settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Multiple property images (up to 12 enforced by the admin UI)
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists property_images_property_idx on public.property_images(property_id, sort_order, created_at);
