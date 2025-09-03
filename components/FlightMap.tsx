'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { Airport } from '@/lib/calculations';
import { Plane, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default markers in Next.js
interface IconDefaultWithGetIconUrl extends L.Icon.Default {
  _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as IconDefaultWithGetIconUrl)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface FlightMapProps {
  departure: Airport | null;
  destination: Airport | null;
  className?: string;
}

// Component to handle map view updates
function MapViewController({ departure, destination }: { departure: Airport | null; destination: Airport | null }) {
  const map = useMap();

  useEffect(() => {
    if (departure && destination) {
      const bounds = L.latLngBounds(
        [departure.latitude, departure.longitude],
        [destination.latitude, destination.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (departure) {
      map.setView([departure.latitude, departure.longitude], 8);
    } else if (destination) {
      map.setView([destination.latitude, destination.longitude], 8);
    }
  }, [departure, destination, map]);

  return null;
}

// Create custom icons
const createIcon = (color: string, icon: 'departure' | 'destination') => {
  const svgIcon = icon === 'departure' ? 
    renderToStaticMarkup(
      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg border-2" style={{ borderColor: color }}>
        <Plane className="w-4 h-4" style={{ color }} />
      </div>
    ) :
    renderToStaticMarkup(
      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-lg border-2" style={{ borderColor: color }}>
        <MapPin className="w-4 h-4" style={{ color }} />
      </div>
    );

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function FlightMap({ departure, destination, className }: FlightMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate great circle path points
  const getGreatCirclePath = (dep: Airport, dest: Airport): [number, number][] => {
    const points: [number, number][] = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      
      // Convert to radians
      const lat1 = dep.latitude * Math.PI / 180;
      const lon1 = dep.longitude * Math.PI / 180;
      const lat2 = dest.latitude * Math.PI / 180;
      const lon2 = dest.longitude * Math.PI / 180;
      
      // Calculate distance
      const d = 2 * Math.asin(Math.sqrt(
        Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
      ));
      
      // Calculate intermediate point
      const a = Math.sin((1 - f) * d) / Math.sin(d);
      const b = Math.sin(f * d) / Math.sin(d);
      
      const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
      const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
      const z = a * Math.sin(lat1) + b * Math.sin(lat2);
      
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
      const lon = Math.atan2(y, x) * 180 / Math.PI;
      
      points.push([lat, lon]);
    }
    
    return points;
  };

  const flightPath = departure && destination ? getGreatCirclePath(departure, destination) : [];

  return (
    <div className={className}>
      <MapContainer
        ref={mapRef}
        center={[33.128, -117.280]} // Carlsbad default
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        className="relative z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapViewController departure={departure} destination={destination} />
        
        {departure && (
          <Marker 
            position={[departure.latitude, departure.longitude]}
            icon={createIcon('#3b82f6', 'departure')}
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold">{departure.name}</p>
                <p className="text-sm text-gray-600">{departure.ident}</p>
                <p className="text-xs text-gray-500 mt-1">Departure</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {destination && (
          <Marker 
            position={[destination.latitude, destination.longitude]}
            icon={createIcon('#ef4444', 'destination')}
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold">{destination.name}</p>
                <p className="text-sm text-gray-600">{destination.ident}</p>
                <p className="text-xs text-gray-500 mt-1">Destination</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {flightPath.length > 0 && (
          <Polyline 
            positions={flightPath}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}