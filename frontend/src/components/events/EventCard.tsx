"use client";

import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  SEVERITY_COLORS,
} from "@/lib/constants";
import type { PakEvent } from "@/lib/types";

interface EventCardProps {
  event: PakEvent;
  isSelected: boolean;
  onClick: () => void;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const typeColor = EVENT_TYPE_COLORS[event.event_type] || "#64748b";
  const sevColor = SEVERITY_COLORS[event.severity || "low"] || "#64748b";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-md border transition-colors ${
        isSelected
          ? "bg-muted/80 border-primary/50"
          : "bg-transparent border-transparent hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
          style={{ background: typeColor, boxShadow: `0 0 6px ${typeColor}60` }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {event.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: `${typeColor}20`, color: typeColor }}
            >
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
            {event.severity && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: `${sevColor}20`, color: sevColor }}
              >
                {event.severity}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground truncate">
              {[event.city, event.province].filter(Boolean).join(", ") || "Unknown location"}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
              {timeAgo(event.last_seen)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
