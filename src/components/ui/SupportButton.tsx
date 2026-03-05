"use client";

const kofiUrl = process.env.NEXT_PUBLIC_KOFI_URL;

export function SupportButton() {
  if (!kofiUrl) return null;

  return (
    <a
      href={kofiUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed bottom-6 left-6 z-50
        h-11 px-4 flex items-center gap-2
        bg-zinc-900 border border-zinc-700
        rounded-full shadow-lg shadow-black/40
        hover:bg-zinc-800 hover:border-red-500/40 transition-colors
        text-zinc-400 hover:text-red-400
        text-xs font-mono
      "
      aria-label="Support this project"
    >
      <svg
        className="w-4 h-4 text-red-500"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z" />
      </svg>
      <span className="hidden sm:inline">Support</span>
    </a>
  );
}
