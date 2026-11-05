"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import { CheckboxField, PasswordField, TextField } from "@/components/form-fields";
import { PASSWORD_MIN_LENGTH, signupSchema } from "@/lib/validation/signup";

type FieldErrors = Partial<Record<"email" | "password" | "consent", string>>;

const ERROR_KEYS = new Set(["required", "tooLong", "invalidEmail", "passwordTooShort", "mustAccept"]);

export function SignupForm() {
  const t = useTranslations("form");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const summaryRef = useRef<HTMLParagraphElement>(null);

  const errorFor = (name: keyof FieldErrors) =>
    errors[name] ? t(`errors.${errors[name]}`, { min: PASSWORD_MIN_LENGTH }) : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const data = new FormData(event.currentTarget);
    const result = signupSchema.safeParse({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      consent: data.get("consent") === "on",
    });
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = ERROR_KEYS.has(issue.message) ? issue.message : "required";
      }
      setErrors(next);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    // Next stage: server action (honeypot, 3-second check, rate limit,
    // Supabase signUp with email confirmation), then redirect to /check-email.
    setNotice(t("notConnected"));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-7">
      {Object.keys(errors).length > 0 && (
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

      <TextField name="email" type="email" label={t("fields.email")} autoComplete="email" dir="ltr" error={errorFor("email")} />
      <PasswordField
        name="password"
        label={t("fields.password")}
        hint={t("fields.passwordHint", { min: PASSWORD_MIN_LENGTH })}
        autoComplete="new-password"
        showLabel={t("showPassword")}
        hideLabel={t("hidePassword")}
        error={errorFor("password")}
      />
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

      <div className="space-y-6 pt-2">
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
        <p className="text-[15px] text-muted">
          {t.rich("haveAccount", {
            link: (chunks) => (
              <Link href="/login" className="font-medium text-accent underline underline-offset-4">
                {chunks}
              </Link>
            ),
          })}
        </p>
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}
      </div>
    </form>
  );
}
