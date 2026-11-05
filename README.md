# [Product name]

A closed platform for vetted designers in Israel. Phase 1: the designer side and the admin area.
The full spec is in [`designer-network-spec.md`](designer-network-spec.md).

## Status

The platform uses an **open, verified-not-vetted model**: designers sign up and build a profile
straight away, with no approval step (see the spec).

| Stage | Spec build steps | State |
|---|---|---|
| A | 1–3: setup, database, landing, `/privacy`, `/check-email`, `/login`, `/forgot-password` | Done |
| B | 4–5: email + password signup, login, password reset, welcome email | Next |
| C | 6–7: rules, profile editor, visibility checklist, case studies, deletion | — |
| D | 8–10: admin moderation, daily cron, deploy docs | — |

The signup, login and forgot-password forms validate in the browser today; submitting them is wired up in stage B.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in later; stage A runs without real values
npm run dev
```

Open http://localhost:3000.

## Database (Supabase)

SQL migrations are in `supabase/migrations/`:

1. `…_designers.sql`: `designers`, `case_studies`, `moderation_log`, `signup_attempts`, the
   `designer_visibility` view ("verified, not vetted"), Row Level Security, admin-field protection
2. `…_storage.sql`: private `designer-media` bucket and its policies
3. `…_phase2_placeholders.sql`: empty, locked phase 2 tables, plus `employer_metrics` and
   `designer_metrics` (track records for both sides)

Apply them with the Supabase CLI (`supabase db push`) or paste them in order into the SQL editor.
Then set the admin email (the same value as `ADMIN_EMAIL`):

```sql
insert into private.settings (key, value) values ('admin_email', 'you@example.com')
on conflict (key) do update set value = excluded.value;
```

## Languages

All UI text is in `messages/en.json`. To add a language, add `messages/{locale}.json` (e.g. `he.json`)
with the same keys. No code changes: the locale is picked from a `NEXT_LOCALE` cookie or the browser
language when a matching file exists, and `dir` (ltr/rtl) comes from the locale. Layout uses logical
Tailwind properties (`ms-`, `pe-`, `text-start`, …) so it flips for RTL. User-written text renders with
`dir="auto"`.

The product name is set in `src/config/site.ts`.

## Mockups

Screenshots of the current pages are in `mockups/`.
