"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { PasswordField, TextField } from "@/components/form-fields";
import { loginSchema } from "@/lib/validation/signup";

export function LoginForm() {
  const t = useTranslations();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const data = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (!result.success) {
      const next: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as "email" | "password";
        next[key] ??= t(`form.errors.${issue.message === "invalidEmail" ? "invalidEmail" : "required"}`);
      }
      setErrors(next);
      return;
    }
    setErrors({});
    // Later stage: Supabase signInWithPassword. On failure show only
    // login.wrongCredentials, never which field was wrong.
    setNotice(t("login.notConnected"));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <TextField name="email" type="email" label={t("login.email")} autoComplete="email" dir="ltr" error={errors.email} />
      <div>
        <PasswordField
          name="password"
          label={t("login.password")}
          autoComplete="current-password"
          showLabel={t("form.showPassword")}
          hideLabel={t("form.hidePassword")}
          error={errors.password}
        />
        <Link href="/forgot-password" className="mt-2 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline">
          {t("login.forgot")}
        </Link>
      </div>
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-strong"
      >
        {t("login.submit")}
      </button>
      {notice && (
        <p role="status" className="text-sm text-muted">
          {notice}
        </p>
      )}
    </form>
  );
}
