"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  }

  const isActive = (path: string) =>
    path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Left: brand + nav links */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            {/* Live dot */}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-bold text-white tracking-wide">
              OEF Admin
            </span>
          </Link>

          {/* Separator */}
          <div className="hidden sm:block w-px h-5 bg-zinc-800" />

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink
              href="/admin"
              active={isActive("/admin") && !isActive("/admin/new")}
            >
              Events
            </NavLink>
            <NavLink href="/admin/new" active={isActive("/admin/new")}>
              New Event
            </NavLink>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <a
            href="/en"
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              text-zinc-400 hover:text-white
              rounded-md hover:bg-zinc-800/80
              transition-all duration-150
            "
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            View Site
          </a>
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
              text-zinc-500 hover:text-red-400
              rounded-md hover:bg-red-950/30
              transition-all duration-150
            "
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150
        ${
          active
            ? "bg-zinc-800 text-white"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
        }
      `}
    >
      {children}
    </Link>
  );
}
