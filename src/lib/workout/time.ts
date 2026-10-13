/**
 * Swim intervals are written as m:ss (1:20) or :ss (:45).
 * Returns seconds, or null if the text isn't a valid interval.
 */
export function parseInterval(text: string): number | null {
  const match = text.trim().match(/^(?:(\d{1,2}))?:(\d{2})$|^(\d{1,3})$/);
  if (!match) return null;

  if (match[3] !== undefined) return Number(match[3]);

  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  if (seconds > 59) return null;
  return minutes * 60 + seconds;
}

/** 80 -> "1:20", 45 -> ":45" */
export function formatInterval(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return minutes > 0 ? `${minutes}:${seconds}` : `:${seconds}`;
}
