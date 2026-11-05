"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  APPLICATION_AVAILABILITY,
  MARKETS,
  PLATFORMS,
  PRODUCT_TYPES,
  SPECIALTIES,
  YEARS_EXPERIENCE,
} from "@/lib/options";
import { applicationSchema } from "@/lib/validation/application";

type FieldErrors = Partial<Record<string, string>>;

const inputClass =
  "block w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 " +
  "transition-colors hover:border-ink/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-soft/40";

function readForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "");
  return {
    full_name: text("full_name"),
    email: text("email"),
    linkedin_url: text("linkedin_url"),
    portfolio_url: text("portfolio_url"),
    specialty: text("specialty"),
    years_experience: text("years_experience"),
    product_type: text("product_type"),
    market: text("market"),
    platforms: data.getAll("platforms").map(String),
    industries: text("industries"),
    availability: text("availability"),
    confidential: data.get("confidential") === "on",
    own_work: data.get("own_work") === "on",
    consent: data.get("consent") === "on",
  };
}

export function ApplicationForm() {
  const t = useTranslations("form");
  const tOptions = useTranslations("options");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const summaryRef = useRef<HTMLParagraphElement>(null);

  const errorFor = (name: string) => (errors[name] ? t(`errors.${errors[name]}`) : undefined);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const result = applicationSchema.safeParse(readForm(event.currentTarget));
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message in ERROR_KEYS ? issue.message : "required";
      }
      setErrors(next);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    // Stage B: send to the server action (honeypot, 3-second check, duplicate check, emails).
    setNotice(t("notConnected"));
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-12">
      {hasErrors && (
        <p
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {t("errorSummary")}
        </p>
      )}

      {/* Spam protection: hidden from people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />

      <Group title={t("groups.about")}>
        <TextField name="full_name" label={t("fields.full_name")} autoComplete="name" error={errorFor("full_name")} />
        <TextField name="email" type="email" label={t("fields.email")} autoComplete="email" dir="ltr" error={errorFor("email")} />
      </Group>

      <Group title={t("groups.work")}>
        <TextField
          name="linkedin_url"
          type="url"
          label={t("fields.linkedin_url")}
          placeholder="https://www.linkedin.com/in/"
          dir="ltr"
          error={errorFor("linkedin_url")}
        />
        <TextField
          name="portfolio_url"
          type="url"
          label={t("fields.portfolio_url")}
          placeholder="https://"
          dir="ltr"
          error={errorFor("portfolio_url")}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            name="specialty"
            label={t("fields.specialty")}
            placeholder={t("select")}
            options={SPECIALTIES.map((value) => ({ value, label: tOptions(`specialty.${value}`) }))}
            error={errorFor("specialty")}
          />
          <SelectField
            name="years_experience"
            label={t("fields.years_experience")}
            placeholder={t("select")}
            options={YEARS_EXPERIENCE.map((value) => ({ value, label: tOptions(`years_experience.${value}`) }))}
            error={errorFor("years_experience")}
          />
        </div>
        <ChoiceField
          name="product_type"
          label={t("fields.product_type")}
          options={PRODUCT_TYPES.map((value) => ({ value, label: tOptions(`product_type.${value}`) }))}
          error={errorFor("product_type")}
        />
        <ChoiceField
          name="market"
          label={t("fields.market")}
          options={MARKETS.map((value) => ({ value, label: tOptions(`market.${value}`) }))}
          error={errorFor("market")}
        />
        <ChoiceField
          name="platforms"
          multiple
          label={t("fields.platforms")}
          optional={t("optional")}
          options={PLATFORMS.map((value) => ({ value, label: tOptions(`platforms.${value}`) }))}
          error={errorFor("platforms")}
        />
        <TextField
          name="industries"
          label={t("fields.industries")}
          optional={t("optional")}
          placeholder={t("fields.industriesHint")}
          error={errorFor("industries")}
        />
      </Group>

      <Group title={t("groups.search")}>
        <ChoiceField
          name="availability"
          label={t("fields.availability")}
          options={APPLICATION_AVAILABILITY.map((value) => ({ value, label: tOptions(`availability.${value}`) }))}
          error={errorFor("availability")}
        />
        <CheckboxField name="confidential" label={t("fields.confidential")} />
      </Group>

      <Group title={t("groups.confirm")}>
        <CheckboxField name="own_work" label={t("fields.own_work")} error={errorFor("own_work")} />
        <CheckboxField
          name="consent"
          label={t.rich("fields.consent", {
            link: (chunks) => (
              <Link href="/privacy" target="_blank" className="font-medium text-accent underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
          error={errorFor("consent")}
        />
      </Group>

      <div className="space-y-6">
        <aside className="border-s-2 border-accent ps-5">
          <h3 className="text-sm font-semibold">{t("goodToKnowTitle")}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{t("goodToKnow")}</p>
        </aside>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-strong sm:w-auto"
        >
          {t("submit")}
        </button>
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}
      </div>
    </form>
  );
}

const ERROR_KEYS: Record<string, true> = {
  required: true,
  tooLong: true,
  invalidEmail: true,
  invalidUrl: true,
  invalidLinkedin: true,
  mustAccept: true,
};

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Label({ htmlFor, children, optional }: { htmlFor?: string; children: ReactNode; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-2 text-[15px] font-medium">
      {children}
      {optional && <span className="text-sm font-normal text-muted">({optional})</span>}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {message}
    </p>
  );
}

function TextField({
  name,
  label,
  type = "text",
  optional,
  hint,
  error,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  optional?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  dir?: "ltr" | "rtl" | "auto";
}) {
  const describedBy = [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ");
  return (
    <div>
      <Label htmlFor={name} optional={optional}>
        {label}
      </Label>
      <input
        id={name}
        name={name}
        type={type}
        dir={rest.dir ?? "auto"}
        placeholder={rest.placeholder}
        autoComplete={rest.autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`${inputClass} text-start`}
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

function SelectField({
  name,
  label,
  placeholder,
  options,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <select
          id={name}
          name={name}
          defaultValue=""
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`${inputClass} appearance-none pe-10`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

/** Radio buttons or checkboxes styled as chips. */
function ChoiceField({
  name,
  label,
  options,
  multiple = false,
  optional,
  error,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  multiple?: boolean;
  optional?: string;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} aria-invalid={error ? true : undefined}>
      <legend className="mb-2.5 flex items-baseline gap-2 text-[15px] font-medium">
        {label}
        {optional && <span className="text-sm font-normal text-muted">({optional})</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input type={multiple ? "checkbox" : "radio"} name={name} value={option.value} className="peer sr-only" />
            <span
              className={
                "inline-flex select-none items-center rounded-full border px-4 py-2 text-[15px] transition-colors " +
                (error ? "border-danger/60 " : "border-line ") +
                "hover:border-ink/40 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper " +
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
              }
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </fieldset>
  );
}

function CheckboxField({ name, label, error }: { name: string; label: ReactNode; error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed">
        <input
          type="checkbox"
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-1 size-[18px] shrink-0 cursor-pointer accent-accent"
        />
        <span>{label}</span>
      </label>
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
