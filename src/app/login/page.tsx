import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/container";
import { LoginForm } from "@/components/login-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("login");
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Container className="py-20 sm:py-32">
          <div className="max-w-md">
            <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t("title")}</h1>
            <p className="mt-4 text-lg text-muted">{t("intro")}</p>
            <div className="mt-10">
              <LoginForm />
            </div>
            <p className="mt-8 text-[15px] text-muted">
              {t.rich("noAccount", {
                link: (chunks) => (
                  <Link href="/#signup" className="font-medium text-accent underline underline-offset-4">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
