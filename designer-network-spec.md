# Build spec: Designer platform — v1, phase 1 (designer side)

## Context
I'm building a closed platform for vetted designers in Israel.

- Designers apply. I review their portfolio and LinkedIn and approve or decline each one.
- Approved designers get an account and build a profile page.
- Later (phase 2), employers pay for access, agree to platform rules, search the pool and contact designers themselves.
- The platform never introduces or recommends candidates to employers. The match happens on its own. This matters legally: the platform must work like a closed job board, not a placement agency. Do not build any "suggested candidates" or automatic matching feature.

This spec covers **phase 1 only: the designer side + my admin area**. Design the data model so phase 2 can be added without rework, but do not build any employer features yet.

## Stack
- Next.js (App Router, TypeScript)
- Supabase (Postgres, Auth, Storage, Row Level Security)
- Tailwind CSS
- Resend for emails
- Vercel (with Vercel Cron for the daily reminder)
- zod for validation

## Voice
Publicly, the product is "an exclusive community" of vetted designers, never "a closed platform". (Internally and legally it still works like a closed job board; see Context.)
Public copy speaks as "we" (a team of reviewers), never "I". This applies to the site and to emails 1 and 3.

## Language and layout
- **Everything is in English**: website, application form, platform, admin and all emails. Marketing posts will be in Hebrew, outside the product.
- Set up i18n from day one with `next-intl`, with `en` as the only shipped locale. Structure all strings so a Hebrew version (`he`, RTL) can be added later by adding a message file only, with no code changes. No language toggle yet.
- Set `lang` and `dir` from the locale (`en` → `ltr`, `he` → `rtl`), and use logical Tailwind properties everywhere (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) so RTL works when Hebrew is added.
- Font: one that supports both Latin and Hebrew well (e.g. Heebo or Assistant) via next/font/google.
- Many users are Hebrew speakers: user-generated text (names, bio, case studies, form answers) may be in Hebrew. Render it with `dir="auto"` everywhere, including in the admin.
- Mobile-first.
- All user-facing strings in `/messages/en.json`.

## Privacy principles (apply everywhere)
- Collect the minimum. No ID numbers, addresses, dates of birth, or resume file uploads.
- Portfolio and LinkedIn are stored as links, not files.
- Designers manage their own profile content and can delete their account at any time; deletion removes all their data (including stored images).
- Phone is not collected in the application form. Approved designers can add it in their profile if they want to; it is never shown publicly, and shown to employers only if they turn on "phone shown".
- A clear privacy notice at signup (what's collected, why, who can see it, that it's voluntary, and how to request deletion).
- Service role key only on the server. RLS on every table.

## Pages

### 1. Landing page `/`
Sections, top to bottom (copy below):
1. Hero: headline, subheadline, CTA that scrolls to the form
2. What you get (4 items)
3. How it works (3 steps)
4. Not a hiring agency
5. Who it's for
6. Founding members note
7. Application form
8. "Good to know" disclaimer, right above the submit button
9. Footer with a link to `/privacy` and a one-line "not an agency" statement, on every page

### 2. `/thanks`
Confirms the application: "Thanks for applying. We review every portfolio personally and will get back to you within 7 days."

### 3. `/privacy`
Short privacy page (copy below).

### 4. Designer account (approved designers only)
- Login with Supabase magic link. Only applicants with status `approved` can log in; others see a friendly message.
- **First login: accept the designer rules** (`/rules`) before reaching the editor. Store `rules_accepted_at`. Designer rules:
  - My profile is honest, and all work shown is my own or clearly credited
  - I won't skip interviews I've scheduled without notice
  - I'll update my status when I accept another offer
  - Role and assignment details I receive stay inside the platform
  - Repeated violations lead to a warning, then removal
- `/profile/edit` — profile editor:
  - Display name, headline (one line), short bio
  - Specialty, years of experience, product type, market, platforms, industries (prefilled from the application, editable)
  - Availability: actively looking / open to offers / not looking
  - Confidential search toggle (hide name and photo from employers in phase 2)
  - Portfolio link, LinkedIn link
  - Phone (optional)
  - Profile photo (optional, Supabase Storage)
  - Case studies: add, edit, reorder, delete. Each has title, short description (problem, process, outcome), cover image, optional external link, up to 6 images.
  - Contact preferences: email shown to employers yes/no, phone shown yes/no (default: no for both)
- `/profile/preview` — how the profile will look to employers.
- "Delete my account" with confirmation; deletes the designer, case studies and stored images.

