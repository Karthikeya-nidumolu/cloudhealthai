"use client";

import { useState, useRef } from "react";
import { UploadCloud, Loader } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportUpload({ userId }: { userId: string | null }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      alert("Only PDF and Image files are supported");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.reportId) {
        // Rediret to the newly created report
        router.push(`/dashboard/report/${data.reportId}`);
      } else {
        alert(data.error || "Failed to process report");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload.");
    } finally {
      setLoading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Standard File Upload */}
      <input 
        type="file" 
        accept="application/pdf,image/png,image/jpeg,image/webp" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading || !userId}
        className="bg-accent/20 text-accent border border-accent/40 px-6 py-3 rounded-full font-bold hover:bg-accent hover:text-background transition-all flex justify-center items-center gap-2 disabled:opacity-50 flex-1"
      >
        {loading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <UploadCloud className="w-5 h-5" />
        )}
        {loading ? "Analyzing..." : "Upload Document"}
      </button>

      {/* Mobile Camera Upload */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button 
        onClick={() => cameraInputRef.current?.click()}
        disabled={loading || !userId}
        className="bg-accent text-background border border-accent px-6 py-3 rounded-full font-bold hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 flex-1"
      >
        {loading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        )}
        {loading ? "Scanning..." : "Take a Photo"}
      </button>
    </div>
  );
}
