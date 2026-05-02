import type { EventSource } from "./types";

/** Best URL to open the original signal on its platform (X, Facebook, etc.). */
export function getSourcePublicUrl(src: EventSource): string | null {
  const direct = src.post_url?.trim();
  if (direct) return direct;

  const ref = src.raw_source?.trim();
  if (!ref) return null;

  if (ref.startsWith("x:")) {
    const id = ref.slice(2);
    if (/^\d+$/.test(id)) return `https://x.com/i/status/${id}`;
  }

  /* Facebook permutations vary; backend ingest should set post_url from Graph permalink_url. */

  return null;
}

export function sourceLinkLabel(sourceType: string): string {
  const t = sourceType.toLowerCase();
  if (t === "x" || t.includes("twitter")) return "Open on X";
  if (t === "facebook") return "Open on Facebook";
  if (t === "instagram") return "Open on Instagram";
  if (t === "news") return "Open link";
  return "Open source";
}
