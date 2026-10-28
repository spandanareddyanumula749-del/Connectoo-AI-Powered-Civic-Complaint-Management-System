import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapMarkerItem } from '../types';
import { ExternalLink, Camera, AlertCircle } from 'lucide-react';

interface CivicMapViewProps {
  markers: MapMarkerItem[];
  center?: [number, number];
  zoom?: number;
}

const createColoredMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: 26px;
        height: 26px;
        background: ${color};
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

export const CivicMapView: React.FC<CivicMapViewProps> = ({
  markers,
  center = [17.4156, 78.4350],
  zoom = 12
}) => {
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker) => {
          const icon = createColoredMarkerIcon(marker.color || '#3b82f6');
          return (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={icon}
            >
              <Popup className="civic-custom-popup">
                <div className="p-1 max-w-xs text-slate-900 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-bold">
                      {marker.complaint_id}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: marker.color }}
                    >
                      {marker.priority}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                    {marker.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 mt-1">
                    <strong>Category:</strong> {marker.category_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    <strong>Area:</strong> {marker.address}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-700">
                      Status: {marker.status}
                    </span>
                    <Link
                      to={`/complaints/${marker.id}`}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      Inspect <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs">
        <p className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-2">Severity Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
            <span>Critical Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
            <span>High Urgency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></span>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Low Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};
