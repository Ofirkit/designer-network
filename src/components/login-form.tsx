"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export function LoginForm() {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const email = new FormData(event.currentTarget).get("email");
    if (!emailSchema.safeParse(email).success) {
      setError(t("form.errors.invalidEmail"));
      return;
    }
    setError(null);
    // Later stage: send a magic link. Always answer "check your email",
    // whether or not the account exists.
    setNotice(t("login.notConnected"));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-[15px] font-medium">
          {t("login.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : undefined}
          className="block w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-start text-base transition-colors hover:border-ink/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 aria-[invalid=true]:border-danger"
        />
        {error && (
          <p id="email-error" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
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
