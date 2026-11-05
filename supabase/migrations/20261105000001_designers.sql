-- Phase 1: designers, decline history, case studies.
-- Row Level Security is enabled on every table. The public application form
-- never writes directly: it goes through a server action using the service
-- role key, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Admin identity
-- ---------------------------------------------------------------------------
-- The admin is whoever logs in with this email. Set it once after migrating
-- (see README):
--   insert into private.settings (key, value) values ('admin_email', 'you@example.com')
--   on conflict (key) do update set value = excluded.value;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.settings (
  key   text primary key,
  value text not null
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = (
      select lower(value) from private.settings where key = 'admin_email'
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- designers
-- ---------------------------------------------------------------------------
create table public.designers (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid unique references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Set on the first application and again on every reapplication.
  applied_at         timestamptz not null default now(),

  full_name          text not null check (char_length(full_name) between 2 and 120),
  email              text not null unique check (email = lower(email)),
  phone              text check (phone is null or char_length(phone) <= 30),
  linkedin_url       text not null check (char_length(linkedin_url) <= 500),
  portfolio_url      text not null check (char_length(portfolio_url) <= 500),

  display_name       text check (display_name is null or char_length(display_name) <= 120),
  headline           text check (headline is null or char_length(headline) <= 140),
  bio                text check (bio is null or char_length(bio) <= 2000),
  photo_path         text,

  specialty          text not null check (specialty in ('product_design', 'ux_ui', 'web_design', 'brand', 'other')),
  years_experience   text not null check (years_experience in ('0-2', '3-5', '6-9', '10+')),
  product_type       text not null check (product_type in ('desktop', 'mobile', 'both')),
  market             text not null check (market in ('b2b', 'b2c', 'both')),
  platforms          text[] not null default '{}'
                     check (platforms <@ array['figma', 'framer', 'webflow', 'shopify', 'wordpress', 'other']),
  industries         text check (industries is null or char_length(industries) <= 300),

  availability       text not null check (availability in ('actively_looking', 'open_to_offers', 'not_looking')),
  confidential       boolean not null default false,
  show_email         boolean not null default false,
  show_phone         boolean not null default false,

  own_work_confirmed boolean not null check (own_work_confirmed),
  consent            boolean not null check (consent),
  consent_at         timestamptz not null default now(),
  rules_accepted_at  timestamptz,

  warnings           int not null default 0 check (warnings >= 0),

  status             text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reason             text check (reason is null or reason in (
                       'no_process_case_studies', 'outside_focus', 'not_enough_experience',
                       'portfolio_link_broken', 'other')),
  reason_note        text,
  internal_notes     text,
  replied_at         timestamptz,
  approved_at        timestamptz
);

create index designers_waiting_idx on public.designers (applied_at)
  where replied_at is null and status in ('pending', 'declined');
create index designers_status_idx on public.designers (status);

create trigger designers_set_updated_at
  before update on public.designers
  for each row execute function public.set_updated_at();

-- Designers may edit their own profile, but never the fields the admin owns.
-- RLS decides *which rows*; this trigger decides *which columns*.
create or replace function public.protect_designer_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' and not public.is_admin() then
    if new.status            is distinct from old.status
    or new.reason            is distinct from old.reason
    or new.reason_note       is distinct from old.reason_note
    or new.internal_notes    is distinct from old.internal_notes
    or new.replied_at        is distinct from old.replied_at
    or new.approved_at       is distinct from old.approved_at
    or new.applied_at        is distinct from old.applied_at
    or new.warnings          is distinct from old.warnings
    or new.user_id           is distinct from old.user_id
    or new.email             is distinct from old.email
    or new.consent_at        is distinct from old.consent_at
    or new.created_at        is distinct from old.created_at
    then
      raise exception 'Not allowed to change admin-managed fields'
        using errcode = '42501';
    end if;
    -- rules_accepted_at can be set once, by the designer, but not cleared.
    if old.rules_accepted_at is not null and new.rules_accepted_at is distinct from old.rules_accepted_at then
      raise exception 'Rules acceptance cannot be changed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger designers_protect_admin_fields
  before update on public.designers
  for each row execute function public.protect_designer_admin_fields();

alter table public.designers enable row level security;

create policy "designers: owner reads own approved row"
  on public.designers for select to authenticated
  using (user_id = (select auth.uid()) and status = 'approved');

create policy "designers: owner updates own approved row"
  on public.designers for update to authenticated
  using (user_id = (select auth.uid()) and status = 'approved')
  with check (user_id = (select auth.uid()) and status = 'approved');

create policy "designers: admin reads all"
  on public.designers for select to authenticated
  using ((select public.is_admin()));

create policy "designers: admin updates all"
  on public.designers for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- No insert or delete policies: applications and account deletion go
-- through server code with the service role key.

-- ---------------------------------------------------------------------------
-- decline_history: one row per decline email sent
-- ---------------------------------------------------------------------------
create table public.decline_history (
  id            uuid primary key default gen_random_uuid(),
  designer_id   uuid not null references public.designers (id) on delete cascade,
  declined_at   timestamptz not null default now(),
  reason        text not null check (reason in (
                  'no_process_case_studies', 'outside_focus', 'not_enough_experience',
                  'portfolio_link_broken', 'other')),
  reason_note   text,
  linkedin_url  text not null,
  portfolio_url text not null
);

create index decline_history_designer_idx on public.decline_history (designer_id, declined_at desc);

alter table public.decline_history enable row level security;

create policy "decline_history: admin reads all"
  on public.decline_history for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- case_studies
-- ---------------------------------------------------------------------------
create table public.case_studies (
  id            uuid primary key default gen_random_uuid(),
  designer_id   uuid not null references public.designers (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  description   text not null check (char_length(description) <= 3000),
  cover_path    text,
  images        text[] not null default '{}' check (cardinality(images) <= 6),
  external_url  text check (external_url is null or char_length(external_url) <= 500),
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index case_studies_designer_idx on public.case_studies (designer_id, position);

create trigger case_studies_set_updated_at
  before update on public.case_studies
  for each row execute function public.set_updated_at();

-- The approved designer who owns this designers row.
create or replace function public.owns_designer(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.designers d
    where d.id = target
      and d.user_id = (select auth.uid())
      and d.status = 'approved'
  );
$$;

revoke all on function public.owns_designer(uuid) from public;
grant execute on function public.owns_designer(uuid) to authenticated;

alter table public.case_studies enable row level security;

create policy "case_studies: owner reads"
  on public.case_studies for select to authenticated
  using ((select public.owns_designer(designer_id)));

create policy "case_studies: owner inserts"
  on public.case_studies for insert to authenticated
  with check ((select public.owns_designer(designer_id)));

create policy "case_studies: owner updates"
  on public.case_studies for update to authenticated
  using ((select public.owns_designer(designer_id)))
  with check ((select public.owns_designer(designer_id)));

create policy "case_studies: owner deletes"
  on public.case_studies for delete to authenticated
  using ((select public.owns_designer(designer_id)));

create policy "case_studies: admin reads all"
  on public.case_studies for select to authenticated
  using ((select public.is_admin()));

-- Anonymous visitors get nothing from any of these tables.
revoke all on public.designers, public.decline_history, public.case_studies from anon;
