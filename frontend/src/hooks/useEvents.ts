"use client";

import { useState, useEffect, useCallback } from "react";
import { getEvents } from "@/lib/api";
import { API_BASE } from "@/lib/constants";
import type { PakEvent, EventFilters } from "@/lib/types";

const POLL_INTERVAL = 30_000;

export function useEvents(filters: EventFilters) {
  const [events, setEvents] = useState<PakEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await getEvents(filters);
      setEvents(data);
      setError(null);
    } catch (err) {
      const offline =
        err instanceof TypeError ||
        (typeof err === "object" &&
          err !== null &&
          "name" in err &&
          (err as Error).name === "NetworkError");
      const msg = err instanceof Error ? err.message : "Failed to fetch events";
      setEvents([]);
      setError(
        offline || msg.includes("fetch") || msg.includes("NetworkError")
          ? `Cannot reach API at ${API_BASE}. Start the backend (uvicorn) and ensure it is listening.`
          : msg
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load, tick]);

  useEffect(() => {
    const interval = setInterval(() => {
      load({ silent: true });
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return { events, loading, error, refresh };
}
