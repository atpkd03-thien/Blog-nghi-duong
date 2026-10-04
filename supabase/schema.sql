create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,email text,role text not null default 'editor' check(role in ('admin','editor')),created_at timestamptz not null default now());
create table if not exists public.properties(id uuid primary key default gen_random_uuid(),title text not null,location text not null,price text,status text not null default 'draft' check(status in ('draft','published','sold')),description text,image_url text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.tours(id uuid primary key default gen_random_uuid(),title text not null,destination text not null,price text,status text not null default 'draft' check(status in ('draft','published')),description text,image_url text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.leads(id uuid primary key default gen_random_uuid(),name text not null,phone text not null,email text,note text,status text not null default 'new' check(status in ('new','contacted','closed')),created_at timestamptz not null default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin') $$;
alter table public.profiles enable row level security; alter table public.properties enable row level security; alter table public.tours enable row level security; alter table public.leads enable row level security;
create policy "public read published properties" on public.properties for select using(status='published' or auth.uid() is not null);
create policy "admin/editor manage properties" on public.properties for all using(auth.uid() is not null) with check(auth.uid() is not null);
create policy "public read published tours" on public.tours for select using(status='published' or auth.uid() is not null);
create policy "admin/editor manage tours" on public.tours for all using(auth.uid() is not null) with check(auth.uid() is not null);
create policy "staff read leads" on public.leads for select using(auth.uid() is not null);
create policy "public create leads" on public.leads for insert with check(true);
create policy "staff update leads" on public.leads for update using(auth.uid() is not null) with check(auth.uid() is not null);
create policy "users read own profile" on public.profiles for select using(id=auth.uid() or public.is_admin());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,email,role) values(new.id,new.email,'editor'); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
-- Sau khi tạo tài khoản admin đầu tiên, chạy câu dưới và thay email:
-- update public.profiles set role='admin' where email='admin@example.com';