### 5. Admin `/admin` (only `ADMIN_EMAIL`)
- **"Waiting for reply"** (main view): applications I haven't replied to yet: `status IN ('pending', 'declined')` and `replied_at IS NULL`, oldest `applied_at` first. Declined applicants stay here until I click "Send" on the decline email. Rows with `applied_at` older than 5 days highlighted in red.
- **All applicants** with filters: status, specialty, product type, market, availability. Search by name or email.
- **Applicant detail**:
  - All submitted fields, portfolio and LinkedIn as clickable links (new tab)
  - Approve / Decline buttons
  - Reason dropdown (list below) + optional note
  - Internal notes (never shown to the applicant)
  - "Mark as replied" sets `replied_at = now()`
  - **Previous applications**: if this applicant was declined before, show each earlier decline at the top of the detail view: "Declined on {date}: {reason}", my note, and the portfolio and LinkedIn links they submitted back then. This lets me compare with the new application and see if they improved.
- On **Approve**: send the approval email with a login link.
- On **Decline**: do NOT send automatically. Show a decline preview of the "Declined" email (default template, with the chosen reason and my note) that I can edit, with a "Send" button. The email is sent only when I click "Send". Clicking "Send" also sets `replied_at = now()` and adds a row to `decline_history` (date, reason, note, and the links submitted).

