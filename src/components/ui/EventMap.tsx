"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { redIcon } from "@/lib/map-utils";

interface EventMapProps {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}

export default function EventMap({
  lat,
  lng,
  name,
  className = "",
}: EventMapProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden border border-zinc-800/60 ${className}`}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: "200px", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Marker position={[lat, lng]} icon={redIcon}>
          <Popup>
            <span style={{ color: "#000", fontSize: "12px" }}>{name}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
