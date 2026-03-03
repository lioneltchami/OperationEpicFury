export default function Loading() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-3 w-3 rounded-full bg-red-600 animate-pulse-dot" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    </main>
  );
}
