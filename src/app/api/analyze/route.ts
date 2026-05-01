import { NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import Groq from "groq-sdk";
import pdf from "pdf-parse-new";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const AI_PROMPT = `
You are a medical report explanation assistant. Do NOT diagnose. Analyze the report and return ONLY a JSON object with: 
- summary: An extremely simple explanation in everyday language (Grade 5 level). 
  - RULE 1: Replace medical jargon with common words (e.g., instead of 'Hypertension', say 'Your blood pressure is high').
  - RULE 2: Explain what it means for the user's daily life. 
  - RULE 3: Provide 2-3 specific, actionable 'Quick Suggestions' (e.g., 'Take less salt', 'Walk for 20 minutes', 'Drink more water').
  - Structure: [Simple Explanation] followed by [Quick Suggestions: ...].
- parameters: Array of objects: { "name": string, "value": string, "status": "normal"|"low"|"high", "explanation": string }
- risk_level (Low/Medium/High)
- suggested_specialist (Specialist name, e.g., 'Cardiologist', or 'None')
- visual_target: A short string identifying the primary body part or organ for visualization (e.g., 'Human Heart', 'Lungs', 'Spine', 'Brain').

CRITICAL RULES:
1. Return ONLY the JSON object. No other text.
2. Every value in the parameters array MUST be a string. If it includes units (e.g., '8.3 cm', '120/80 mmHg'), wrap it in double quotes.
3. Only flag parameters that are outside normal range. If everything is normal, return risk_level: Low.
`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or user ID" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    try {
      if (file.type.startsWith("image/")) {
        console.log("Analyzing Image with Tesseract...");
        const Tesseract = require("tesseract.js");
        const path = require("path");
        const workerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng', { 
          workerPath,
          logger: (m: any) => console.log(`OCR: ${m.status} - ${Math.round(m.progress * 100)}%`)
        });
        extractedText = text;
      } else {
        console.log("Analyzing PDF with pdf-parse...");
        const data = await pdf(buffer);
        extractedText = data.text;
      }
    } catch (parseErr) {
      console.error("Extraction error:", parseErr);
      return NextResponse.json({ error: "Failed to read document content. Try a clearer image or a text-based PDF." }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      console.log("Extraction returned too little text. Length:", extractedText?.length);
      return NextResponse.json({ 
        error: "We couldn't find enough text in this document. If it's a scanned PDF, please take a clear photo of the page instead." 
      }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: AI_PROMPT + "\n\nNOTE: The input text may be messy OCR or raw PDF text. Extract the facts accurately." },
        { role: "user", content: `Analyze the following document text and return the medical insights in the EXACT JSON format requested:\n\n${extractedText.substring(0, 6000)}` },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const aiContent = completion.choices[0]?.message?.content || "";
    
    let cleanedJson = aiContent.trim();
    if (cleanedJson.includes("```")) {
      const match = cleanedJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) cleanedJson = match[1];
    }

    cleanedJson = cleanedJson.replace(/"value":\s*([^",\s}]+(?:\s+[^",\s}]+)*)(\s*[,}])/g, (match, p1, p2) => {
      if (p1.startsWith('"') || p1 === 'null' || p1 === 'true' || p1 === 'false' || !isNaN(Number(p1))) return match;
      return `"value": "${p1.trim()}"${p2}`;
    });

    cleanedJson = cleanedJson.replace(/"value":\s*(\d+\.?\d*),?"?\/(\d+\.?\d*)/g, '"value": "$1/$2"');

    let reportJson;
    try {
      reportJson = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("JSON Recovery Failed. Content:", cleanedJson);
      return NextResponse.json({ error: "Analysis engine returned a malformed response. Please try again with a clearer document." }, { status: 500 });
    }

    const reportRef = adminDb.collection("reports").doc();
    const reportData = {
      userId,
      filename: file.name,
      createdAt: FieldValue.serverTimestamp(),
      ...reportJson,
    };

    await reportRef.set(reportData);
    return NextResponse.json({ success: true, reportId: reportRef.id });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "The analysis service is temporarily busy. Please try again in a moment." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
