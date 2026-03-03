"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Red marker icon
const redIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="%23dc2626"/><circle cx="12" cy="12" r="5" fill="%23fff"/></svg>'
  ),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

interface EventMapProps {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}

export default function EventMap({ lat, lng, name, className = "" }: EventMapProps) {
  return (
    <div className={`rounded-xl overflow-hidden border border-zinc-800/60 ${className}`}>
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
