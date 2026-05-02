"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, SEVERITY_COLORS } from "@/lib/constants";
import type { PakEvent } from "@/lib/types";

interface EventMarkerProps {
  event: PakEvent;
  isSelected: boolean;
  onClick: () => void;
}

function createMarkerIcon(eventType: string, severity: string | null, isSelected: boolean) {
  const color = EVENT_TYPE_COLORS[eventType] || "#64748b";
  const borderColor = isSelected ? "#ffffff" : (SEVERITY_COLORS[severity || "low"] || "#64748b");
  const size = isSelected ? 18 : 12;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 0 ${isSelected ? 12 : 6}px ${color}80;
      cursor: pointer;
    "></div>`,
    iconSize: [size + borderWidth * 2, size + borderWidth * 2],
    iconAnchor: [(size + borderWidth * 2) / 2, (size + borderWidth * 2) / 2],
  });
}

export default function EventMarker({ event, isSelected, onClick }: EventMarkerProps) {
  if (event.latitude == null || event.longitude == null) return null;

  const icon = createMarkerIcon(event.event_type, event.severity, isSelected);

  return (
    <Marker
      position={[event.latitude, event.longitude]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="text-sm" style={{ color: "#1e293b" }}>
          <strong>{event.title}</strong>
          <br />
          <span>{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</span>
          {event.city && (
            <>
              <br />
              <span>{event.city}</span>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
