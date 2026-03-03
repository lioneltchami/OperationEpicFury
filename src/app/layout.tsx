import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { ServiceWorkerRegistration } from "@/components/ui/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/utils";

const title = `${SITE_NAME} | Timeline`;
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  robots: "index, follow",
  alternates: {
    canonical: "/en",
    languages: { en: "/en", fr: "/fr" },
    types: {
      "application/rss+xml": [
        { url: "/api/rss", title: `${SITE_NAME} (English)` },
        { url: "/api/rss/fr", title: "Opération Epic Fury (Français)" },
      ],
      "application/atom+xml": [
        { url: "/api/atom", title: `${SITE_NAME} — Atom (English)` },
        { url: "/api/atom/fr", title: "Opération Epic Fury — Atom (Français)" },
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

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js-ready')",
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} antialiased bg-black text-white`}
      >
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        <noscript>
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#a1a1aa",
              fontFamily: "sans-serif",
            }}
          >
            <h1 style={{ color: "white", marginBottom: "1rem" }}>
              Operation Epic Fury
            </h1>
            <p>This site requires JavaScript for the interactive timeline.</p>
            <p style={{ marginTop: "0.5rem" }}>
              <a href="/api/rss" style={{ color: "#ef4444" }}>
                Subscribe via RSS
              </a>{" "}
              to follow events without JavaScript.
            </p>
          </div>
        </noscript>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorkerRegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
