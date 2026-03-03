import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { NotificationBell } from "@/components/ui/NotificationBell";

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
    </LocaleProvider>
  );
}
