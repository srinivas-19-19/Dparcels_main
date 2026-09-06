import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus, Crosshair } from 'lucide-react';

// Custom Leaflet Icons using L.divIcon
const createCustomIcon = (htmlContent) => {
  return L.divIcon({
    html: htmlContent,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const riderIconHtml = `
  <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 138, 0, 0.4); animation: pulse 2s infinite;"></div>
    <div style="width: 26px; height: 26px; border-radius: 50%; background: #FF8A00; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 4px 12px rgba(255, 138, 0, 0.5);">
      🚀
    </div>
  </div>
`;

const pickupIconHtml = `
  <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
    <div style="background: #3B82F6; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 10px; white-space: nowrap; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);">
      📍 PICKUP (Source)
    </div>
    <div style="width: 14px; height: 14px; border-radius: 50%; background: #3B82F6; border: 2px solid #FFFFFF; margin-top: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
  </div>
`;

const dropIconHtml = `
  <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
    <div style="background: #FF8A00; color: #000000; font-size: 9px; font-weight: 900; padding: 3px 8px; border-radius: 10px; white-space: nowrap; box-shadow: 0 4px 12px rgba(255, 138, 0, 0.7);">
      🎯 DROP (Destination)
    </div>
    <div style="width: 14px; height: 14px; border-radius: 50%; background: #FF8A00; border: 2px solid #FFFFFF; margin-top: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
  </div>
`;

// Zone Pin Icons matching design screenshot
const orangePinHtml = `
  <div style="width: 24px; height: 24px; border-radius: 50%; background: #FF8A00; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(255, 138, 0, 0.6);">
    <div style="width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF;"></div>
  </div>
`;

const bluePinHtml = `
  <div style="width: 22px; height: 22px; border-radius: 50%; background: #3B82F6; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.6);">
    <div style="width: 7px; height: 7px; border-radius: 50%; background: #FFFFFF;"></div>
  </div>
`;

const greenPinHtml = `
  <div style="width: 22px; height: 22px; border-radius: 50%; background: #10B981; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.6);">
    <div style="width: 7px; height: 7px; border-radius: 50%; background: #FFFFFF;"></div>
  </div>
`;

const riderIcon = createCustomIcon(riderIconHtml);
const pickupIcon = createCustomIcon(pickupIconHtml);
const dropIcon = createCustomIcon(dropIconHtml);
const orangePinIcon = createCustomIcon(orangePinHtml);
const bluePinIcon = createCustomIcon(bluePinHtml);
const greenPinIcon = createCustomIcon(greenPinHtml);

// AutoFit bounds to ensure Source, Destination, and Rider fit on screen
const AutoFitRouteBounds = ({ pickupPos, dropPos, riderPos, routePoints, showServiceZones }) => {
  const map = useMap();

  useEffect(() => {
    if (showServiceZones) {
      // Center and zoom cleanly on Adoni Service Area
      map.setView([15.6322, 77.2728], 13);
      return;
    }

    const points = [];
    if (pickupPos) points.push(pickupPos);
    if (dropPos) points.push(dropPos);
    if (riderPos) points.push(riderPos);
    if (routePoints && routePoints.length > 0) {
      points.push(...routePoints);
    }

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      } catch (err) {
        console.warn('fitBounds error:', err);
      }
    }
  }, [map, pickupPos, dropPos, riderPos, routePoints, showServiceZones]);

  return null;
};

// Map Button Controls (Top Right overlay like design)
const MapControlsOverlay = ({ riderPos, onRecenter }) => {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleRecenter = () => {
    if (onRecenter) onRecenter();
    if (riderPos) {
      map.flyTo(riderPos, 14, { duration: 1 });
    }
  };

  return (
    <div style={{
      position: 'absolute',
      right: '12px',
      top: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 1000
    }}>
      {/* Zoom Controls (+ / -) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button 
          onClick={handleZoomIn}
          style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: '#111111', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: '1px solid #E0E0E0' }}
          title="Zoom In"
        >
          +
        </button>
        
        <button 
          onClick={handleZoomOut}
          style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: '#111111', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Recenter Button */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 6px 16px rgba(0,0,0,0.25)'
      }}>
        <button 
          onClick={handleRecenter}
          style={{ width: '36px', height: '36px', background: 'none', border: 'none', color: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          title="Current Location"
        >
          <Crosshair size={18} />
        </button>
      </div>
    </div>
  );
};

const RealMap = ({ 
  riderPos, 
  pickupPos, 
  dropPos, 
  routePoints,
  showServiceZones,
  onRecenter
}) => {
  const center = riderPos || [15.6322, 77.2728];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        style={{ width: '100%', height: '100%', backgroundColor: '#E5E0D8' }}
      >
        <AutoFitRouteBounds 
          pickupPos={pickupPos} 
          dropPos={dropPos} 
          riderPos={riderPos} 
          routePoints={routePoints}
          showServiceZones={showServiceZones}
        />
        <MapControlsOverlay riderPos={riderPos} onRecenter={onRecenter} />

        {/* Real OpenStreetMap Terrain Tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {/* SERVICE ZONES (Shown when showServiceZones is true) */}
        {showServiceZones && (
          <>
            {/* Orange Shaded Busy Zone 1 (Kurnool Road Area - Small) */}
            <Circle
              center={[15.6420, 77.2800]}
              radius={300}
              pathOptions={{ fillColor: '#FF8A00', fillOpacity: 0.35, color: '#FF8A00', weight: 1.5 }}
            />
            {/* Orange Shaded Busy Zone 2 (Adoni Road Area - Small) */}
            <Circle
              center={[15.6200, 77.2850]}
              radius={250}
              pathOptions={{ fillColor: '#FF8A00', fillOpacity: 0.35, color: '#FF8A00', weight: 1.5 }}
            />

            {/* Blue Center Source Circle (Small & Subtle) */}
            <Circle
              center={[15.6322, 77.2728]}
              radius={300}
              pathOptions={{ fillColor: '#3B82F6', fillOpacity: 0.15, color: '#3B82F6', weight: 1.5, dashArray: '4, 4' }}
            />
            <Circle
              center={[15.6322, 77.2728]}
              radius={140}
              pathOptions={{ fillColor: '#3B82F6', fillOpacity: 0.35, color: '#3B82F6', weight: 2 }}
            />

            {/* Busy Zone Orange Pins */}
            <Marker position={[15.6420, 77.2800]} icon={orangePinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>🔥 High Demand Busy Zone (Kurnool Rd)</div></Popup>
            </Marker>
            <Marker position={[15.6200, 77.2850]} icon={orangePinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>🔥 High Demand Busy Zone (Adoni Rd)</div></Popup>
            </Marker>

            {/* Pickup Areas Blue Pins */}
            <Marker position={[15.6370, 77.2620]} icon={bluePinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>📍 Pickup Area: Kalluru Rd</div></Popup>
            </Marker>
            <Marker position={[15.6240, 77.2710]} icon={bluePinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>📍 Pickup Area: South Junction</div></Popup>
            </Marker>
            <Marker position={[15.6322, 77.2728]} icon={bluePinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>📍 Pickup Area: Adoni Center</div></Popup>
            </Marker>

            {/* Drop Areas Green Pins */}
            <Marker position={[15.6280, 77.2550]} icon={greenPinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>📦 Drop Area: West Kalluru</div></Popup>
            </Marker>
            <Marker position={[15.6360, 77.2920]} icon={greenPinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>📦 Drop Area: East Adoni</div></Popup>
            </Marker>
            <Marker position={[15.6180, 77.2930]} icon={greenPinIcon}>
              <Popup><div style={{ color: '#000', fontWeight: '800' }}>📦 Drop Area: Southeast Colony</div></Popup>
            </Marker>
          </>
        )}

        {/* Driving Road Route Polyline (Outer Glow Line) */}
        {routePoints && routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color="#E86F00"
            weight={9}
            opacity={0.6}
            lineCap="round"
          />
        )}

        {/* Driving Road Route Polyline (Inner Bright Orange Line) */}
        {routePoints && routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            color="#FF8A00"
            weight={5}
            opacity={1.0}
            lineCap="round"
          />
        )}

        {/* Rider Rocket Marker */}
        {riderPos && (
          <Marker position={riderPos} icon={riderIcon}>
            <Popup>
              <div style={{ color: '#000000', fontWeight: '800', fontSize: '13px' }}>
                🚀 Rider Current Location (Sreenu)
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup Marker (Source) */}
        {pickupPos && (
          <Marker position={pickupPos} icon={pickupIcon}>
            <Popup>
              <div style={{ color: '#000000', fontWeight: '800', fontSize: '13px' }}>
                📍 SOURCE PICKUP: DParcels Hub, Adoni
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drop Marker (Destination) */}
        {dropPos && (
          <Marker position={dropPos} icon={dropIcon}>
            <Popup>
              <div style={{ color: '#000000', fontWeight: '800', fontSize: '13px' }}>
                🎯 DESTINATION DROP: Near Railway Station, Adoni
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default RealMap;
