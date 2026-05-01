import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HealthAI Cloud",
  description: "AI-Powered Medical Report Analysis & 3D Visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-background text-foreground relative">
        {/* Global Education Disclaimer */}
        <div className="fixed bottom-4 right-4 z-[100] bg-background/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-2xl text-xs text-foreground/80 font-medium select-none flex items-center gap-2 hover:bg-background/95 hover:border-white/20 transition-all duration-300">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Educational Purposes Only
        </div>
        
        <div className="pointer-events-none fixed inset-0 z-50 h-full w-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] opacity-[0.03] mix-blend-overlay"></div>
        {children}
      </body>
    </html>
  );
}
