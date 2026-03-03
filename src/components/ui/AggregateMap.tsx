"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TimelineEvent } from "@/data/timeline";

const redIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="%23dc2626"/><circle cx="12" cy="12" r="5" fill="%23fff"/></svg>'
  ),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

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
                  style={{ color: "#dc2626", fontWeight: "bold", fontSize: 13, textDecoration: "none" }}
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
