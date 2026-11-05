-- Phase 1: designers, case studies, moderation log, signup attempts.
-- Open model: designers sign up and build a profile straight away.
-- A profile is visible to employers (phase 2) only when objective conditions
-- are met (see public.designer_visibility). Nobody judges quality.
--
-- Row Level Security is enabled on every table. Signup never writes from the
-- browser: it goes through a server action using the service role key.

-- ---------------------------------------------------------------------------
-- Admin identity
-- ---------------------------------------------------------------------------
-- Set once after migrating (see README), with the same value as ADMIN_EMAIL:
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
  -- Set on the first successful magic-link login.
  email_confirmed_at timestamptz,

  full_name          text not null check (char_length(full_name) between 2 and 120),
  email              text not null unique check (email = lower(email)),
  phone              text check (phone is null or char_length(phone) <= 30),
  -- Optional; not asked at signup, can be added in the profile.
  linkedin_url       text check (linkedin_url is null or char_length(linkedin_url) <= 500),
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
  -- Optional, monthly gross ILS. Never public; for registered companies in phase 2.
  salary_expectation int check (salary_expectation is null or salary_expectation >= 0),

  own_work_confirmed boolean not null check (own_work_confirmed),
  consent            boolean not null check (consent),
  consent_at         timestamptz not null default now(),
  rules_accepted_at  timestamptz,

  -- Moderation (admin-managed)
  status             text not null default 'active' check (status in ('active', 'hidden', 'removed')),
  warnings           int not null default 0 check (warnings >= 0),
  internal_notes     text
);

create index designers_created_idx on public.designers (created_at desc);
create index designers_status_idx on public.designers (status);
-- For the daily cleanup of unconfirmed signups.
create index designers_unconfirmed_idx on public.designers (created_at) where email_confirmed_at is null;

create trigger designers_set_updated_at
  before update on public.designers
  for each row execute function public.set_updated_at();

-- Designers may edit their own profile, but never the fields the system or
-- the admin owns. RLS decides *which rows*; this trigger decides *which columns*.
create or replace function public.protect_designer_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' and not public.is_admin() then
    if new.status             is distinct from old.status
    or new.warnings           is distinct from old.warnings
    or new.internal_notes     is distinct from old.internal_notes
    or new.user_id            is distinct from old.user_id
    or new.email              is distinct from old.email
    or new.email_confirmed_at is distinct from old.email_confirmed_at
    or new.consent_at         is distinct from old.consent_at
    or new.created_at         is distinct from old.created_at
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

-- Removed accounts can't read or edit anything.
create policy "designers: owner reads own row"
  on public.designers for select to authenticated
  using (user_id = (select auth.uid()) and status <> 'removed');

create policy "designers: owner updates own row"
  on public.designers for update to authenticated
  using (user_id = (select auth.uid()) and status <> 'removed')
  with check (user_id = (select auth.uid()) and status <> 'removed');

create policy "designers: admin reads all"
  on public.designers for select to authenticated
  using ((select public.is_admin()));

create policy "designers: admin updates all"
  on public.designers for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- No insert or delete policies: signup and account deletion go through
-- server code with the service role key.

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

-- True when the current user owns this designers row and isn't removed.
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
      and d.status <> 'removed'
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

-- ---------------------------------------------------------------------------
-- Visibility: "verified, not vetted"
-- ---------------------------------------------------------------------------
-- A profile is visible to employers only when every objective condition is
-- met. `missing` lists what's left, for the checklist in the editor.
-- security_invoker: callers only see rows RLS already lets them see.
create view public.designer_visibility
with (security_invoker = true) as
select
  d.id as designer_id,
  array_remove(array[
    case when d.email_confirmed_at is null then 'email_confirmed' end,
    case when d.rules_accepted_at is null then 'rules_accepted' end,
    case when coalesce(d.portfolio_url, '') = '' then 'portfolio_url' end,
    case when not exists (
      select 1 from public.case_studies c
      where c.designer_id = d.id
        and char_length(trim(c.title)) > 0
        and char_length(trim(c.description)) > 0
    ) then 'case_study' end,
    case when d.status <> 'active' then 'status_active' end
  ], null) as missing,
  (
    d.email_confirmed_at is not null
    and d.rules_accepted_at is not null
    and coalesce(d.portfolio_url, '') <> ''
    and d.status = 'active'
    and exists (
      select 1 from public.case_studies c
      where c.designer_id = d.id
        and char_length(trim(c.title)) > 0
        and char_length(trim(c.description)) > 0
    )
  ) as is_visible
from public.designers d;

-- ---------------------------------------------------------------------------
-- moderation_log: every warn / hide / remove / restore
-- ---------------------------------------------------------------------------
create table public.moderation_log (
  id            uuid primary key default gen_random_uuid(),
  designer_id   uuid not null references public.designers (id) on delete cascade,
  action        text not null check (action in ('warn', 'hide', 'remove', 'restore')),
  reason        text not null check (reason in (
                  'fake_profile', 'work_not_own', 'broken_portfolio', 'broke_rules',
                  'reported_by_company', 'other')),
  note          text,
  email_sent_at timestamptz,
  created_at    timestamptz not null default now()
);

create index moderation_log_designer_idx on public.moderation_log (designer_id, created_at desc);

alter table public.moderation_log enable row level security;

create policy "moderation_log: admin reads all"
  on public.moderation_log for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- signup_attempts: rate limiting and abuse spotting (never the raw IP)
-- ---------------------------------------------------------------------------
create table public.signup_attempts (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  ip_hash    text not null,
  outcome    text not null check (outcome in ('created', 'existing', 'removed', 'rejected_spam')),
  created_at timestamptz not null default now()
);

create index signup_attempts_ip_idx on public.signup_attempts (ip_hash, created_at desc);
create index signup_attempts_created_idx on public.signup_attempts (created_at);

alter table public.signup_attempts enable row level security;

create policy "signup_attempts: admin reads all"
  on public.signup_attempts for select to authenticated
  using ((select public.is_admin()));

-- Anonymous visitors get nothing from any of these.
revoke all on
  public.designers, public.case_studies, public.moderation_log,
  public.signup_attempts, public.designer_visibility
from anon;
