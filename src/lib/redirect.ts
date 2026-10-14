/** Only allow same-site relative paths as post-sign-in destinations (no open redirects). */
export function safeNext(next: unknown, fallback = "/"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
