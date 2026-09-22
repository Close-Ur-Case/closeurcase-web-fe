import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CITY, nearestServiceCity } from "@/lib/geo";

function defaultLabel() {
  return `${DEFAULT_CITY.name}, ${DEFAULT_CITY.state}`;
}

/** Shared real-geolocation hook — used by the header's LocationIndicator and
 * by the "Find a Lawyer" wizard's distance-based Lawyer sort, so both
 * reflect the same detected position instead of drifting out of sync. */
export function useUserLocation() {
  const [coords, setCoords] = useState({ lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng });
  const [cityLabel, setCityLabel] = useState(defaultLabel());
  const [loading, setLoading] = useState(true);

  const detect = useCallback(() => {
    setLoading(true);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setCoords({ lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng });
      setCityLabel(defaultLabel());
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const nearest = nearestServiceCity(latitude, longitude);
        setCityLabel(`${nearest.name}, ${nearest.state}`);
        setLoading(false);
      },
      () => {
        setCoords({ lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng });
        setCityLabel(defaultLabel());
        setLoading(false);
      },
      { timeout: 6000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return { coords, cityLabel, loading, refresh: detect };
}
