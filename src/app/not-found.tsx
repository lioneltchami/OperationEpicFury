import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-red-600/20 select-none">404</p>
        <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-zinc-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/en"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Back to Timeline
        </Link>
      </div>
    </main>
  );
}
