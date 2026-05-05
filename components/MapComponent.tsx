'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface Partner {
  _id: string;
  name: string;
  location: { coordinates: [number, number] };
}

interface MapProps {
  userLocation: [number, number]; // [lng, lat]
  partners: Partner[];
  radius: number; // in km
}

export default function MapComponent({ userLocation, partners, radius }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const partnerMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: userLocation[0] === 0 ? [77.5946, 12.9716] : userLocation,
      zoom: 13,
      pitch: 45,
    });

    map.current.on('load', () => {
      updateRadiusSource();
    });
  }, []);

  useEffect(() => {
    if (!map.current) return;

    if (userLocation[0] !== 0 || userLocation[1] !== 0) {
      map.current.flyTo({ center: userLocation, speed: 0.8 });
    }

    // Update user marker
    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'w-10 h-10 bg-violet-500 rounded-2xl border-2 border-white shadow-lg animate-float flex items-center justify-center text-xl cursor-pointer transition-transform duration-300 hover:scale-125';
      el.innerHTML = '👤';
      el.onclick = () => {
        map.current?.flyTo({ center: userLocation, zoom: 15, speed: 1 });
      };
      userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(userLocation)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(userLocation);
    }

    // Update partner markers
    partners.forEach(partner => {
      const { _id, location, name } = partner;
      if (!partnerMarkers.current[_id]) {
        const el = document.createElement('div');
        const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const emojis = ['💝', '🐱', '🐶', '🦄', '🐧'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        el.className = `w-12 h-12 ${color} rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-2xl cursor-pointer transition-transform duration-300 hover:scale-125`;
        el.innerHTML = `<span>${emoji}</span>`;
        el.title = name;
        
        const coords = location.coordinates as [number, number];
        el.onclick = () => {
          map.current?.flyTo({ center: coords, zoom: 15, speed: 1 });
        };

        partnerMarkers.current[_id] = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coords)
          .addTo(map.current!);
      } else {
        partnerMarkers.current[_id].setLngLat(location.coordinates as [number, number]);
      }
    });

    updateRadiusSource();
  }, [userLocation, partners, radius]);

  const updateRadiusSource = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const sourceId = 'radius-source';
    const layerId = 'radius-layer';

    const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points: number = 64) => {
      const coords = { latitude: center[1], longitude: center[0] };
      const km = radiusInKm;
      const ret = [];
      const distanceX = km / (111.32 * Math.cos(coords.latitude * Math.PI / 180));
      const distanceY = km / 110.57;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
      }
      ret.push(ret[0]);

      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ret] }
      } as any;
    };

    const data = createGeoJSONCircle(userLocation, radius);
    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(data);
    } else {
      map.current.addSource(sourceId, { type: 'geojson', data: data });
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        layout: {},
        paint: {
          'fill-color': '#8b5cf6',
          'fill-opacity': 0.1,
          'fill-outline-color': '#8b5cf6'
        }
      });
    }
  };

  return <div ref={mapContainer} className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl" />;
}
