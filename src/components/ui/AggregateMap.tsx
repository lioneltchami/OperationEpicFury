"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import type { TimelineEvent } from "@/data/timeline";
import { redIcon } from "@/lib/map-utils";

interface AggregateMapProps {
  events: TimelineEvent[];
  locale: string;
}

export default function AggregateMap({ events, locale }: AggregateMapProps) {
  const withLocation = events.filter((e) => e.location);
  if (!withLocation.length) return null;

  // Center on the Middle East region by default
  const center: [number, number] = [32.5, 53.5];

  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
        {withLocation.map((event) => (
          <Marker
            key={event.id}
            position={[event.location!.lat, event.location!.lng]}
            icon={redIcon}
          >
            <Popup>
              <div style={{ maxWidth: 220 }}>
                <a
                  href={`/${locale}/events/${event.slug}`}
                  style={{
                    color: "#dc2626",
                    fontWeight: "bold",
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  {event.headline}
                </a>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  {event.location!.name} · {event.timeET}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
