"use client";

import { useState, type ReactNode } from "react";

// Shared form fields: labels, hints, errors and focus states, RTL-safe.
// Used by the signup form now, and the profile editor later.

export const inputClass =
  "block w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 " +
  "transition-colors hover:border-ink/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-soft/40";

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

export function Label({ htmlFor, children, optional }: { htmlFor?: string; children: ReactNode; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-2 text-[15px] font-medium">
      {children}
      {optional && <span className="text-sm font-normal text-muted">({optional})</span>}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function TextField({
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

export function SelectField({
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
export function ChoiceField({
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

export function CheckboxField({ name, label, error }: { name: string; label: ReactNode; error?: string }) {
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

export function PasswordField({
  name,
  label,
  hint,
  error,
  autoComplete,
  showLabel,
  hideLabel,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  autoComplete: "new-password" | "current-password";
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const showHint = hint && !error;
  const describedBy = [showHint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ");
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          dir="ltr"
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClass} pe-20 text-start`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={name}
          aria-pressed={visible}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1 text-sm font-medium text-muted hover:text-ink"
        >
          {visible ? hideLabel : showLabel}
        </button>
      </div>
      {showHint && (
        <p id={`${name}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
