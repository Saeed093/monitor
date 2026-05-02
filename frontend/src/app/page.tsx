"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Radio, RefreshCw, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterSidebar from "@/components/sidebar/FilterSidebar";
import MediaFeedsPanel from "@/components/sidebar/MediaFeedsPanel";
import EventDetail from "@/components/events/EventDetail";
import AddSignalModal from "@/components/signals/AddSignalModal";
import { useEvents } from "@/hooks/useEvents";
import { ingestAll } from "@/lib/api";
import type { EventFilters, PakEvent } from "@/lib/types";

const PakistanMap = dynamic(
  () => import("@/components/map/PakistanMap"),
  { ssr: false, loading: () => <div className="h-full w-full bg-background" /> }
);

export default function DashboardPage() {
  const [filters, setFilters] = useState<EventFilters>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [signalModalOpen, setSignalModalOpen] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const { events, loading, error, refresh } = useEvents(filters);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const handleSelectEvent = useCallback((event: PakEvent) => {
    setSelectedEventId((prev) => (prev === event.id ? null : event.id));
  }, []);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      await ingestAll();
      refresh();
    } catch {
      /* non-fatal */
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold tracking-wide text-foreground">
            PAKISTAN SITUATION MONITOR
          </h1>
          {loading && (
            <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleIngest}
            disabled={ingesting}
            title="Pull latest posts from X and Facebook APIs"
          >
            {ingesting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            Ingest Feeds
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setSignalModalOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Signal
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <MediaFeedsPanel />

        {/* Events sidebar */}
        <div className="w-80 shrink-0 min-w-0 overflow-hidden">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          {error && (
            <div
              className={`absolute top-2 left-1/2 -translate-x-1/2 z-[1000] max-w-[min(90%,42rem)] text-center text-xs px-3 py-1.5 rounded-md shadow-lg text-white ${
                error.includes("Cannot reach API")
                  ? "bg-amber-600/95"
                  : "bg-destructive/90"
              }`}
            >
              {error}
            </div>
          )}
          <PakistanMap
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
          />
          {/* Event count overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {events.filter((e) => e.latitude && e.longitude).length} events on map
            </span>
          </div>
        </div>

        {/* Right Detail Panel */}
        {selectedEvent && (
          <div className="w-96 shrink-0 overflow-hidden">
            <EventDetail
              event={selectedEvent}
              onClose={() => setSelectedEventId(null)}
            />
          </div>
        )}
      </div>

      {/* Add Signal Modal */}
      <AddSignalModal
        open={signalModalOpen}
        onOpenChange={setSignalModalOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
