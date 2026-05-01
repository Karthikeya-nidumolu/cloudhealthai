"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function AIGeneratedIllustration({ report }: { report: any }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent strict-mode double fetching which costs API credits
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const generateImage = async () => {
      try {
        setLoading(true);
        // Build an optimized Stable Diffusion Prompt based on the medical report
        // Extract the EXACT text values from the parameters to force SD3 to draw what the card says
        const exactDetails = report.parameters?.map((p: any) => {
          // E.g., "BONE FRACTURE LOCATION near leg"
          return `${p.name} ${p.value || p.status || ""}`;
        }).join(". ") || "";

        const summary = report.summary || "";

        // Combine the summary and the exact parameter text directly into the SD3 prompt!
        const visualTarget = report.visual_target || "Anatomical structures";

        // Combine the summary and the exact parameter text directly into the illustration prompt
        let prompt = `A highly accurate, clinical 3D medical anatomical visualization of the ${visualTarget}. Specific medical context to highlight: ${summary}. ${exactDetails}. Transparent X-ray aesthetic with glowing internal structures on a pure black background. Style: Professional medical textbook diagram, CGI anatomy render, translucent skin, visible internal bones and organs, clinical blue tones, hyper-accurate medical diagnostic visualization, CT scan style. NO human faces, pure clinical anatomy.`;

        // We fetch from the backend API to avoid adblockers blocking external image generation APIs on the frontend
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        
        const data = await res.json();
        
        if (res.ok && data.image) {
          // The API returns a base64 encoded string
          setImageUrl(`data:image/jpeg;base64,${data.image}`);
        } else {
          console.error("Image Gen Error:", data.error || "Unknown error");
          // If it fails, keep imageUrl as null so it shows the "Unavailable" fallback UI instead of a wrong body part
          setImageUrl(null);
        }
      } catch (e) {
        console.error("Image generation error:", e);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateImage();
  }, [report.id, report.visual_target, report.parameters, report.summary]);

  return (
    <div className="relative w-full aspect-square glassmorphism rounded-3xl overflow-hidden border border-card-border bg-slate-900 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black text-accent border border-accent/20 flex items-center gap-2 uppercase tracking-widest">
        <Sparkles className="w-3 h-3" /> Diagnostic Illustration
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 text-accent animate-pulse px-6">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="font-bold text-sm">Generating View...</p>
            <p className="text-[9px] text-accent/50 uppercase tracking-widest mt-1">Analyzing anatomical markers</p>
          </div>
        </div>
      ) : imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Medical Illustration" 
          className="w-full h-full object-cover animate-in fade-in duration-1000"
          onError={() => {
            console.error("Image failed to load");
            setImageUrl(null);
          }}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="p-4 bg-white/5 rounded-full border border-white/10">
            <ImageIcon className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-foreground/40 text-xs font-sans">Specialized illustration unavailable for this report type.</p>
        </div>
      )}
    </div>
  );
}
