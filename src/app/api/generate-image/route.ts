import { NextResponse } from "next/server";

async function fetchWithRetry(url: string, retries = 2, delayMs = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout per attempt
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      if (response.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      return response;
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log(`Attempt ${i + 1} timed out.`);
      }
      if (i === retries - 1) throw e;
    }
  }
  throw new Error("All retries exhausted");
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Use Pollinations.ai — free, no API key required, returns image directly
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&seed=${seed}&model=flux`;

    const response = await fetchWithRetry(pollinationsUrl);

    if (!response.ok) {
      console.error("Pollinations API Error:", response.status, response.statusText);
      return NextResponse.json({ error: "Failed to generate image" }, { status: response.status });
    }

    // Read the image as an ArrayBuffer and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ image: base64Image });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
