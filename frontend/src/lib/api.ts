import { API_BASE } from "./constants";
import type { PakEvent, ProcessResponse, RawPostCreateBody, EventFilters } from "./types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getEvents(filters?: EventFilters): Promise<PakEvent[]> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.event_type) params.set("event_type", filters.event_type);
    if (filters.province) params.set("province", filters.province);
    if (filters.time_range) params.set("time_range", filters.time_range);
    if (filters.min_confidence != null)
      params.set("min_confidence", String(filters.min_confidence));
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
  }
  const qs = params.toString();
  return fetchJson<PakEvent[]>(`${API_BASE}/api/events${qs ? `?${qs}` : ""}`);
}

export async function getEvent(id: string): Promise<PakEvent> {
  return fetchJson<PakEvent>(`${API_BASE}/api/events/${id}`);
}

export async function createRawPost(
  body: RawPostCreateBody
): Promise<ProcessResponse> {
  return fetchJson<ProcessResponse>(`${API_BASE}/api/raw-posts/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function ingestAll(): Promise<unknown> {
  return fetchJson<unknown>(`${API_BASE}/api/ingest/all`, { method: "POST" });
}
