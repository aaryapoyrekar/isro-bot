import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoLocation {
  lat: number;
  lon: number;
  label?: string;
}

interface GeoMapProps {
  locations: GeoLocation[];
  height?: string;
}

const GeoMap: React.FC<GeoMapProps> = ({ locations, height = '200px' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create new map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      touchZoom: true,
    });

    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Create custom icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add markers
    const markers: L.Marker[] = [];
    locations.forEach((location, index) => {
      const marker = L.marker([location.lat, location.lon], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; font-size: 12px;">
            <strong>Location ${index + 1}</strong><br/>
            Lat: ${location.lat.toFixed(6)}<br/>
            Lon: ${location.lon.toFixed(6)}
            ${location.label ? `<br/>${location.label}` : ''}
          </div>
        `);
      markers.push(marker);
    });

    // Fit map to show all markers
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lon], 10);
    } else {
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  if (locations.length === 0) {
    return null;
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-xl"
    />
  );
};

export default GeoMap;