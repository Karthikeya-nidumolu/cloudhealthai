"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import ParameterCards from "@/components/dashboard/ParameterCards";
import AIGeneratedIllustration from "@/components/dashboard/AIGeneratedIllustration";
import DoctorFinder from "@/components/dashboard/DoctorFinder";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      try {
        const docRef = doc(db, "reports", reportId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, router]);

  if (loading) {
    return <div className="py-24 text-center text-xl text-foreground/50 animate-pulse">Loading report insights...</div>;
  }

  if (!report) return null;

  const isHealthy = report.risk_level === "Low" && report.parameters?.every((p: any) => p.status?.toLowerCase() === "normal");

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-foreground/60 hover:text-accent mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Analysis for {report.filename || "Lab Report"}</h1>
          <p className="text-foreground/50 mt-1">Processed on {report.createdAt ? new Date(report.createdAt.toMillis()).toLocaleString() : "Recently"}</p>
        </div>
        
        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to delete this report?")) return;
            const user = (await import("@/lib/firebase")).auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch(`/api/reports/${reportId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) router.push("/dashboard");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          Delete Report Data
        </button>
      </div>

      {!isHealthy && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8">
            <ParameterCards report={report} />
          </div>
          <div className="xl:col-span-4 sticky top-24">
            <h3 className="font-heading font-bold text-xl mb-4 ml-2">Affected Systems</h3>
            <AIGeneratedIllustration report={report} />
          </div>
        </div>
      )}

      {isHealthy && (
        <div className="max-w-4xl mx-auto">
          <ParameterCards report={report} />
        </div>
      )}

      <DoctorFinder specialist={report.suggested_specialist} />
    </div>
  );
}
