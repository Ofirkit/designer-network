# Build spec: Designer platform — v1, phase 1 (designer side)

> **Model: open, verified, not vetted.** This replaces the earlier vetted model (approve/decline by reviewers). The vetted version is in git history at commit `e4c9e0c`.

## Context
I'm building a platform for designers in Israel where designers and employers meet on equal terms.

- Designers sign up and build a profile straight away. There is no approval step and nobody judges the quality of their work.
- A light, objective check keeps profiles real (see "Verified, not vetted"). It checks *whether someone is a real designer with real work*, not *how good they are*.
- Both sides follow their own rules, and both sides build a track record from real behavior. That symmetry is the product.
- Later (phase 2), employers pay for access, agree to the employer rules, search designers and contact them themselves.
- The platform never introduces or recommends candidates to employers. The match happens on its own. This matters legally: the platform must work like a job board, not a placement agency. Do not build any "suggested candidates" or automatic matching feature.

This spec covers **phase 1 only: the designer side + my admin (moderation) area**. Design the data model so phase 2 can be added without rework, but do not build any employer features yet.

## Verified, not vetted
A designer's profile becomes **visible to employers** (phase 2) only when all of these are true. Each is objective; none is a judgment of quality.
- Email confirmed
- Designer rules accepted
- Profile basics filled in: full name, specialty, years of experience, product type, market, availability
- Portfolio link present and in a valid format
- At least one case study with a title and description
- Account status is `active` (not hidden or removed by moderation)

Until then, the editor shows a checklist of what's missing, and encourages the designer to add their first case study. No human review is needed to become visible. Admin moderation exists only for rule violations, fake profiles and reports.

