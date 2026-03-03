import { isAuthenticated } from "@/lib/auth";
import { AdminNav } from "@/components/ui/AdminNav";
import { LoginForm } from "./login-form";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {/* Background grid */}
        <div
          className="fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
