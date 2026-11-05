import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default async function ThanksPage() {
  const t = await getTranslations("thanks");
  return (
    <>
      <SiteHeader showApply={false} />
      <main id="main" className="flex-1">
        <Container className="py-24 sm:py-36">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{t("body")}</p>
          <Link href="/" className="mt-10 inline-block text-[15px] font-medium text-accent underline-offset-4 hover:underline">
            {t("back")}
          </Link>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
