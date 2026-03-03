import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";
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

import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/utils";

const title = `${SITE_NAME} | Timeline`;
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  robots: "index, follow",
  alternates: {
    canonical: "/en",
    languages: { en: "/en", fa: "/fa" },
    types: {
      "application/rss+xml": [
        { url: "/api/rss", title: `${SITE_NAME} (English)` },
        { url: "/api/rss/fa", title: "عملیات خشم حماسی (فارسی)" },
      ],
      "application/atom+xml": [
        { url: "/api/atom", title: `${SITE_NAME} — Atom (English)` },
        { url: "/api/atom/fa", title: "عملیات خشم حماسی — Atom (فارسی)" },
      ],
    },
  },
  openGraph: {
    type: "website",
    title,
    description,
    siteName: new URL(SITE_URL).host,
    url: SITE_URL,
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js-ready')" }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} antialiased bg-black text-white ${locale === "fa" ? "font-vazirmatn" : ""}`}
      >
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", color: "#a1a1aa", fontFamily: "sans-serif" }}>
            <h1 style={{ color: "white", marginBottom: "1rem" }}>Operation Epic Fury</h1>
            <p>This site requires JavaScript for the interactive timeline.</p>
            <p style={{ marginTop: "0.5rem" }}>
              <a href="/api/rss" style={{ color: "#ef4444" }}>Subscribe via RSS</a> to follow events without JavaScript.
            </p>
          </div>
        </noscript>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
        <MotionProvider>
          {children}
        </MotionProvider>
        <ServiceWorkerRegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
