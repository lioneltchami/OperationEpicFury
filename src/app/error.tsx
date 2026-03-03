"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-white mb-4">
          Something Went Wrong
        </h1>
        <p className="text-zinc-400 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/en"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Back to Timeline
          </Link>
        </div>
      </div>
    </main>
  );
}
