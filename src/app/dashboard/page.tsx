"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import ReportUpload from "@/components/dashboard/ReportUpload";
import Link from "next/link";
import { FileText, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchReports = async () => {
      try {
        const q = query(
          collection(db, "reports"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(docs);
      } catch (err) {
        console.error("Error fetching docs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [userId]);

  const deleteReport = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this report and all its analysis data?")) return;

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        // Optimistic update
        setReports(prev => prev.filter(r => r.id !== id));
      } else {
        alert("Failed to delete report.");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Your Health History</h1>
          <p className="text-foreground/70 mt-1">Upload and manage your medical reports.</p>
        </div>
        
        {/* Upload Component triggers modal or inline selection */}
        <ReportUpload userId={userId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-foreground/50">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
            <h3 className="text-xl font-heading mb-2">No reports yet</h3>
            <p className="text-foreground/60 mb-4">Upload your first lab report to get started.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="relative group">
              <Link href={`/dashboard/report/${report.id}`}>
                <div className="glassmorphism p-6 rounded-2xl hover:border-accent/50 transition-colors cursor-pointer flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                       {report.risk_level === 'High' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                          <ShieldAlert className="w-3 h-3" /> High Risk
                        </span>
                      )}
                      {report.risk_level === 'Low' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Normal
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-heading font-bold text-lg mb-2 line-clamp-1">{report.filename || "Lab Report"}</h3>
                  <p className="text-sm text-foreground/60 mb-4 line-clamp-2">{report.summary}</p>
                  
                  <div className="mt-auto flex justify-between items-center text-sm pt-4 border-t border-white/10">
                    <span className="text-foreground/40 text-xs">
                      {report.createdAt ? new Date(report.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
              
              <button 
                onClick={(e) => deleteReport(e, report.id)}
                className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                title="Delete Report"
              >
                <FileText className="w-4 h-4 hidden" /> {/* Dummy to keep imports clean */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
