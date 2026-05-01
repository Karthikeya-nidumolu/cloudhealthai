"use client";

import { ShieldAlert, CheckCircle, Activity, HeartPulse } from "lucide-react";
import jsPDF from "jspdf";

export default function ParameterCards({ report }: { report: any }) {
  const isHealthy = report.risk_level === "Low" && report.parameters?.every((p: any) => p.status?.toLowerCase() === "normal");

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("HealthAI Cloud - Report Summary", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    const lines = doc.splitTextToSize(`Summary: ${report.summary}`, 170);
    doc.text(lines, 20, 35);
    
    let y = 45 + (lines.length * 7);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Risk Level: ${report.risk_level}`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text("Key Parameters:", 20, y);
    y += 10;
    
    doc.setFontSize(11);
    report.parameters?.forEach((p: any) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${p.name}: ${p.value} (${p.status})`, 25, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      
      const expLines = doc.splitTextToSize(p.explanation || "", 160);
      doc.text(expLines, 25, y);
      y += (expLines.length * 7) + 5;
    });

    if (report.suggested_specialist && report.suggested_specialist.toLowerCase() !== "none") {
      doc.setFont("helvetica", "bold");
      y += 10;
      doc.text(`Suggested Specialist: ${report.suggested_specialist}`, 20, y);
    }

    doc.save(`HealthAI_Report_${report.filename || Date.now()}.pdf`);
  };

  if (isHealthy) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glassmorphism rounded-3xl border-green-500/30 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-4xl font-heading font-black text-green-400 mb-4">All looks good! 🎉</h2>
        <p className="text-xl text-foreground/80 max-w-xl mx-auto mb-8 font-sans">
          {report.summary || "Your latest parameters are all within the normal range. Keep up the great lifestyle!"}
        </p>
        <button onClick={downloadReport} className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full font-bold">
          Download PDF Proof
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {report.risk_level === 'High' && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-50 p-6 rounded-2xl flex items-start gap-4 animate-pulse">
          <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-heading font-bold text-xl text-red-400 mb-1">EMERGENCY ALERT: High Risk Detected</h3>
            <p className="text-red-200/80">
              Multiple critical parameters are significantly out of bounds. Please consult a doctor immediately.
            </p>
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-2xl border border-card-border overflow-hidden relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-bold text-2xl">Overview Summary</h2>
          </div>
          <button onClick={downloadReport} className="px-5 py-2 bg-accent text-background whitespace-nowrap rounded-full font-bold text-sm hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] transition-all">
            Download PDF
          </button>
        </div>
        
        <div className="space-y-4">
          {(() => {
            const parts = report.summary?.split(/Quick Suggestions:?/i);
            return (
              <>
                <p className="text-foreground/90 text-lg leading-relaxed font-sans">{parts[0]}</p>
                {parts.length > 1 && (
                  <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                       <HeartPulse className="w-4 h-4 text-accent" />
                       <span className="text-xs font-black uppercase tracking-widest text-accent">Lifestyle Suggestions</span>
                    </div>
                    <p className="text-foreground/80 text-sm italic font-sans">{parts[1].trim()}</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.parameters?.map((param: any, i: number) => {
          const isBad = param.status?.toLowerCase() !== "normal";
          return (
            <div key={i} className={`glassmorphism p-5 rounded-2xl border-l-4 ${isBad ? 'border-l-red-500' : 'border-l-accent'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex border border-white/5 rounded-full px-3 py-1 items-center gap-2 bg-white/5">
                  <Activity className={`w-3 h-3 ${isBad ? 'text-red-400' : 'text-accent'}`} />
                  <span className="text-xs font-bold font-sans uppercase tracking-wider">{param.name}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${
                    isBad ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'
                  }`}
                >
                  {param.status}
                </span>
              </div>
              <div className="text-2xl font-bold font-heading mb-3">{param.value}</div>
              <p className="text-sm text-foreground/60">{param.explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
