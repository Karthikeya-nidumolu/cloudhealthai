import { NextResponse } from "next/server";

const SPECIALTY_MAP: Record<string, string[]> = {
  cardiologist: ["cardiology", "cardiologist", "heart"],
  dermatologist: ["dermatology", "dermatologist", "skin"],
  dentist: ["dentist", "dental", "dentistry"],
  orthopedic: ["orthopaedic", "orthopedic", "ortho", "bone"],
  pediatrician: ["paediatric", "pediatric", "paediatrician", "child"],
  gynecologist: ["gynaecology", "gynecology", "obstetrics", "obgyn"],
  neurologist: ["neurology", "neurologist", "neuro", "brain"],
  ophthalmologist: ["ophthalmology", "ophthalmologist", "eye"],
  psychiatrist: ["psychiatry", "psychiatrist", "mental"],
  surgeon: ["surgery", "surgeon", "surgical"],
  pulmonologist: ["pulmonology", "pulmonologist", "lung", "respiratory"],
  nephrologist: ["nephrology", "nephrologist", "kidney", "renal"],
  endocrinologist: ["endocrinology", "endocrinologist", "diabetes", "thyroid"],
  gastroenterologist: ["gastroenterology", "gastroenterologist", "stomach", "digestive"],
  urologist: ["urology", "urologist"],
  oncologist: ["oncology", "oncologist", "cancer"],
  ent: ["ent", "otolaryngology", "ear", "nose", "throat"],
  hematologist: ["hematology", "haematology", "blood"],
  hepatologist: ["hepatology", "liver"],
  general: ["general", "physician", "medicine", "family"],
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase() || "";
    const near = searchParams.get("near");

    if (!near) {
      return NextResponse.json({ error: "Missing location parameter" }, { status: 400 });
    }

    // Step 1: Geocoding using Nominatim (Free, no key)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(near)}&format=json&limit=1&countrycodes=in`;
    const geoRes = await fetch(nominatimUrl, {
      headers: { "User-Agent": "HealthAICloud/1.0 (educational-project)" },
    });

    if (!geoRes.ok) throw new Error("Geocoding failed");
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return NextResponse.json({ error: "Location not found. Try a different city or area name." }, { status: 404 });
    }

    const { lat, lon, display_name } = geoData[0];

    // Step 2: Find matching specialty keywords
    const matchedKeywords: string[] = [];
    for (const [key, keywords] of Object.entries(SPECIALTY_MAP)) {
      if (query.includes(key) || keywords.some(k => query.includes(k))) {
        matchedKeywords.push(...keywords);
        break;
      }
    }

    // Step 3: Build Overpass queries — search hospitals, clinics, and doctors
    // Use a much larger radius (25km) for Indian cities which are spread out
    const radius = 25000;

    // Helper to build single-line Overpass queries (newlines break the API)
    const clean = (q: string) => q.replace(/\s+/g, ' ').trim();

    const buildQueries = (): string[] => {
      const queries: string[] = [];

      if (matchedKeywords.length > 0) {
        const nameRegex = matchedKeywords.join("|");

        // Query 1: Search by healthcare:speciality tag
        queries.push(clean(
          `[out:json][timeout:15];(nwr["amenity"="hospital"]["healthcare:speciality"~"${nameRegex}",i](around:${radius},${lat},${lon});nwr["amenity"="clinic"]["healthcare:speciality"~"${nameRegex}",i](around:${radius},${lat},${lon});nwr["amenity"="doctors"]["healthcare:speciality"~"${nameRegex}",i](around:${radius},${lat},${lon}););out center 10;`
        ));

        // Query 2: Search by name containing specialty keywords
        queries.push(clean(
          `[out:json][timeout:15];(nwr["amenity"="hospital"]["name"~"${nameRegex}",i](around:${radius},${lat},${lon});nwr["amenity"="clinic"]["name"~"${nameRegex}",i](around:${radius},${lat},${lon});nwr["amenity"="doctors"]["name"~"${nameRegex}",i](around:${radius},${lat},${lon});nwr["healthcare"]["name"~"${nameRegex}",i](around:${radius},${lat},${lon}););out center 10;`
        ));
      }

      // Query 3: Fallback — all hospitals and clinics in area
      queries.push(clean(
        `[out:json][timeout:15];(nwr["amenity"="hospital"](around:${radius},${lat},${lon});nwr["amenity"="clinic"](around:${radius},${lat},${lon});nwr["amenity"="doctors"](around:${radius},${lat},${lon}););out center 15;`
      ));

      return queries;
    };

    const instances = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://z.overpass-api.de/api/interpreter"
    ];

    let overpassData: any = null;
    let lastError = "";

    const queries = buildQueries();

    for (const q of queries) {
      if (overpassData) break;

      for (const instance of instances) {
        try {
          const res = await fetch(`${instance}?data=${encodeURIComponent(q)}`, {
            signal: AbortSignal.timeout(12000),
            headers: { "User-Agent": "HealthAICloud/1.0" }
          });

          if (res.ok) {
            const data = await res.json();
            if (data.elements && data.elements.length > 0) {
              overpassData = data;
              break;
            }
          } else {
            lastError = `Instance ${instance} returned ${res.status}`;
          }
        } catch (e: any) {
          lastError = e.message;
          continue;
        }
      }
    }

    if (!overpassData) {
      return NextResponse.json({
        results: [],
        center: { lat, lon, name: display_name },
        note: "No hospitals or clinics found nearby. Try a larger city or different area."
      });
    }

    // Map Overpass results — filter out unnamed entries and deduplicate
    const seen = new Set<string>();
    const results = (overpassData.elements || [])
      .map((el: any) => {
        const name = el.tags?.name || el.tags?.operator;
        if (!name) return null;

        const elLat = el.center?.lat || el.lat;
        const elLon = el.center?.lon || el.lon;
        if (!elLat || !elLon) return null;

        // Deduplicate by name
        const key = name.toLowerCase().trim();
        if (seen.has(key)) return null;
        seen.add(key);

        // Build a readable address
        const addressParts = [
          el.tags?.["addr:street"],
          el.tags?.["addr:suburb"] || el.tags?.["addr:neighbourhood"],
          el.tags?.["addr:city"],
          el.tags?.["addr:state"],
        ].filter(Boolean);

        const address = addressParts.length > 0
          ? addressParts.join(", ")
          : el.tags?.["addr:full"] || display_name;

        return {
          name,
          location: {
            formatted_address: address,
          },
          geocodes: {
            main: {
              latitude: elLat,
              longitude: elLon,
            },
          },
          specialty: el.tags?.["healthcare:speciality"] || el.tags?.description || el.tags?.["health_specialty:type"] || "",
          phone: el.tags?.phone || el.tags?.["contact:phone"] || "",
          website: el.tags?.website || el.tags?.["contact:website"] || "",
          amenityType: el.tags?.amenity || "healthcare",
          isVerified: true,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      results: results.slice(0, 10),
      center: { lat, lon, name: display_name }
    });

  } catch (error: any) {
    console.error("OSM/Overpass Search Error:", error);
    return NextResponse.json({ error: "Search service temporarily unavailable. Please try again later." }, { status: 500 });
  }
}
