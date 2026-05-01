"use client";

import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation, Info } from "lucide-react";

// Dynamically import Leaflet on component mount to avoid SSR issues
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

export default function DoctorFinder({ specialist }: { specialist?: string }) {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [activeSearchLocation, setActiveSearchLocation] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!specialist || specialist.toLowerCase() === "none") {
      setLoading(false);
      return;
    }

    const searchDoctors = async () => {
      if (!activeSearchLocation) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/places?query=${encodeURIComponent(specialist)}&near=${encodeURIComponent(activeSearchLocation)}`);
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to search doctors");
        }

        const data = await res.json();
        const results = data.results || [];
        const center = data.center;
        setPlaces(results);

        if (typeof window !== "undefined" && L && mapRef.current) {
          // Initialize map if not already done
          if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
              zoomControl: false,
              attributionControl: false
            }).setView([20.5937, 78.9629], 4); // Initial view of India

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              maxZoom: 19
            }).addTo(mapInstanceRef.current);
            
            // Fix for "black map" issue - ensure Leaflet knows the container size
            setTimeout(() => {
              if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
            }, 500);
          }

          // Clear existing markers
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];

          // Center map based on Nominatim results or first doctor
          if (center) {
            mapInstanceRef.current.setView([center.lat, center.lon], 13);
          } else if (results.length > 0) {
            const firstResult = results[0];
            const lat = firstResult.geocodes?.main?.latitude;
            const lng = firstResult.geocodes?.main?.longitude;
            if (lat && lng) mapInstanceRef.current.setView([lat, lng], 13);
          }

          results.forEach((place: any) => {
            const pLat = place.geocodes?.main?.latitude;
            const pLng = place.geocodes?.main?.longitude;
            if (!pLat || !pLng) return;

            const icon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #00f5ff; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px #00f5ff; cursor: pointer;"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });

            const marker = L.marker([pLat, pLng], { icon }).addTo(mapInstanceRef.current);
            marker.bindPopup(`
              <div style="color: white; font-family: sans-serif; padding: 5px;">
                <b style="color: #00f5ff;">${place.name}</b><br/>
                <span style="font-size: 11px; opacity: 0.8;">${place.specialty || 'General Practitioner'}</span>
              </div>
            `);
            markersRef.current.push(marker);
          });
        }
        setLoading(false);
      } catch (err: any) {
        console.error("Doctor Search Error:", err);
        setError(err.message || "Failed to load results");
        setLoading(false);
      }
    };

    searchDoctors();
  }, [specialist, activeSearchLocation]);

  if (!specialist || specialist.toLowerCase() === "none") return null;

  return (
    <div className="glassmorphism rounded-3xl p-6 border border-card-border mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/20 rounded-xl">
          <MapPin className="text-accent w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h2 className="font-heading font-bold text-2xl">Recommended Specialist</h2>
            <span className="text-red-500 text-[10px] uppercase font-black tracking-tighter bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              Disclaimer: Educational purpose only
            </span>
          </div>
          <p className="text-foreground/70 text-sm">Suggested based on your results: <strong className="text-accent">{specialist}</strong></p>
        </div>
      </div>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-background text-accent focus:ring-accent"
          />
          <div className="text-xs text-foreground/60 leading-relaxed">
            <p className="font-bold text-foreground/80 mb-1">Terms & Conditions</p>
            This search is purely for educational purposes and provides information about hospitals slightly simpler for you. 
            Maps may be slightly outdated or hospitals might have been removed. 
            Please <strong className="text-accent/80 underline">enquiry once about the hospital</strong> before visiting.
          </div>
        </label>
      </div>

      <div className={`flex flex-col md:flex-row gap-3 mb-6 transition-opacity duration-300 ${!agreedToTerms ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <input 
          type="text" 
          placeholder="Enter location (e.g. Hyderabad, Hitech City)"
          disabled={!agreedToTerms}
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          className="flex-1 bg-background/50 border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && locationInput.trim()) {
              setActiveSearchLocation(locationInput.trim());
            }
          }}
        />
        <button 
          disabled={!agreedToTerms}
          onClick={() => locationInput.trim() && setActiveSearchLocation(locationInput.trim())}
          className="bg-accent text-background px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] transition-all whitespace-nowrap"
        >
          Search Location
        </button>
      </div>
      
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-4 text-accent animate-pulse">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          Loading nearby specialist locations...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex gap-3 items-start">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {places.map((place, idx) => (
              <div key={idx} className="bg-background/50 p-4 rounded-xl border border-white/5 hover:border-accent/40 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg leading-tight">{place.name}</h3>
                  <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20 uppercase font-black shrink-0 ml-2">
                    {place.amenityType === 'hospital' ? '🏥 Hospital' : place.amenityType === 'clinic' ? '🩺 Clinic' : '👨‍⚕️ Doctor'}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mb-2 line-clamp-2">{place.location.formatted_address}</p>
                {place.phone && (
                  <p className="text-xs text-foreground/50 mb-2">📞 {place.phone}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-foreground/40 text-xs italic">
                    {place.specialty || 'General Practice'}
                  </div>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.geocodes?.main?.latitude},${place.geocodes?.main?.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-accent hover:underline font-bold"
                  >
                    <Navigation className="w-4 h-4" /> Directions
                  </a>
                </div>
              </div>
            ))}
            {places.length === 0 && !activeSearchLocation && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <MapPin className="text-white/20 w-8 h-8" />
                </div>
                <p className="text-foreground/40 font-sans px-8">Enter your city or area above to find nearby <span className="text-accent/60 font-bold">{specialist}</span> clinics.</p>
              </div>
            )}
            {places.length === 0 && activeSearchLocation && !loading && (
              <p className="text-foreground/50 py-8 text-center border border-dashed border-white/10 rounded-xl font-sans">No specialists found in "{activeSearchLocation}". Try a broader city name.</p>
            )}
          </div>
          
          <div className="h-[350px] bg-background/50 rounded-xl overflow-hidden relative border border-card-border group">
            <div ref={mapRef} className="w-full h-full z-0" />
            
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg text-[9px] font-medium text-center text-foreground/60 pointer-events-none z-10 border border-white/5 uppercase tracking-widest">
              Regional Specialist Records • Diagnostic Database
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-div-icon {
          background: none !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: #020617 !important;
          color: white !important;
          border-radius: 12px !important;
          border: 1px solid rgba(0, 245, 255, 0.3) !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
        }
        .leaflet-popup-tip {
          background: #020617 !important;
          border: 1px solid rgba(0, 245, 255, 0.3) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 245, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
