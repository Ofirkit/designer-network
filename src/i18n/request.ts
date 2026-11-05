import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocaleTag } from "./config";

type Messages = Record<string, unknown>;

async function loadMessages(locale: string): Promise<Messages | null> {
  try {
    return (await import(`../../messages/${locale}.json`)).default as Messages;
  } catch {
    return null; // no message file for this locale
  }
}

/** Candidate locales, in order: cookie, then the browser's Accept-Language. */
async function candidateLocales(): Promise<string[]> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const fromHeader = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim())
    .flatMap((tag) => [tag, tag.split("-")[0]]);
  return [fromCookie, ...fromHeader].filter(isLocaleTag);
}

// A locale is "supported" when /messages/{locale}.json exists. Only en.json
// ships today, so everyone gets English.
export default getRequestConfig(async () => {
  for (const locale of await candidateLocales()) {
    if (locale === DEFAULT_LOCALE) break;
    const messages = await loadMessages(locale);
    if (messages) return { locale, messages };
  }
  return {
    locale: DEFAULT_LOCALE,
    messages: (await loadMessages(DEFAULT_LOCALE))!,
  };
});
