import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip admin, api, _next, and static files
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if the path already has a valid locale
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameLocale) {
    // Pass locale as a request header so server components can read it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-next-locale", pathnameLocale);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Detect preferred locale from Accept-Language header
  const acceptLang = request.headers.get("accept-language") || "";
  const prefersFrench = acceptLang.includes("fr");
  const detectedLocale = prefersFrench ? "fr" : defaultLocale;

  // Rewrite to locale-prefixed path (avoids HTTP redirect round-trip)
  const url = request.nextUrl.clone();
  url.pathname = `/${detectedLocale}${pathname}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-locale", detectedLocale);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next|api|admin|favicon.ico|icon.svg).*)"],
};
