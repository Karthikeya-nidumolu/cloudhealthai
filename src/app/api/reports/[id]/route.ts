import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!reportId) {
      return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
    }

    const reportRef = adminDb.collection("reports").doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (reportDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await reportRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
