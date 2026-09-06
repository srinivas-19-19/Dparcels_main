import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Clock,
  Plus,
  Minus,
  Navigation,
  Package,
  MessageSquare
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminLiveTracking({ order, onBack }) {
  // Default fallback if order prop is omitted
  const currentOrder = order || {
    id: '#104',
    customer: 'Srinivasulu',
    rider: 'Gorkal sreenu',
    phone: '08309188159',
    customerPhone: '9876543210',
    pickup: 'Tuda Quarters MIG',
    drop: 'Railway Station',
    distance: '2.60 KM',
    amount: '₹88.00',
    status: 'In Transit',
    eta: '4 mins',
    distanceLeft: '1.2 KM'
  };

  const [zoomLevel, setZoomLevel] = useState(1);
  const [riderProgress, setRiderProgress] = useState(0.55); // 55% along route

  // Optional subtle rider movement simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setRiderProgress((prev) => (prev >= 0.9 ? 0.2 : prev + 0.02));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-tracking-view-container">
      {/* Header Row */}
      <div className="tracking-header-row">
        <div>
          <h1 className="header-greeting">Live Tracking</h1>
          <p className="header-subtext">Real-time delivery tracking.</p>
        </div>

        <button className="back-to-riders-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </button>
      </div>

      {/* Main Grid: Left Order Details Panel + Right Map Canvas */}
      <div className="tracking-main-grid">
        {/* LEFT ORDER DETAILS PANEL */}
        <div className="tracking-details-panel">
          <h2 className="panel-heading">ORDER DETAILS</h2>

          <div className="tracking-fields-list">
            <div className="field-row">
              <span className="field-label">Order ID</span>
              <span className="field-value orange">{currentOrder.id}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Customer</span>
              <span className="field-value">{currentOrder.customer}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Rider</span>
              <span className="field-value">{currentOrder.rider}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Phone</span>
              <span className="field-value">{currentOrder.phone}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Pickup</span>
              <span className="field-value address">{currentOrder.pickup}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Drop</span>
              <span className="field-value address">{currentOrder.drop}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Distance</span>
              <span className="field-value">{currentOrder.distance}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Amount</span>
              <span className="field-value">{currentOrder.amount}</span>
            </div>

            <div className="field-row">
              <span className="field-label">Status</span>
              <span className="status-pill in-transit">{currentOrder.status}</span>
            </div>

            <div className="field-row">
              <span className="field-label">ETA</span>
              <span className="field-value">{currentOrder.eta}</span>
            </div>
          </div>

          {/* Contact Action Buttons */}
          <div className="tracking-contact-buttons">
            <button
              className="btn-contact rider"
              onClick={() => alert(`Calling Rider (${currentOrder.rider}): ${currentOrder.phone}`)}
            >
              <User size={16} />
              <span>Contact Rider</span>
            </button>

            <button
              className="btn-contact customer"
              onClick={() => alert(`Calling Customer (${currentOrder.customer}): ${currentOrder.customerPhone || '9876543210'}`)}
            >
              <span>Contact Customer</span>
            </button>
          </div>
        </div>

        {/* RIGHT REAL-TIME MAP AREA */}
        <div className="map-canvas-container" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}>
          {/* Street Map Grid Overlay Background */}
          <svg viewBox="0 0 600 450" className="map-svg">
            <defs>
              {/* Street Map Grid Pattern */}
              <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#18140E" strokeWidth="1.5" />
                <path d="M 30 0 L 30 60" fill="none" stroke="#120E08" strokeWidth="1" />
                <path d="M 0 30 L 60 30" fill="none" stroke="#120E08" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Base Dark Map Background */}
            <rect width="600" height="450" fill="#050505" />
            <rect width="600" height="450" fill="url(#streetGrid)" />

            {/* Major Arterial Roads */}
            <path d="M 50 400 L 220 280 L 330 200 L 440 210 L 520 300" stroke="#1E1912" strokeWidth="8" fill="none" />
            <path d="M 100 50 L 200 150 L 330 200 L 450 110 L 550 80" stroke="#1E1912" strokeWidth="6" fill="none" />

            {/* Glowing Active Delivery Route Path */}
            <path
              d="M 120 280 Q 220 250 330 200 L 440 210 Q 480 270 520 300"
              stroke="#FF9F00"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 159, 0, 0.65))' }}
            />

            {/* Pickup Marker (Green Pin) */}
            <g transform="translate(120, 280)">
              <circle cx="0" cy="0" r="16" fill="rgba(34, 197, 94, 0.25)" />
              <circle cx="0" cy="0" r="10" fill="#22C55E" />
              <path d="M -4 -1 L 0 4 L 4 -4" stroke="#FFFFFF" strokeWidth="2" fill="none" />
            </g>

            {/* Dropoff Marker (Red Pin) */}
            <g transform="translate(520, 300)">
              <circle cx="0" cy="0" r="18" fill="rgba(239, 68, 68, 0.25)" />
              <path d="M 0 -14 C -6 -14 -10 -10 -10 -4 C -10 4 0 14 0 14 C 0 14 10 4 10 -4 C 10 -10 6 -14 0 -14 Z" fill="#EF4444" />
              <circle cx="0" cy="-4" r="3.5" fill="#FFFFFF" />
            </g>

            {/* Dynamic Moving Rider Badge */}
            {(() => {
              // Interpolate rider coordinates along route
              const rX = 120 + riderProgress * (520 - 120);
              const rY = 280 + Math.sin(riderProgress * Math.PI) * (-70) + riderProgress * (300 - 280);
              return (
                <g transform={`translate(${rX}, ${rY})`}>
                  <circle cx="0" cy="0" r="22" fill="#22C55E" fillOpacity="0.2" />
                  <circle cx="0" cy="0" r="16" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2.5" />
                  {/* Rider Scooter Symbol */}
                  <path d="M -6 2 L -2 -4 L 4 -4 L 6 2 Z" fill="#FFFFFF" />
                  <circle cx="-4" cy="4" r="3" fill="#000" />
                  <circle cx="4" cy="4" r="3" fill="#000" />
                </g>
              );
            })()}
          </svg>

          {/* Top Right Floating ETA Card */}
          <div className="map-eta-card">
            <div className="eta-title">ETA</div>
            <div className="eta-value">{currentOrder.eta}</div>
            <div className="distance-title">Distance Left</div>
            <div className="distance-value">{currentOrder.distanceLeft}</div>
          </div>

          {/* Bottom Right Map Controls */}
          <div className="map-controls-group">
            <button
              className="map-ctrl-btn"
              onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
              title="Zoom In"
            >
              <Plus size={18} />
            </button>
            <button
              className="map-ctrl-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              title="Zoom Out"
            >
              <Minus size={18} />
            </button>
            <button
              className="map-ctrl-btn"
              onClick={() => setZoomLevel(1)}
              title="Recenter Map"
            >
              <Navigation size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
