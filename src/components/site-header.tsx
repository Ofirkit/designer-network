import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PRODUCT_NAME } from "@/config/site";
import { Container } from "./container";

export async function SiteHeader({ showSignUp = true }: { showSignUp?: boolean }) {
  const t = await getTranslations("nav");
  return (
    <header className="border-b border-line">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2"
      >
        {t("skipToContent")}
      </a>
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight">
          {PRODUCT_NAME}
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            {t("login")}
          </Link>
          {showSignUp && (
            <Link
              href="/#signup"
              className="rounded-full border border-ink px-4 py-1.5 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
            >
              {t("signUp")}
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}
