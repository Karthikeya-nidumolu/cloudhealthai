"use client";

import { useEffect, useRef } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroScene from "@/components/landing/HeroScene";
import { UploadCloud, Brain, MapPin } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative bg-background">
      <Navbar />

      {/* The 3D Scene Background Fixed Layer */}
      <HeroScene />

      {/* Foreground Scrollable Content */}
      <div className="relative z-10 w-full">
        {/* Section 1: Hero (0-25%) */}
        <section className="min-h-screen flex items-center px-8 md:px-24">
          <div className="max-w-xl glassmorphism p-10 rounded-3xl animate-in fade-in slide-in-from-bottom duration-1000">
            <h1 className="text-5xl font-heading font-black text-foreground leading-tight mb-6">
              Understand Your Health Like <span className="text-accent text-glow">Never Before</span>
            </h1>
            <p className="text-lg text-foreground/80 mb-8 font-sans leading-relaxed">
              Upload your raw medical parameters. Get instant, plain-language insights paired with dynamic 3D visualizations highlighting potential focus areas.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="bg-accent text-background px-8 py-4 rounded-full font-bold hover:shadow-[0_0_20px_rgba(0,245,255,0.6)] transition-all">
                  Get Your Analysis
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Upload (25-50%) */}
        <section className="min-h-screen flex items-center px-8 md:px-24">
          <div className="max-w-xl glassmorphism p-10 rounded-3xl mt-32">
            <div className="bg-accent/20 p-4 rounded-full w-max mb-6">
              <UploadCloud className="text-accent h-8 w-8" />
            </div>
            <h2 className="text-4xl font-heading font-bold mb-4">Upload Your Report</h2>
            <p className="text-foreground/80 text-lg leading-relaxed mb-6">
              Simply drop in your PDF lab returns. Our secure system instantly extracts thousands of parameters, from lipid panels to liver enzymes, without storing personally identifying data in a readable state.
            </p>
            <ul className="space-y-3 font-sans text-sm text-foreground/70">
              <li className="flex items-center gap-2">✓ Military-grade encryption</li>
              <li className="flex items-center gap-2">✓ Support for 500+ lab formats</li>
              <li className="flex items-center gap-2">✓ 100% HIPAA compliant infrastructure</li>
            </ul>
          </div>
        </section>

        {/* Section 3: AI Analysis (50-75%) */}
        <section className="min-h-screen flex items-center px-8 md:px-24">
          <div className="max-w-xl glassmorphism p-10 rounded-3xl mt-32">
            <div className="bg-accent/20 p-4 rounded-full w-max mb-6">
              <Brain className="text-accent h-8 w-8 animate-pulse" />
            </div>
            <h2 className="text-4xl font-heading font-bold mb-4">AI Reads It For You</h2>
            <p className="text-foreground/80 text-lg leading-relaxed">
              Powered by lightning-fast Llama-3 parsing architecture. Our medical extraction logic identifies anomalies and explains them in simple everyday terms. See your body mapped out in real-time, focusing directly on the areas that need attention. No more googling scary terms.
            </p>
          </div>
        </section>

        {/* Section 4: Find Doctor (75-100%) */}
        <section className="min-h-[100vh] flex flex-col justify-center px-8 md:px-24 pb-32">
          <div className="max-w-xl glassmorphism p-10 rounded-3xl mt-32 mb-16">
            <div className="bg-accent/20 p-4 rounded-full w-max mb-6">
              <MapPin className="text-accent h-8 w-8 bounce-animation" />
            </div>
            <h2 className="text-4xl font-heading font-bold mb-4">Find Your Specialist</h2>
            <p className="text-foreground/80 text-lg leading-relaxed mb-6">
              If an abnormality is detected, the AI automatically suggests the right specialist. Integrated with mapped coordinates, finding the top-rated local doctor for a follow up takes only one click.
            </p>
          </div>
          
          <footer className="text-center w-full max-w-xl text-sm text-foreground/40 mt-auto">
            © {new Date().getFullYear()} HealthAI Cloud. Not a medical diagnostic tool.
          </footer>
        </section>
      </div>

      <style jsx>{`
        .text-glow {
          text-shadow: 0 0 15px rgba(0, 245, 255, 0.5);
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .bounce-animation {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </main>
  );
}
