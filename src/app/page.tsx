import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ApplicationForm } from "@/components/application-form";
import { Container } from "@/components/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PRODUCT_NAME } from "@/config/site";

const BENEFITS = ["review", "profile", "answers", "control"] as const;
const STEPS = ["apply", "review", "profile"] as const;

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 md:block">
      <span className="text-sm tabular-nums text-muted md:mb-3 md:block">{index}</span>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{children}</h2>
    </div>
  );
}

export default async function LandingPage() {
  const t = await getTranslations();

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* 1. Hero */}
        <section>
          <Container className="pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
            <p className="text-sm font-medium text-accent">{t("hero.eyebrow")}</p>
            <h1 className="mt-5 max-w-4xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[5.25rem]">
              {t.rich("hero.headline", { br: () => <br /> })}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{t("hero.subheadline", { product: PRODUCT_NAME })}</p>
            <a
              href="#apply"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-accent-strong"
            >
              {t("hero.cta")}
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </a>
          </Container>
        </section>

        {/* 2. What you get */}
        <section className="border-t border-line">
          <Container className="grid gap-10 py-16 sm:py-24 md:grid-cols-[1fr_2fr]">
            <SectionTitle index="01">{t("benefits.title")}</SectionTitle>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {BENEFITS.map((key) => (
                <li key={key} className="border-t border-ink pt-5 text-lg leading-snug sm:text-xl">
                  {t(`benefits.items.${key}`)}
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* 3. How it works */}
        <section className="border-t border-line">
          <Container className="grid gap-10 py-16 sm:py-24 md:grid-cols-[1fr_2fr]">
            <SectionTitle index="02">{t("howItWorks.title")}</SectionTitle>
            <ol className="divide-y divide-line">
              {STEPS.map((key, i) => (
                <li key={key} className="flex gap-6 py-6 first:pt-0 last:pb-0 sm:gap-10">
                  <span className="w-10 shrink-0 text-4xl font-light tabular-nums text-accent sm:text-5xl">{i + 1}</span>
                  <p className="pt-1.5 text-lg leading-snug sm:pt-2.5 sm:text-xl">{t(`howItWorks.steps.${key}`)}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Not a hiring agency: stated plainly, on purpose (legal position). */}
        <section className="border-t border-line">
          <Container className="grid gap-10 py-16 sm:py-24 md:grid-cols-[1fr_2fr]">
            <SectionTitle index="03">{t("notAgency.title")}</SectionTitle>
            <div className="max-w-2xl">
              <p className="text-2xl leading-snug tracking-tight sm:text-3xl">{t("notAgency.lead")}</p>
              <p className="mt-5 text-lg leading-relaxed text-muted">{t("notAgency.body")}</p>
            </div>
          </Container>
        </section>

        {/* 4. Who it's for  +  5. Founding members */}
        <section className="border-t border-line">
          <Container className="grid gap-10 py-16 sm:py-24 md:grid-cols-[1fr_2fr]">
            <SectionTitle index="04">{t("audience.title")}</SectionTitle>
            <p className="max-w-2xl text-2xl leading-snug tracking-tight sm:text-3xl">{t("audience.body")}</p>
          </Container>
        </section>

        <section className="bg-wash">
          <Container className="grid gap-10 py-16 sm:py-24 md:grid-cols-[1fr_2fr]">
            <SectionTitle index="05">{t("founding.title")}</SectionTitle>
            <p className="max-w-2xl text-lg leading-relaxed text-ink/80 sm:text-xl">{t("founding.body")}</p>
          </Container>
        </section>

        {/* 6. Application form  +  7. Good to know (inside the form, above submit) */}
        <section id="apply" className="scroll-mt-4 border-t border-line">
          <Container className="grid gap-12 py-16 sm:py-24 md:grid-cols-[1fr_2fr]">
            <div className="md:sticky md:top-10 md:self-start">
              <SectionTitle index="06">{t("form.title")}</SectionTitle>
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted">{t("form.intro")}</p>
              <div className="mt-8 max-w-xs rounded-xl border border-line p-5">
                <h3 className="text-sm font-semibold">{t("privacyNotice.title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t("privacyNotice.body")}</p>
                <Link
                  href="/privacy"
                  className="mt-3 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  {t("privacyNotice.link")}
                </Link>
              </div>
            </div>
            <div className="max-w-2xl">
              <ApplicationForm />
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
