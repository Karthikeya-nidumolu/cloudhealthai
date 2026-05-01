"use client";

import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    // Delete session cookie
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <div className="flex items-center gap-2">
              <Activity className="text-accent h-6 w-6" />
              <span className="font-heading font-bold text-xl text-foreground">Dashboard</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-foreground/70 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col">
        {children}
      </main>
    </div>
  );
}
