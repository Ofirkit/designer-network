export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Accepts tags like "en", "he", "pt-BR". Anything else is ignored before we
// try to load a message file, so user input never reaches the import path.
const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Z]{2})?$/;

export function isLocaleTag(value: string | undefined | null): value is string {
  return !!value && LOCALE_PATTERN.test(value);
}

/**
 * Text direction comes from the locale itself (Intl), so adding a new
 * right-to-left language (e.g. he.json) needs no code change here.
 */
export function getDirection(locale: string): "ltr" | "rtl" {
  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      getTextInfo?: () => { direction?: string };
      textInfo?: { direction?: string };
    };
    const info = intlLocale.getTextInfo?.() ?? intlLocale.textInfo;
    if (info?.direction === "rtl") return "rtl";
    if (info?.direction === "ltr") return "ltr";
  } catch {
    // fall through to the static list
  }
  const base = locale.split("-")[0];
  return ["he", "ar", "fa", "ur", "yi"].includes(base) ? "rtl" : "ltr";
}
