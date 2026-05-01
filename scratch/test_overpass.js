const q = '[out:json][timeout:15];(nwr["amenity"="hospital"](around:25000,17.3605890,78.4740613););out center 5;';

// Try different instances and methods
const instances = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

(async () => {
  for (const inst of instances) {
    try {
      // GET with query param
      console.log(`\nTrying GET: ${inst}`);
      const r1 = await fetch(`${inst}?data=${encodeURIComponent(q)}`, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'HealthAICloud/1.0' }
      });
      console.log('GET Status:', r1.status);
      if (r1.ok) {
        const d = await r1.json();
        console.log('Elements:', d.elements?.length);
        if (d.elements?.length > 0) {
          d.elements.slice(0, 3).forEach(e => console.log(' -', e.tags?.name));
        }
        return;
      }
    } catch (e) {
      console.log('GET Error:', e.message);
    }

    try {
      // POST 
      console.log(`Trying POST: ${inst}`);
      const r2 = await fetch(inst, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HealthAICloud/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });
      console.log('POST Status:', r2.status);
      if (r2.ok) {
        const d = await r2.json();
        console.log('Elements:', d.elements?.length);
        if (d.elements?.length > 0) {
          d.elements.slice(0, 3).forEach(e => console.log(' -', e.tags?.name));
        }
        return;
      }
    } catch (e) {
      console.log('POST Error:', e.message);
    }
  }
  console.log('\nAll instances failed');
})();
