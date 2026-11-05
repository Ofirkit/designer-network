-- Phase 2 placeholders: structure only. No UI, no API.
-- RLS is enabled with NO policies, so these tables are fully locked to
-- anon and authenticated users until phase 2 adds policies.
--
-- Reminder (phase 2 rules): employers pay for access, never per hire, and the
-- platform never suggests or recommends designers. There is deliberately no
-- matching or recommendation table here. Both sides get a track record built
-- from objective data (employer_metrics, designer_metrics).

create table public.employers (
  id                uuid primary key default gen_random_uuid(),
  company_name      text not null,
  website           text,
  contact_name      text not null,
  email             text not null unique check (email = lower(email)),
  verified          boolean not null default false,
  rules_accepted_at timestamptz,
  status            text not null default 'active' check (status in ('active', 'warned', 'removed')),
  warnings          int not null default 0 check (warnings >= 0),
  is_founding       boolean not null default false,
  created_at        timestamptz not null default now()
);

create table public.access_passes (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  type        text not null check (type in ('hiring_round', 'extension', 'founding_lifetime', 'subscription')),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz, -- null only for founding_lifetime
  amount_ils  numeric(10, 2) not null default 0 check (amount_ils >= 0),
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  check (ends_at is not null or type = 'founding_lifetime')
);

create table public.jobs (
  id                    uuid primary key default gen_random_uuid(),
  employer_id           uuid not null references public.employers (id) on delete cascade,
  title                 text not null,
  description           text not null,
  specialty             text,
  product_type          text,
  market                text,
  seniority             text,
  stages                jsonb not null default '[]'::jsonb check (jsonb_typeof(stages) = 'array'),
  expected_length_weeks int not null check (expected_length_weeks > 0),
  -- Optional but encouraged ("Budget shared" label). Both or neither.
  -- Monthly gross ILS. The top may be at most 30% above the bottom.
  -- Visible only to logged-in designers, never to visitors.
  budget_min            int check (budget_min is null or budget_min >= 0),
  budget_max            int,
  budget_note           text, -- what moves someone up the range
  assignment_hours      int check (assignment_hours is null or assignment_hours >= 0),
  assignment_paid       boolean not null default false,
  status                text not null default 'open' check (status in ('open', 'closed')),
  outcome               text check (outcome is null or outcome in ('hired', 'not_hired', 'cancelled')),
  hired_designer_id     uuid references public.designers (id) on delete set null,
  opened_at             timestamptz not null default now(),
  closed_at             timestamptz,
  check ((budget_min is null) = (budget_max is null)),
  check (budget_max is null or (budget_max >= budget_min and budget_max <= budget_min * 1.3)),
  -- Closing a role requires an outcome.
  check (status = 'open' or (outcome is not null and closed_at is not null))
);

create table public.applications (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.jobs (id) on delete cascade,
  designer_id      uuid not null references public.designers (id) on delete cascade,
  status           text not null default 'sent' check (status in (
                     'sent', 'viewed', 'in_review', 'interview', 'offer', 'hired', 'not_a_fit', 'withdrawn')),
  sent_at          timestamptz not null default now(),
  viewed_at        timestamptz,
  in_review_at     timestamptz,
  interview_at     timestamptz,
  offer_at         timestamptz,
  hired_at         timestamptz,
  not_a_fit_at     timestamptz,
  withdrawn_at     timestamptz,
  -- First real answer from the employer (in_review or later); used for metrics.
  answered_at      timestamptz,
  response_due_at  timestamptz,
  rejection_reason text check (rejection_reason is null or rejection_reason in (
                     'experience', 'portfolio_fit', 'product_type', 'seniority', 'budget', 'other')),
  rejection_note   text,
  created_at       timestamptz not null default now(),
  unique (job_id, designer_id)
);

-- An employer reaching out to a designer directly (not via a job application).
create table public.contact_requests (
  id               uuid primary key default gen_random_uuid(),
  employer_id      uuid not null references public.employers (id) on delete cascade,
  designer_id      uuid not null references public.designers (id) on delete cascade,
  job_id           uuid references public.jobs (id) on delete set null,
  sent_at          timestamptz not null default now(),
  response_due_at  timestamptz,
  responded_at     timestamptz,
  response         text check (response is null or response in ('interested', 'not_interested')),
  check ((responded_at is null) = (response is null))
);

