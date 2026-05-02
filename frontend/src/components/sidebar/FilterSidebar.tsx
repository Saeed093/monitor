"use client";

import { Search } from "lucide-react";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  PROVINCES,
  TIME_RANGES,
} from "@/lib/constants";
import type { EventFilters, PakEvent } from "@/lib/types";
import EventCard from "@/components/events/EventCard";

interface FilterSidebarProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  events: PakEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: PakEvent) => void;
}

export default function FilterSidebar({
  filters,
  onFiltersChange,
  events,
  selectedEventId,
  onSelectEvent,
}: FilterSidebarProps) {
  const updateFilter = (key: keyof EventFilters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.time_range ||
      filters.event_type ||
      filters.province ||
      filters.severity ||
      (filters.min_confidence != null && filters.min_confidence > 0)
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Search */}
      <div className="p-3 border-b border-border space-y-2">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange({})}
            className="text-xs text-primary hover:underline w-full text-left"
          >
            Clear all filters
          </button>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 space-y-3 border-b border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Filters
        </div>

        {/* Time Range */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Time Range</label>
          <select
            value={filters.time_range || ""}
            onChange={(e) => updateFilter("time_range", e.target.value)}
            className="w-full h-8 px-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All time</option>
            {TIME_RANGES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Event Type */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Event Type</label>
          <select
            value={filters.event_type || ""}
            onChange={(e) => updateFilter("event_type", e.target.value)}
            className="w-full h-8 px-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All types</option>
            {Object.entries(EVENT_TYPE_LABELS)
              .filter(([key]) => key !== "not_event")
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
        </div>

        {/* Province */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Province</label>
          <select
            value={filters.province || ""}
            onChange={(e) => updateFilter("province", e.target.value)}
            className="w-full h-8 px-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Severity</label>
          <select
            value={filters.severity || ""}
            onChange={(e) => updateFilter("severity", e.target.value)}
            className="w-full h-8 px-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Confidence */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Min Confidence: {filters.min_confidence != null ? `${Math.round(filters.min_confidence * 100)}%` : "Any"}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={(filters.min_confidence ?? 0) * 100}
            onChange={(e) => {
              const val = Number(e.target.value) / 100;
              updateFilter("min_confidence", val > 0 ? val : undefined);
            }}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Events ({events.length})
          </div>
        </div>
        <div className="px-2 pb-2 space-y-1">
          {events.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No events found
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={event.id === selectedEventId}
                onClick={() => onSelectEvent(event)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
