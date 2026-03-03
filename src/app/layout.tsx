import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MotionProvider } from "@/components/providers/MotionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  display: "swap",
});

const siteUrl = "https://opepicfury.info";
const title = "Operation Epic Fury | Timeline";
const description =
  "A minute-by-minute timeline of Operation Epic Fury — the US-Israel strikes on Iran.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  robots: "index, follow",
  alternates: {
    canonical: "/en",
    languages: { en: "/en", fa: "/fa" },
    types: {
      "application/rss+xml": [
        { url: "/api/rss", title: "Operation Epic Fury (English)" },
        { url: "/api/rss/fa", title: "عملیات خشم حماسی (فارسی)" },
      ],
      "application/atom+xml": [
        { url: "/api/atom", title: "Operation Epic Fury — Atom (English)" },
        { url: "/api/atom/fa", title: "عملیات خشم حماسی — Atom (فارسی)" },
      ],
    },
  },
  openGraph: {
    type: "website",
    title,
    description,
    siteName: "opepicfury.info",
    url: siteUrl,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} antialiased bg-black text-white ${locale === "fa" ? "font-vazirmatn" : ""}`}
      >
        <MotionProvider>
          {children}
        </MotionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
