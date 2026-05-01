"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Create session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Failed to create session. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md glassmorphism p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex justify-center mb-8">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Activity className="text-accent h-8 w-8" />
              <span className="font-heading font-black text-2xl tracking-wide">HealthAI</span>
            </div>
          </Link>
        </div>

        <h2 className="text-2xl font-heading font-bold text-center mb-6">Create Account</h2>
        
        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-500/20">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-foreground/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-foreground/70 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-background font-bold rounded-xl px-4 py-3 hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-foreground/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
