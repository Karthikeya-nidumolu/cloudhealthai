async function testKey() {
  const key = "fsq3GuZIlbXe7T2GVrqgKj6+Nd80+Ak55HEnlEpT8vaaX8M=";
  console.log("Testing with User-Agent and different fields...");

  try {
    const res = await fetch('https://api.foursquare.com/v3/places/search?query=doctor&near=Hyderabad&limit=1', {
      headers: {
        'Authorization': key,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("Error:", err.message);
  }
}

testKey();
