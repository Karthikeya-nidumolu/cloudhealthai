const fetch = require('node-fetch');

async function testNvidia() {
  const url = 'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium';
  const apiKey = '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';

  const body = {
    prompt: "A beautiful cinematic shot of a glowing blue human heart",
    aspect_ratio: "16:9"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 500) + (text.length > 500 ? "..." : ""));
  } catch (e) {
    console.error(e);
  }
}

testNvidia();
