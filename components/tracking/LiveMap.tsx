'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference image paths that don't survive
// bundling — point them at the CDN copies instead of shipping/wiring our own.
const riderIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface LatLng {
  lat: number;
  lng: number;
}

export function LiveMap({
  riderPosition,
  pickup,
  dropoff,
}: {
  riderPosition: LatLng | null;
  pickup: LatLng | null;
  dropoff: LatLng | null;
}) {
  const center = riderPosition ?? dropoff ?? pickup ?? { lat: -1.2921, lng: 36.8219 }; // default: Nairobi

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} className="h-72 w-full rounded">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]}>
          <Popup>Pickup</Popup>
        </Marker>
      )}
      {dropoff && (
        <Marker position={[dropoff.lat, dropoff.lng]}>
          <Popup>Drop-off</Popup>
        </Marker>
      )}
      {riderPosition && (
        <Marker position={[riderPosition.lat, riderPosition.lng]} icon={riderIcon}>
          <Popup>Rider&apos;s last known location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