## Application form fields
| Field | Label | Type | Required |
|---|---|---|---|
| full_name | Full name | text | yes |
| email | Email | email | yes |
| linkedin_url | LinkedIn profile | url | yes |
| portfolio_url | Portfolio link | url | yes |
| specialty | Specialty | select: Product design / UX/UI / Web design / Brand / Other | yes |
| years_experience | Years of professional experience | select: 0-2 / 3-5 / 6-9 / 10+ | yes |
| product_type | Product type | select: Desktop / Mobile / Both | yes |
| market | Market | select: B2B / B2C / Both | yes |
| platforms | Tools and platforms | multi-select chips: Figma, Framer, Webflow, Shopify, WordPress, Other | no |
| industries | Industries you've worked in | free text | no |
| availability | Job search status | select: Actively looking / Open to offers | yes |
| confidential | My search is confidential (I'm currently employed) | checkbox | no |
| own_work | All work in my portfolio is my own, or clearly credited | checkbox | yes |
| consent | I've read the privacy policy and agree to my details being stored to use the platform | checkbox | yes |

Validation with zod on client and server, error messages next to fields. Honeypot field + reject submissions faster than 3 seconds. Duplicate email:
- Existing application is `pending` or `approved`, or `declined` but the decline email hasn't been sent yet (`replied_at IS NULL`) → "We already have an application from this email."
- Existing application is `declined` and the latest `decline_history.declined_at` is less than 30 days ago → "You can reapply from {date}." ({date} = declined_at + 30 days.) Check this on the server, not only in the form.
- Existing application is `declined` and 30 days or more have passed → accept it as a reapplication: update the row with the new answers, set `status = 'pending'` and `applied_at = now()`, and clear `reason`, `reason_note`, `replied_at` and `approved_at` (the earlier decline stays in `decline_history`).

## Database

### `designers`
- id uuid pk
- user_id uuid null references auth.users (set when an approved designer first logs in)
- created_at, updated_at (trigger)
- applied_at timestamptz default now() (set on the first application and again on every reapplication; used for the waiting view, the 5-day highlight and the daily reminder)
- full_name, email (unique), phone (null)
- linkedin_url, portfolio_url
- display_name (null), headline (null), bio (null), photo_path (null)
- specialty, years_experience, product_type, market
- platforms text[] default '{}', industries text null
- availability text — actively_looking / open_to_offers / not_looking
- confidential boolean default false
- show_email boolean default false, show_phone boolean default false
- own_work_confirmed boolean
- consent boolean, consent_at timestamptz
- rules_accepted_at timestamptz null
- warnings int default 0 (admin-managed, for phase 2 rule enforcement)
- status text default 'pending' — pending / approved / declined
- reason text null, reason_note text null
- internal_notes text null
- replied_at timestamptz null
- approved_at timestamptz null

### `decline_history`
One row per decline email sent, so earlier declines remain visible when someone reapplies.
- id uuid pk, designer_id fk (on delete cascade)
- declined_at timestamptz (the moment "Send" was clicked)
- reason text, reason_note text null
- linkedin_url, portfolio_url (as submitted at the time)
- RLS: admin only (designers cannot read it)

### `case_studies`
- id uuid pk, designer_id fk (on delete cascade)
- title, description, cover_path, images text[] default '{}', external_url null
- position int, created_at, updated_at

### Storage
- Bucket `designer-media`, path `{designer_id}/...`. Only the owner can write; delete everything under the folder on account deletion.

### Phase 2 placeholders
Create only the tables below as empty structures (no UI, no API), so the schema is ready. Field notes reflect decisions already made (see "Phase 2 rules, for reference"):
- `employers`: company_name, website, contact_name, email, verified boolean, rules_accepted_at, status (active / warned / removed), warnings int, is_founding boolean, created_at
- `access_passes`: employer_id, type (hiring_round / extension / founding_lifetime / subscription), starts_at, ends_at (null for lifetime), amount_ils, paid_at
- `jobs`: employer_id, title, description, specialty, product_type, market, seniority, stages jsonb (ordered list), expected_length_weeks (required), budget_min and budget_max (required; visible only to logged-in approved designers, never to visitors), assignment_hours null, assignment_paid boolean, status (open / closed), outcome (hired / not_hired / cancelled, required to close), hired_designer_id null, opened_at, closed_at
- `applications`: job_id, designer_id, status (sent / viewed / in_review / interview / offer / hired / not_a_fit / withdrawn), status timestamps, response_due_at, rejection_reason (from the professional list), rejection_note, created_at
- `hire_confirmations`: job_id, designer_id, reported_by (employer / designer), confirmed_by_other boolean, created_at
- `employer_reviews`: employer_id, designer_id, job_id, rating, comment, employer_response, created_at
- `reports`: reporter type and id, reported type and id, reason, details, status (open / resolved), created_at
- `messages`: thread between employer and designer (job_id null), sender, body, created_at
- A view or function for employer metrics: answer rate, average response time, average actual process length vs. declared

### RLS
- Public form inserts go through a server action with the service role key; no direct anon inserts.
- A designer can read and update only their own row (matching `user_id`), and only if `status = 'approved'`. They cannot change `status`, `reason`, `internal_notes`, `replied_at` or `approved_at`.
- Case studies: owner read/write only.
- Admin (email equals `ADMIN_EMAIL` via `auth.jwt() ->> 'email'`) can read and update everything; also check server-side.
- Phase 2 tables: RLS enabled, no policies yet (locked).

## Decline reasons (admin dropdown)
- Portfolio doesn't include case studies that show process
- Most work is outside the platform's current focus
- Less professional experience than currently required (3+ years)
- Portfolio link doesn't work
- Other

## Emails (Resend, all in English)
1. **Application received** (to applicant): thanks, "We review every portfolio personally and will get back to you within 7 days", plus the "Good to know" text.
2. **New application alert** (to `ADMIN_EMAIL`): name, specialty, portfolio link, link to admin.
3. **Approved** (to applicant): "You're in!", what happens next, login link to build the profile.
4. **Declined** (to applicant): sent only when I click "Send" in the decline preview, never automatically on status change. Personal tone, signed by me. Default template:
   - Subject: "About your application"
   - Body: thanks for applying; I reviewed your portfolio personally; the reason (from the list) and my note; an invitation to reapply after improving, with the date they can reapply from: "You're welcome to apply again from {date}" ({date} = the moment I click "Send" + 30 days, formatted for the locale, e.g. "December 5, 2026"), included for every reason, "Other" too; my name. The date in the preview must match the one the form enforces.
   - Reply-to set to `ADMIN_EMAIL`, so applicants can answer me directly.
5. **Daily reminder** (to `ADMIN_EMAIL`, Vercel Cron, 08:00 Israel time): number waiting for a reply (same rule as the "Waiting for reply" view) and how many are older than 5 days, link to admin. Skip if zero.

## Environment variables
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL, CRON_SECRET, NEXT_PUBLIC_SITE_URL. Add `.env.example` without real values.

## Landing copy
Product name not decided: placeholder `[Product name]` in one constant.

**Hero**
- Headline: Hiring is broken. On both sides.
- Subheadline: Designers get ghosted. Companies drown in applications they can't judge. [Product name] fixes hiring at the root: designers vetted by designers, roles with clear terms up front, and accountability on both sides.
- CTA: Apply to join

**What you get**
- Real designers review your work, not an algorithm
- A professional profile with case studies, instead of another resume file
- Companies that commit to answering, with a reason and on time
- You decide what to share, and with whom

**How it works**
1. Apply with your portfolio and LinkedIn
2. Our team of designers reviews it personally and gets back to you within 7 days
3. Approved? Build your profile, and companies will be able to find you

**Not a hiring agency**
- Lead: We don't place, introduce or recommend candidates.
- Body: This is an exclusive community of vetted designers, where designers and companies find each other directly. Companies search and reach out on their own, and designers decide who to talk to. We set the rules both sides agree to, and make sure they're kept.
- Footer line (every page): Not a recruitment or placement agency. Designers and companies find each other directly.

**Who it's for**
Product, UX/UI and web designers with 3+ years of professional experience and shipped work.

**Founding members**
We're starting small: first we're building the designer community, and companies join next. The first designers will help shape how this works.

**Good to know (above submit)**
Joining doesn't guarantee a job. Companies on the platform search and reach out to designers themselves. What is guaranteed: a real answer to your application, never silence.

**Privacy page**
- What we store: the details you entered in the form, links to your portfolio and LinkedIn, and later, the content you add to your profile.
- Why: to review your application and, once approved, to show your profile to companies on the platform.
- Who sees it: only our review team during review. After approval, registered companies see your profile according to the privacy settings you choose. Phone and email are shown only if you choose to.
- Providing your details is voluntary.
- You can view, correct or delete your data at any time, from your profile or by email.

## Phase 2 rules, for reference (do not build yet)
So the schema and naming fit what's coming:
- **Employers pay for access, never per hire.** Main product: a hiring round pass (~60 days, extendable by 30). Founding lifetime offer for the first 10–20 companies only. Subscription later.
- **Every role must state:** stages, expected process length, a budget range, and assignment terms. The budget range is visible only to logged-in approved designers, never to unregistered visitors.
- **Employers must:** answer every applicant within a set time, with a reason from a professional-only list (experience, portfolio fit, product type, seniority, budget, other) plus an optional professional note. No personal reasons.
- **Employer rating** is built mainly from objective data (answer rate, response time, actual vs. declared process length). New employers show "New on the platform". Employers can respond to reviews. Repeated violations: warning, then removal.
- **Success** = a signed contract, reported in the platform: closing a role requires an outcome; the designer can also report a hire and earns a "Hired through the platform" badge; the other side is asked to confirm.
- If an employer finds no relevant candidates, access is extended for free.
- Unpaid assignment work stays the designer's.
- Both sides can report the other.
- The platform never suggests or recommends designers. Employers search and filter themselves.

## Design direction
- Clean, calm, confident. Lots of white space, one accent color, large type.
- A site for designers: it will be judged on taste. No stock illustrations, no gradients, no emoji.
- Clear focus states and labels for accessibility.

## Build order
1. Setup: Next.js, Tailwind, next-intl (en only, RTL-ready), font, message file.
2. Supabase schema + triggers + RLS + storage bucket (SQL migration files), including empty phase 2 tables.
3. Landing page, `/privacy`, `/thanks`.
4. Application form + server action + validation + spam protection + duplicate check.
5. Emails 1 and 2.
6. Admin login + waiting view + all applicants + detail + approve/decline + decline draft.
7. Approval email + designer magic-link login (approved only).
8. Designer rules page on first login, then profile editor, case studies, photo upload, preview.
9. Account deletion.
10. Daily reminder cron.
11. README: Supabase, Resend, env vars, Vercel deploy.

## Acceptance checklist
- [ ] Renders correctly on mobile and desktop
- [ ] Adding a Hebrew version later requires only a new message file (`he.json`), no code changes, and the layout flips correctly to RTL
- [ ] Hebrew text entered by users (names, bios, case studies) displays in the right direction everywhere, including the admin
- [ ] Form submission saves a row, sends emails 1 and 2, redirects to `/thanks`
- [ ] Duplicate email and invalid URLs show clear errors
- [ ] A declined applicant cannot reapply within 30 days of the decline email (clear message with the date they can reapply from)
- [ ] A declined applicant can reapply with the same email after 30 days, and the admin detail shows the earlier decline date, reason, note and links
- [ ] Clicking "Send" on a decline sends the email, sets `replied_at` and records the decline in `decline_history`
- [ ] Anonymous users cannot read any table (verify with the anon key)
- [ ] Only `ADMIN_EMAIL` can open `/admin`
- [ ] Pending or declined applicants cannot log in
- [ ] An approved designer must accept the designer rules before editing their profile
- [ ] An approved designer can edit only their own profile and case studies, and cannot change their status
- [ ] Deleting an account removes the row, case studies and stored images
- [ ] Applicants waiting over 5 days are highlighted; declined applicants stay in the waiting view until the decline email is sent; "Mark as replied" or sending the decline removes them from the waiting view
- [ ] Cron route rejects requests without `CRON_SECRET` and only sends when someone is waiting
- [ ] No feature anywhere suggests or recommends designers to anyone

Ask me before adding anything outside this scope.
