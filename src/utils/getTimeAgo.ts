/**
 * Returns a human-readable string representing the time elapsed since the given date.
 * @param {string} dateString - The date string to calculate time ago from.
 * @returns {string} A string like "5 minutes ago" or "about 1 hour ago".
 * @example
 * timeAgo("2024-01-15T14:30:00Z") // Returns "x minutes ago"
*/
import { formatDistanceToNow } from "date-fns";

export function timeAgo(dateString) {
    return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
    });
}