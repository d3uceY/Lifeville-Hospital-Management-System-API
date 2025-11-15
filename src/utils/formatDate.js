
//this formats date to dd/mm/yyyy but in words

/**
 * Formats an ISO date string into a human-readable format
 * @param {string} isoString - The ISO 8601 date string to format
 * @returns {string} Formatted date string in "DD MMM YYYY, HH:MM AM/PM" format (en-GB locale) or "—" if input is falsy
 * @example
 * formatDate("2024-01-15T14:30:00Z") // Returns "15 Jan 2024, 02:30 PM"
 * formatDate(null) // Returns "—"
 */
export function formatDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
  