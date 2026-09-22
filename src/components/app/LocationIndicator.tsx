import { MapPin, RefreshCw } from "lucide-react";
import { IconButton } from "@/components/m3";
import { useUserLocation } from "@/lib/useUserLocation";

/** Shown in the top app bar for citizen/lawyer roles — detects which of the
 * two service cities (Hyderabad / Visakhapatnam) the user is nearest to via
 * real browser geolocation, with a manual refresh and a safe static fallback
 * when permission is denied or the API is unavailable. */
export function LocationIndicator() {
  const { cityLabel, loading, refresh } = useUserLocation();

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="hidden sm:inline">{loading ? "Detecting location…" : cityLabel}</span>
      <span className="sm:hidden">{loading ? "…" : cityLabel.split(",")[0]}</span>
      <IconButton ariaLabel="Refresh location" onClick={refresh} disabled={loading}>
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      </IconButton>
    </div>
  );
}
