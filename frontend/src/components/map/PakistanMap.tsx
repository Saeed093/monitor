"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PAKISTAN_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import type { PakEvent } from "@/lib/types";
import EventMarker from "./EventMarker";

interface PakistanMapProps {
  events: PakEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: PakEvent) => void;
}

function FlyToSelected({ event }: { event: PakEvent | null }) {
  const map = useMap();
  useEffect(() => {
    if (event?.latitude && event?.longitude) {
      map.flyTo([event.latitude, event.longitude], 10, { duration: 1 });
    }
  }, [event, map]);
  return null;
}

export default function PakistanMap({
  events,
  selectedEventId,
  onSelectEvent,
}: PakistanMapProps) {
  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ?? null;

  const geoEvents = events.filter(
    (e) => e.latitude != null && e.longitude != null
  );

  return (
    <MapContainer
      center={PAKISTAN_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full z-0"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {geoEvents.map((event) => (
        <EventMarker
          key={event.id}
          event={event}
          isSelected={event.id === selectedEventId}
          onClick={() => onSelectEvent(event)}
        />
      ))}
      <FlyToSelected event={selectedEvent} />
    </MapContainer>
  );
}
