"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { TextField } from "@/components/form-fields";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailSchema.safeParse(new FormData(event.currentTarget).get("email")).success) {
      setError(t("form.errors.invalidEmail"));
      return;
    }
    setError(undefined);
    // Later stage: Supabase resetPasswordForEmail. Always show the same
    // answer, whether or not the account exists.
    setNotice(t("forgotPassword.notConnected"));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <TextField name="email" type="email" label={t("login.email")} autoComplete="email" dir="ltr" error={error} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-strong"
      >
        {t("forgotPassword.submit")}
      </button>
      {notice && (
        <p role="status" className="text-sm text-muted">
          {notice}
        </p>
      )}
    </form>
  );
}
