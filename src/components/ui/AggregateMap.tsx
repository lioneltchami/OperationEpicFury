"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import type { TimelineEvent } from "@/data/timeline";
import { redIcon } from "@/lib/map-utils";

function createClusterIcon(cluster: { getChildCount: () => number }) {
	const count = cluster.getChildCount();
	const size = count < 10 ? 36 : count < 50 ? 44 : 52;
	return L.divIcon({
		html: `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:rgba(220,38,38,0.85);color:#fff;font-weight:800;font-size:${count < 10 ? 14 : count < 50 ? 16 : 18}px;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 8px rgba(220,38,38,0.6)">${count}</span>`,
		className: "",
		iconSize: L.point(size, size),
		iconAnchor: [size / 2, size / 2],
	});
}

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
			<MarkerClusterGroup
				chunkedLoading
				maxClusterRadius={40}
				iconCreateFunction={createClusterIcon}
			>
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