-- Interview attendance, reported by the employer. The designer can respond;
-- disputed reports don't count in designer_metrics until resolved.
create table public.interview_reports (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid references public.applications (id) on delete cascade,
  contact_request_id  uuid references public.contact_requests (id) on delete cascade,
  scheduled_at        timestamptz not null,
  reported_by         text not null default 'employer' check (reported_by = 'employer'),
  outcome             text not null check (outcome in ('attended', 'no_show', 'rescheduled_with_notice')),
  designer_response   text,
  disputed            boolean not null default false,
  created_at          timestamptz not null default now(),
  check (num_nonnulls(application_id, contact_request_id) = 1)
);

create table public.hire_confirmations (
  id                 uuid primary key default gen_random_uuid(),
  job_id             uuid not null references public.jobs (id) on delete cascade,
  designer_id        uuid not null references public.designers (id) on delete cascade,
  reported_by        text not null check (reported_by in ('employer', 'designer')),
  confirmed_by_other boolean not null default false,
  created_at         timestamptz not null default now()
);

create table public.employer_reviews (
  id                uuid primary key default gen_random_uuid(),
  employer_id       uuid not null references public.employers (id) on delete cascade,
  designer_id       uuid references public.designers (id) on delete set null,
  job_id            uuid references public.jobs (id) on delete set null,
  rating            int not null check (rating between 1 and 5),
  comment           text,
  employer_response text,
  created_at        timestamptz not null default now()
);

create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_type text not null check (reporter_type in ('employer', 'designer')),
  reporter_id   uuid not null,
  reported_type text not null check (reported_type in ('employer', 'designer')),
  reported_id   uuid not null,
  reason        text not null,
  details       text,
  status        text not null default 'open' check (status in ('open', 'resolved')),
  created_at    timestamptz not null default now()
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  designer_id uuid not null references public.designers (id) on delete cascade,
  job_id      uuid references public.jobs (id) on delete set null,
  sender      text not null check (sender in ('employer', 'designer')),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index messages_thread_idx on public.messages (employer_id, designer_id, created_at);

alter table public.employers          enable row level security;
alter table public.access_passes      enable row level security;
alter table public.jobs               enable row level security;
alter table public.applications       enable row level security;
alter table public.contact_requests   enable row level security;
alter table public.interview_reports  enable row level security;
alter table public.hire_confirmations enable row level security;
alter table public.employer_reviews   enable row level security;
alter table public.reports            enable row level security;
alter table public.messages           enable row level security;

-- Employer metrics, built from objective data only.
-- security_invoker: the caller's RLS applies, so it is locked like the tables.
create view public.employer_metrics
with (security_invoker = true) as
select
  e.id as employer_id,
  count(a.id)                                                as applications_received,
  count(a.answered_at)                                       as applications_answered,
  case when count(a.id) = 0 then null
       else round(count(a.answered_at)::numeric / count(a.id), 3) end as answer_rate,
  avg(a.answered_at - a.sent_at)                             as avg_response_time,
  (
    select avg(j.closed_at - j.opened_at)
    from public.jobs j
    where j.employer_id = e.id and j.status = 'closed'
  )                                                          as avg_actual_process_length,
  (
    select avg(make_interval(weeks => j.expected_length_weeks))
    from public.jobs j
    where j.employer_id = e.id and j.status = 'closed'
  )                                                          as avg_declared_process_length
from public.employers e
left join public.jobs j on j.employer_id = e.id
left join public.applications a on a.job_id = j.id
group by e.id;

-- Designer metrics: the mirror of employer metrics.
create view public.designer_metrics
with (security_invoker = true) as
select
  d.id as designer_id,
  (select count(*) from public.contact_requests cr where cr.designer_id = d.id) as contact_requests_received,
  (select count(*) from public.contact_requests cr where cr.designer_id = d.id and cr.responded_at is not null) as contact_requests_answered,
  (
    select case when count(*) = 0 then null
                else round(count(cr.responded_at)::numeric / count(*), 3) end
    from public.contact_requests cr where cr.designer_id = d.id
  ) as response_rate,
  (
    select avg(cr.responded_at - cr.sent_at)
    from public.contact_requests cr where cr.designer_id = d.id and cr.responded_at is not null
  ) as avg_response_time,
  (
    select case when count(*) = 0 then null
                else round(count(*) filter (where ir.outcome <> 'no_show')::numeric / count(*), 3) end
    from public.interview_reports ir
    left join public.applications a on a.id = ir.application_id
    left join public.contact_requests cr on cr.id = ir.contact_request_id
    where coalesce(a.designer_id, cr.designer_id) = d.id
      and not ir.disputed
  ) as interview_attendance_rate
from public.designers d;

revoke all on
  public.employers, public.access_passes, public.jobs, public.applications,
  public.hire_confirmations, public.employer_reviews, public.reports, public.messages,
  public.contact_requests, public.interview_reports,
  public.employer_metrics, public.designer_metrics
from anon, authenticated;
