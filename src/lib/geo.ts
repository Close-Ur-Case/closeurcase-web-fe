/**
 * The app's seed lawyers only live in Hyderabad/Visakhapatnam, but lawyers can
 * self-register (src/routes/lawyer-register.tsx) with any free-text city, so
 * real data ends up spanning many Indian metros. Rather than a hardcoded
 * two-city match, this keeps a broader coordinate table and does real
 * Haversine distance so "sorted by location" is genuinely true regardless of
 * which cities show up.
 */
export interface ServiceCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

/** The two cities the app actually operates in — used for the header's
 * "detected location" label (kept coarse on purpose: citizen-facing copy). */
export const SERVICE_CITIES: ServiceCity[] = [
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
];

export const DEFAULT_CITY = SERVICE_CITIES[0];

/** Broader lookup for lawyer-to-citizen distance sorting, since lawyers can
 * self-register in any city. Keyed by lowercase city name. */
const INDIAN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  hyderabad: { lat: 17.385, lng: 78.4867 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vizag: { lat: 17.6868, lng: 83.2185 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  surat: { lat: 21.1702, lng: 72.8311 },
  patna: { lat: 25.5941, lng: 85.1376 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  amaravati: { lat: 16.5131, lng: 80.518 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestServiceCity(lat: number, lng: number): ServiceCity {
  return SERVICE_CITIES.reduce(
    (best, city) => {
      const d = haversineKm(lat, lng, city.lat, city.lng);
      return d < best.d ? { city, d } : best;
    },
    { city: SERVICE_CITIES[0], d: Infinity },
  ).city;
}

/** Real distance (km) from a lat/lng to a free-text city name. Unrecognized
 * cities return null so callers can sort them last instead of guessing. */
export function distanceToCity(lat: number, lng: number, cityName: string): number | null {
  const key = cityName.trim().toLowerCase();
  const coords = INDIAN_CITY_COORDS[key];
  if (!coords) return null;
  return haversineKm(lat, lng, coords.lat, coords.lng);
}
