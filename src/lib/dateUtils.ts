/**
 * Comprehensive Date & Time utilities ensuring date is always shown
 * along with time and AM/PM format throughout the application.
 *
 * Example outputs:
 *  - "1 Oct 2026, 02:30 PM"
 *  - "29 Sep 2026, 11:15 AM"
 */

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return "";
  const trimmed = String(timeStr).trim();
  if (!trimmed) return "";
  if (/am|pm/i.test(trimmed)) {
    return trimmed.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  }
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
  }
  return trimmed;
}

/**
 * Format a date along with time and AM/PM:
 * e.g. "1 Oct 2026, 02:30 PM"
 *
 * @param isoOrDate ISO string, Date object, or date string
 * @param timeStr Optional separate time string (e.g. "10:30 AM" or "14:30" from hearing schedule)
 */
export function formatDateTime(
  isoOrDate?: string | Date | null,
  timeStr?: string | null,
): string {
  if (!isoOrDate) return "—";
  try {
    const rawStr = isoOrDate instanceof Date ? isoOrDate.toISOString() : String(isoOrDate).trim();
    if (!rawStr || rawStr === "undefined" || rawStr === "null" || rawStr === "—") return "—";

    // If an explicit time string is supplied
    if (timeStr && String(timeStr).trim()) {
      const cleanTime = formatTime12h(timeStr);
      const datePart = rawStr.split("T")[0];
      const [y, m, d] = datePart.split("-").map(Number);
      if (y && m && d) {
        const localDate = new Date(y, m - 1, d);
        const formattedDate = localDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return `${formattedDate}, ${cleanTime}`;
      }
    }

    let d: Date;
    // If it's a date-only format like "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawStr)) {
      const [y, m, dayNum] = rawStr.split("-").map(Number);
      // Default to 10:00 AM (typical court/business opening hours)
      d = new Date(y, m - 1, dayNum, 10, 0, 0);
    } else {
      d = new Date(rawStr);
    }

    if (isNaN(d.getTime())) return rawStr;

    const formatted = d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return formatted.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
  } catch {
    return String(isoOrDate);
  }
}

/** Alias to ensure consistent date + time + AM/PM everywhere */
export const fmtDateTime = formatDateTime;
export const formatDateWithTime = formatDateTime;
