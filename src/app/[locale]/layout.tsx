import { notFound } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SupportButton } from "@/components/ui/SupportButton";
import { getDictionary } from "@/i18n";
import { type Locale, locales } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/LocaleContext";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <LocaleProvider locale={locale as Locale} dict={dict}>
      {children}
      <NotificationBell />
      <SupportButton />
    </LocaleProvider>
  );
}
