import Link from "next/link";
import { Activity } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glassmorphism px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Activity className="text-accent h-6 w-6" />
          <span className="font-heading font-bold text-xl tracking-wide text-foreground">HealthAI</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
          <Link href="#about" className="hover:text-accent transition-colors">About Us</Link>
          <Link href="#how-it-works" className="hover:text-accent transition-colors">How It Works</Link>
          <Link href="#contact" className="hover:text-accent transition-colors">Contact Us</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-accent transition-colors">
            Login
          </Link>
          <Link href="/signup" className="bg-accent text-background px-4 py-2 rounded-full text-sm font-bold hover:shadow-[0_0_15px_rgba(0,245,255,0.5)] transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
