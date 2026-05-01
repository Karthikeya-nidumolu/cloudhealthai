import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, reportContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Build the robust System Prompt
    const SYSTEM_PROMPT = `You are a highly advanced Medical AI Assistant embedded in the HealthAI Cloud Platform. 
    You are currently chatting with a user about their strictly private medical report.
    
    Here is the exact JSON data from the user's uploaded medical report:
    ${JSON.stringify(reportContext)}

    CRITICAL RULES:
    1. Base all your answers strictly on the numeric data and summaries provided in the JSON above.
    2. If the user asks about a parameter (like Glucose or Blood Pressure), look at the JSON and tell them exactly what their value was and what it means.
    3. You are acting as an educational "Health Coach". You must explicitly state "I am an AI assistant and this is not a medical diagnosis" if they ask for prescriptions or formal diagnosis.
    4. Be highly conversational, reassuring, clear, and professional. Use markdown formatting to make your responses readable.`;

    // Prepend the system prompt invisibly to guide the AI
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages,
      model: "llama-3.1-70b-versatile",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I am currently unable to analyze the report.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
