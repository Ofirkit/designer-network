import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const SECTIONS = ["what", "why", "who", "voluntary", "control"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const contactEmail = process.env.ADMIN_EMAIL;
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Container className="py-16 sm:py-24">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">{t("title")}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t("intro")}</p>
          <dl className="mt-14 max-w-3xl divide-y divide-line border-y border-line">
            {SECTIONS.map((key) => (
              <div key={key} className="grid gap-2 py-7 sm:grid-cols-[12rem_1fr] sm:gap-8">
                <dt className="font-semibold">{t(`sections.${key}.title`)}</dt>
                <dd className="text-[17px] leading-relaxed text-ink/80">{t(`sections.${key}.body`)}</dd>
              </div>
            ))}
          </dl>
          {contactEmail && (
            <p className="mt-8 text-[15px] text-muted">
              {t.rich("contact", {
                email: () => (
                  <a href={`mailto:${contactEmail}`} className="font-medium text-accent underline underline-offset-4">
                    {contactEmail}
                  </a>
                ),
              })}
            </p>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
