import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PRODUCT_NAME } from "@/config/site";
import { Container } from "./container";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-auto border-t border-line">
      <Container className="flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t("rights", { year: new Date().getFullYear(), product: PRODUCT_NAME })}</p>
        <Link href="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
          {t("privacy")}
        </Link>
      </Container>
    </footer>
  );
}
