"use client";

import { X, MapPin, Clock, Shield, Users, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSourcePublicUrl, sourceLinkLabel } from "@/lib/sourceUrl";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
} from "@/lib/constants";
import type { PakEvent } from "@/lib/types";

interface EventDetailProps {
  event: PakEvent | null;
  onClose: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetail({ event, onClose }: EventDetailProps) {
  if (!event) return null;

  const typeColor = EVENT_TYPE_COLORS[event.event_type] || "#64748b";
  const sevColor = SEVERITY_COLORS[event.severity || "low"] || "#64748b";
  const statusColor = STATUS_COLORS[event.status || "developing"] || "#64748b";
  const confidencePct = Math.round((event.confidence ?? 0) * 100);

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Event Detail
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title & badges */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{ background: `${typeColor}20`, color: typeColor }}
            >
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
            {event.severity && (
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: `${sevColor}20`, color: sevColor }}
              >
                {event.severity}
              </span>
            )}
            {event.status && (
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: `${statusColor}20`, color: statusColor }}
              >
                {event.status}
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {event.summary && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Summary
            </div>
            <p className="text-sm text-foreground/90">{event.summary}</p>
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <div className="text-sm text-foreground">
              {[event.city, event.district, event.province]
                .filter(Boolean)
                .join(", ") || "Unknown location"}
            </div>
            {event.latitude != null && event.longitude != null && (
              <div className="text-xs text-muted-foreground">
                {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Confidence</span>
              <span className="text-xs font-semibold text-foreground">
                {confidencePct}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${confidencePct}%`,
                  background:
                    confidencePct >= 70
                      ? "#22c55e"
                      : confidencePct >= 40
                      ? "#eab308"
                      : "#ef4444",
                }}
              />
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">First seen:</span>
            <span className="text-foreground">{formatDate(event.first_seen)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Last seen:</span>
            <span className="text-foreground">{formatDate(event.last_seen)}</span>
          </div>
        </div>

        {/* Sources */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Sources:</span>
          <span className="text-foreground font-semibold">{event.source_count}</span>
        </div>

        {/* Source snippets */}
        {event.sources && Array.isArray(event.sources) && event.sources.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Source Signals
            </div>
            <div className="space-y-2">
              {event.sources.map((src, i) => {
                const href = getSourcePublicUrl(src);
                return (
                  <div
                    key={i}
                    className="p-2.5 bg-muted/50 rounded border border-border"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {src.source_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(src.added_at)}
                        </span>
                      </div>
                      {href ? (
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 shrink-0" asChild>
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {sourceLinkLabel(src.source_type)}
                          </a>
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-xs text-foreground/80 italic">
                      &quot;{src.text_snippet}&quot;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