## Stack
- Next.js (App Router, TypeScript)
- Supabase (Postgres, Auth, Storage, Row Level Security)
- Tailwind CSS
- Resend for emails (also used as Supabase Auth's SMTP, so confirmation and password-reset emails come from our domain)
- Vercel (with Vercel Cron for the daily digest and cleanup)
- zod for validation

## Voice
- Public copy speaks as "we", never "I".
- Never call the product "exclusive", "vetted", "curated" or "closed". The positioning is **equal terms for both sides**.

## Language and layout
- **Everything is in English**: website, signup form, platform, admin and all emails. Marketing posts will be in Hebrew, outside the product.
- Set up i18n from day one with `next-intl`, with `en` as the only shipped locale. Structure all strings so a Hebrew version (`he`, RTL) can be added later by adding a message file only, with no code changes. No language toggle yet.
- Set `lang` and `dir` from the locale (`en` → `ltr`, `he` → `rtl`), and use logical Tailwind properties everywhere (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) so RTL works when Hebrew is added.
- Font: one that supports both Latin and Hebrew well (e.g. Heebo or Assistant) via next/font/google.
- Many users are Hebrew speakers: user-generated text (names, bio, case studies, form answers) may be in Hebrew. Render it with `dir="auto"` everywhere, including in the admin.
- Mobile-first.
- All user-facing strings in `/messages/en.json`.

## Privacy principles (apply everywhere)
- Collect the minimum. No ID numbers, addresses, dates of birth, or resume file uploads.
- Portfolio and LinkedIn (optional) are stored as links, not files.
- Designers manage their own profile content and can delete their account at any time; deletion removes all their data (including stored images).
- Signup asks for email and password only. Everything else is added in the profile after signing in.
- Phone is not collected at signup. Designers can add it in their profile if they want to; it is never shown publicly, and shown to employers only if they turn on "phone shown".
- A clear privacy notice at signup (what's collected, why, who can see it, that it's voluntary, and how to request deletion).
- Signups whose email is never confirmed are deleted automatically after 14 days.
- The signup form never reveals whether an email already has an account (see "Signup form").
- Service role key only on the server. RLS on every table.

## Pages

### 1. Landing page `/`
Sections, top to bottom (copy below):
1. Hero: eyebrow, headline, subheadline, CTA that scrolls to the form
2. How we fix it: two columns, For designers / For companies (4 items each: the problem, then the fix)
3. How it works (3 steps)
4. Not a hiring agency
5. Who it's for
6. Founding members note
7. Signup form
8. "Good to know" disclaimer, right above the submit button
9. Footer with a link to `/privacy` and a one-line "not an agency" statement, on every page

### 2. `/check-email`
Shown after the signup form: "Check your email. We've sent you a link to confirm your address. Then sign in and start your profile. It may take a minute; check spam if you don't see it."

### 3. `/privacy`
Short privacy page (copy below).

### 4. `/login`, `/forgot-password`, `/reset-password`
- `/login`: email + password, a "Forgot your password?" link, and a link to sign up. Wrong email or password → one generic error ("Email or password is incorrect"), never saying which one.
- `/forgot-password`: email field. Always responds "If there's an account for this email, we've sent a reset link."
- `/reset-password`: reached from the reset email; set a new password, then go to the profile.
- Unconfirmed email → "Please confirm your email first" with a "Resend confirmation" button.

### 5. Designer account
- Login with Supabase email + password. Accounts with status `removed` cannot log in and see a short message with a contact email. Status `hidden` can log in and edit, but the profile isn't visible to employers, and the editor says why.
- **First login: accept the designer rules** (`/rules`) before reaching the editor. Store `rules_accepted_at`. The first rule replaces the old "own work" checkbox at signup. Designer rules:
  - My profile is honest, and all work shown is my own or clearly credited
  - I'll reply to companies that contact me, even if it's a no
  - I won't skip interviews I've scheduled without notice
  - I'll update my status when I accept another offer
  - Role and assignment details I receive stay inside the platform
  - I understand my reliability record (response and attendance), and ratings from companies I've interacted with, are visible to companies
  - Repeated violations lead to a warning, then removal
- `/profile/edit` — profile editor:
  - **Visibility checklist** at the top (see "Verified, not vetted"): what's done and what's missing
  - Display name, headline (one line), short bio
  - Full name
  - Specialty, years of experience, product type, market, platforms, industries
  - The first time, the editor opens as a short guided setup (basics → portfolio link → first case study), then works as a normal editor
  - Availability: actively looking / open to offers / not looking
  - Confidential search toggle (hide name and photo from employers in phase 2)
  - Portfolio link; LinkedIn link (optional, not asked at signup)
  - Phone (optional)
  - Salary expectation (optional): monthly gross, in ILS. Never public; shown only to registered companies in phase 2. Can be left empty.
  - Profile photo (optional, Supabase Storage)
  - Case studies: add, edit, reorder, delete. Each has title, short description (problem, process, outcome), cover image, optional external link, up to 6 images.
  - Contact preferences: email shown to employers yes/no, phone shown yes/no (default: no for both)
- `/profile/preview` — how the profile will look to employers, including the (empty for now) reliability record.
- "Delete my account" with confirmation; deletes the designer, case studies and stored images.

### 6. Admin `/admin` (only `ADMIN_EMAIL`) — moderation, not review
- **New this week** (main view): designers who signed up in the last 7 days, newest first, with visible / not visible and what's missing. For spotting spam and fake profiles, not for judging quality.
- **Reports**: open reports (phase 2 will fill this; in phase 1 the list exists and is empty).
- **All designers** with filters: status, visible yes/no, specialty, product type, market, availability. Search by name or email.
- **Designer detail**:
  - All fields, portfolio and LinkedIn as clickable links (new tab), case studies
  - Internal notes (never shown to the designer)
  - Moderation actions, each with a reason (dropdown, list below) and an optional note:
    - **Warn**: increments `warnings`
    - **Hide**: sets `status = 'hidden'` (profile not visible to employers; designer can still log in and fix it)
    - **Remove**: sets `status = 'removed'` (cannot log in; profile not visible)
    - **Restore**: back to `active`
  - Every action is logged in `moderation_log` and shown as a history on the detail page.
  - After choosing an action, show a preview of the moderation email (template below) that I can edit, with a "Send" button. The email is sent only when I click "Send". The action itself is saved when I confirm it, whether or not I send the email.

## Signup form fields
| Field | Label | Type | Required |
|---|---|---|---|
| email | Email | email | yes |
| password | Password | password (show/hide toggle) | yes, at least 10 characters |
| consent | I've read the privacy policy and agree to my details being stored to use the platform | checkbox | yes |

The consent checkbox stays: it's the privacy notice at signup the privacy principles require. Everything else (name, specialty, portfolio, etc.) is added in the profile.

Validation with zod on client and server, error messages next to fields. Honeypot field + reject submissions faster than 3 seconds. Rate limit signups per IP (e.g. 5 per hour). Reject very common passwords (enable Supabase's leaked-password protection if available on the plan).

On submit (server action), call Supabase `signUp` with email confirmation on, and store `consent_at` in the user's metadata. Then redirect to `/check-email`:
- **New email**: Supabase sends the confirmation email (email 1).
- **Email already has an account**: Supabase returns the same response without creating anything; the page looks the same, so the form never reveals who has an account.
- **Email belongs to a removed account**: same as above; nothing is created, and they can't log in.

**After confirming**: the confirmation link signs the designer in. On that first confirmed sign-in, create the `designers` row (email, consent, consent_at from metadata), send the welcome email (email 2), and go to `/rules`.

## Database

### `designers`
- id uuid pk
- user_id uuid references auth.users (the row is created on the first confirmed sign-in, so every row has a confirmed email)
- created_at, updated_at (trigger)
- email (unique, lowercase)
- full_name (null until filled in), phone (null)
- portfolio_url (null until filled in), linkedin_url (null; optional)
- display_name (null), headline (null), bio (null), photo_path (null)
- specialty, years_experience, product_type, market (null until filled in)
- platforms text[] default '{}', industries text null
- availability text null — actively_looking / open_to_offers / not_looking
- confidential boolean default false
- show_email boolean default false, show_phone boolean default false
- salary_expectation int null (monthly gross ILS; optional)
- consent boolean, consent_at timestamptz
- rules_accepted_at timestamptz null
- status text default 'active' — active / hidden / removed (admin-managed)
- warnings int default 0 (admin-managed)
- internal_notes text null (admin only)
- A view or generated helper `designer_visibility` (designer_id, is_visible, missing items) implementing "Verified, not vetted"

### `case_studies`
- id uuid pk, designer_id fk (on delete cascade)
- title, description, cover_path, images text[] default '{}', external_url null
- position int, created_at, updated_at

### `moderation_log`
- id uuid pk, designer_id fk (on delete cascade)
- action text — warn / hide / remove / restore
- reason text (from the list below), note text null
- email_sent_at timestamptz null
- created_at
- RLS: admin only

### `signup_attempts`
- id uuid pk, email, ip_hash (hashed, never the raw IP), outcome (submitted / rejected_spam / rate_limited), created_at
- Used for rate limiting and spotting abuse. Rows older than 30 days are deleted by the daily cron.
- RLS: admin only

### Storage
- Bucket `designer-media` (private, signed URLs), path `{designer_id}/...`. Only the owner can write; delete everything under the folder on account deletion.

### Phase 2 placeholders
Create only the tables below as empty structures (no UI, no API), so the schema is ready. Field notes reflect decisions already made (see "Phase 2 rules, for reference"):
- `employers`: company_name, website, contact_name, email, verified boolean, rules_accepted_at, status (active / warned / removed), warnings int, is_founding boolean, created_at
- `access_passes`: employer_id, type (hiring_round / extension / founding_lifetime / subscription), starts_at, ends_at (null for lifetime), amount_ils, paid_at
- `jobs`: employer_id, title, description, specialty, product_type, market, seniority, stages jsonb (ordered list), expected_length_weeks (required), budget_min and budget_max (optional, both or neither; monthly gross ILS; budget_max at most 30% above budget_min; visible only to logged-in designers, never to visitors), budget_note null (what moves someone up the range), assignment_hours null, assignment_paid boolean, status (open / closed), outcome (hired / not_hired / cancelled, required to close), hired_designer_id null, opened_at, closed_at
- `applications`: job_id, designer_id, status (sent / viewed / in_review / interview / offer / hired / not_a_fit / withdrawn), status timestamps, answered_at, response_due_at, rejection_reason (from the professional list), rejection_note, created_at
- `contact_requests`: employer reaches out to a designer directly (not through a job application): employer_id, designer_id, job_id null, sent_at, response_due_at, responded_at null, response (interested / not_interested) null
- `interview_reports`: application_id or contact_request_id, scheduled_at, reported_by (employer), outcome (attended / no_show / rescheduled_with_notice), designer_response text null (designer can respond), disputed boolean default false, created_at
- `hire_confirmations`: job_id, designer_id, reported_by (employer / designer), confirmed_by_other boolean, created_at
- `reviews` (both directions): reviewer_type (designer / employer), employer_id, designer_id, application_id or contact_request_id (exactly one: the interaction the review is about), comment, response (from the reviewed side), responded_at, created_at. One review per side per interaction.
- `review_scores`: review_id, category, score 1–5. Database triggers reject a review with no interaction, and any category the interaction didn't unlock (see "Ratings" in Phase 2 rules).
- `reports`: reporter type and id, reported type and id, reason, details, status (open / resolved), created_at
- `messages`: thread between employer and designer (job_id null), sender, body, created_at
- **Employer metrics** (view): answer rate, average response time, average actual process length vs. declared, average score per category and number of reviews from designers
- **Designer metrics** (view), the mirror of employer metrics: response rate to contact requests, average response time, interview attendance rate (from `interview_reports`, excluding disputed reports until resolved), average score per category and number of reviews from companies

### RLS
- Signup goes through a server action (Supabase Auth); the `designers` row is created by server code with the service role key on the first confirmed sign-in. No direct anon inserts.
- A designer can read and update only their own row (matching `user_id`), unless `status = 'removed'`. They cannot change `status`, `warnings`, `internal_notes`, `email`, `user_id`, `consent_at` or `created_at`. `rules_accepted_at` can be set once, not cleared.
- Case studies: owner read/write only.
- `moderation_log`, `signup_attempts`: admin read only; writes from server code.
- Admin (email equals the configured admin email via `auth.jwt() ->> 'email'`) can read and update everything; also check server-side.
- Phase 2 tables and views: RLS enabled, no policies yet (locked).

## Moderation reasons (admin dropdown)
- Profile appears fake or not a real designer
- Work shown isn't the designer's own or isn't credited
- Broken or missing portfolio link
- Didn't follow the designer rules
- Reported by a company (phase 2)
- Other

## Emails (Resend, all in English)
1. **Auth emails** (to designer; sent by Supabase Auth through Resend SMTP, templates customised to match the site):
   - Confirm your email: "Confirm your email for [Product name]", one button
   - Reset your password: one button, expires per Supabase settings
2. **Welcome** (to designer, after their first confirmed sign-in): what to do next (accept the rules, fill in the basics, add a portfolio link and a first case study), and what "visible" means.
3. **Moderation notice** (to designer): sent only when I click "Send" in the moderation preview, never automatically. Default templates per action:
   - Warn: which rule, my note, what happens if it repeats
   - Hide: why the profile is hidden and exactly what to fix to make it visible again
   - Remove: why, and how to contact us
   - Restore: the profile is visible again
   - Reply-to set to `ADMIN_EMAIL`.
4. **Daily digest** (to `ADMIN_EMAIL`, Vercel Cron, 08:00 Israel time): new confirmed signups in the last 24 hours, open reports, link to admin. Skip if both are zero.

The same daily cron also deletes unconfirmed auth users older than 14 days (they have no `designers` row yet) and `signup_attempts` older than 30 days.

## Environment variables
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL, CRON_SECRET, NEXT_PUBLIC_SITE_URL. Add `.env.example` without real values.

## Landing copy
Product name not decided: placeholder `[Product name]` in one constant.

**Hero**
- Eyebrow: For designers and companies in Israel
- Headline: Hiring is broken. On both sides.
- Subheadline: Designers get ghosted. Companies get no-shows and resumes that say nothing. [Product name] puts both sides on equal terms: the same standards for everyone, a clear process for every role, and a track record each side can see.
- CTA: Create your profile

**How we fix it**

*For designers*
- Applied, interviewed, then silence. → Every company commits to answering every application on time. If it's a no, they tell you why.
- Filtered out by keywords and HR screens. → Companies see your case studies, not a keyword-matched resume.
- Processes that drag on with no end date. → Every role shows its interview stages and expected timeline before you apply.
- No way to tell good employers from bad ones. → Every company has a track record: how often they answer, how fast, and whether their process matches what they promised.

*For companies*
- Resumes that say nothing about craft. → Every visible profile shows real work: at least one case study with process and outcome.
- Candidates who skip interviews or never reply. → Every designer has a reliability record too: response rate and interview attendance.
- Recruiter fees on every hire. → You pay for access, never per hire. You search and reach out to designers yourself.
- Hiring in a market where everyone knows everyone. → Designers can search confidentially, so you can reach people who aren't openly looking.
- Note under the companies column: Companies join after the designer community is in place.

**How it works**
1. Sign up with your email
2. Fill in your profile and add at least one case study, and you're ready to be found
3. When companies join, they search and reach out. You decide who to talk to.

**Not a hiring agency**
- Lead: We don't place, introduce or recommend candidates.
- Body: Designers and companies find each other directly. Companies search and reach out on their own, and designers decide who to talk to. We set the rules both sides agree to, and make sure they're kept.
- Footer line (every page): Not a recruitment or placement agency. Designers and companies find each other directly.

**Who it's for**
Product, UX/UI and web designers at any stage of their career, with real projects to show.

**Founding members**
We're starting small: first we're building the designer community, and companies join next. The first designers will help shape how this works.

**Good to know (above submit)**
Joining doesn't guarantee a job. Companies on the platform search and reach out to designers themselves. What we do guarantee: the same rules for both sides, and consequences for anyone who breaks them.

**Privacy page**
- What we store: your email, and the details and work you add to your profile, including a link to your portfolio (and LinkedIn, if you add it).
- Why: to show your profile to companies on the platform, and to keep the platform safe (for example, removing fake profiles).
- Who sees it: our team, for moderation only. Once companies join, registered companies see your profile according to the privacy settings you choose. Phone and email are shown only if you choose to. Your reliability record (response and attendance), and ratings from companies you've interacted with, are visible to registered companies.
- Providing your details is voluntary.
- You can view, correct or delete your data at any time, from your profile or by email.
- If you sign up but never confirm your email, we delete your details after 14 days.

## Phase 2 rules, for reference (do not build yet)
So the schema and naming fit what's coming:
- **Employers pay for access, never per hire.** Main product: a hiring round pass (~60 days, extendable by 30). Founding lifetime offer for the first 10–20 companies only. Subscription later.
- **Every role must state:** stages, expected process length, and assignment terms.
- **Budget range: optional but encouraged.** Roles that share one get a "Budget shared" label, and designers can filter by it. The budget range is visible only to logged-in designers, never to unregistered visitors.
  - Amounts are monthly gross, in ILS.
  - The top of the range can be at most 30% above the bottom, so the range stays meaningful.
  - Optional note on what moves someone up the range (e.g. "Top of range: 8+ years and design-system experience").
  - Designers can state their own salary expectation in their profile (optional, never public), so the conversation starts from both numbers.
- **Employers must:** answer every applicant within a set time, with a reason from a professional-only list (experience, portfolio fit, product type, seniority, budget, other) plus an optional professional note. No personal reasons.
- **Designers must:** respond to every contact request within a set time (a short "not interested" is fine), and attend interviews they've scheduled or cancel with notice.
- **Track records on both sides**, built from objective data:
  - Employers: answer rate, response time, actual vs. declared process length. Employers can respond to reviews.
  - Designers: response rate to contact requests, response time, interview attendance. A designer can respond to a no-show report; disputed reports don't count until resolved.
  - New accounts on either side show "New on the platform" until there's enough data.
- **Ratings go both ways, and only after a real interaction.** No interaction, no rating: a company that never answers an application can't be rated, but its answer rate shows it.
  - A rating is about one application or one contact request, and is made of category scores (1–5 each, any can be skipped), plus one optional comment.
  - The interaction decides which categories can be rated:

    | Unlocked by | Designer rates company | Company rates designer |
    |---|---|---|
    | A conversation (messages both ways) or an interview | Communication | Communication |
    | An interview | Respect; Process as described | Professionalism; Work as presented |
    | A final outcome (offer, hire, no, withdrawn), after a conversation or interview | Closure | Follow-through |

    Example: an employer who left mid-conversation can be rated only on Communication.
  - Categories are shown separately, never merged into one overall score.
  - A review must include at least one score (checked in the app).
  - One review per side per interaction. The rated side can respond once, publicly.
  - Ratings are about professional conduct. Personal remarks can be reported and removed.
  - Ratings are shown next to the objective track record, never instead of it.
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
1. Setup: Next.js, Tailwind, next-intl (en only, RTL-ready), font, message file. *(done)*
2. Supabase schema + triggers + RLS + storage bucket (SQL migration files), including empty phase 2 tables. *(done for the vetted model; update for this spec)*
3. Landing page, `/privacy`, `/check-email`, `/login`. *(landing and privacy done for the vetted model; update copy)*
4. Signup (email + password + consent) + server action + validation + spam protection + rate limit; login, forgot and reset password; first-sign-in row creation.
5. Resend as Supabase SMTP with custom auth templates; emails 1 and 2.
6. Designer rules page on first login, then the guided first setup and profile editor with visibility checklist, case studies, photo upload, preview.
7. Account deletion.
8. Admin: new this week, all designers, detail, moderation actions + log + moderation email preview.
9. Daily cron: digest + cleanup of unconfirmed signups and old signup attempts.
10. README: Supabase, Resend (including SMTP for Auth), env vars, Vercel deploy.

## Acceptance checklist
- [ ] Renders correctly on mobile and desktop
- [ ] Adding a Hebrew version later requires only a new message file (`he.json`), no code changes, and the layout flips correctly to RTL
- [ ] Hebrew text entered by users (names, bios, case studies) displays in the right direction everywhere, including the admin
- [ ] Signup asks only for email, password and consent; it sends the confirmation email and shows `/check-email`
- [ ] Signing up with an existing email shows the same `/check-email` page and creates nothing (no account enumeration)
- [ ] Login errors never reveal whether the email exists; forgot-password always gives the same answer
- [ ] Confirming the email signs the designer in, creates their `designers` row, sends the welcome email and opens `/rules`
- [ ] A removed account cannot sign up again or log in
- [ ] Invalid URLs show clear errors; honeypot, 3-second check and rate limit block spam
- [ ] Anonymous users cannot read any table (verify with the anon key)
- [ ] Only `ADMIN_EMAIL` can open `/admin`
- [ ] A designer must accept the designer rules before editing their profile
- [ ] A designer can edit only their own profile and case studies, and cannot change their status, warnings or internal notes
- [ ] The visibility checklist is correct: a profile is visible only when every "Verified, not vetted" condition is met
- [ ] Hiding a profile makes it not visible; removing an account blocks login; both are logged in `moderation_log`
- [ ] Moderation emails are sent only when I click "Send"
- [ ] Deleting an account removes the row, case studies and stored images
- [ ] Unconfirmed auth users older than 14 days are deleted by the cron
- [ ] Cron route rejects requests without `CRON_SECRET`, and the digest is sent only when there's something to report
- [ ] No feature anywhere suggests or recommends designers to anyone

Ask me before adding anything outside this scope.
