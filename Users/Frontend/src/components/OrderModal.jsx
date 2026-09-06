import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../context/LanguageContext';

export const OrderModal = ({ isOpen, serviceType, onClose }) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [pickupAddr, setPickupAddr] = useState('');
  const [dropAddr, setDropAddr] = useState('');
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const touchStartY = useRef(null);

  // Service configuration details
  const serviceConfigs = {
    food: {
      titleMain: "FOOD ",
      titleSub: "PICKUP",
      accentColor: "#FF8800",
      pickupPlaceholder: "Pickup Location (Restaurant)...",
      dropPlaceholder: "Drop Location (Home)...",
      storeLabel: "RESTAURANT",
      storePlaceholder: "e.g. Bawarchi, Paradise...",
      storeIcon: "fa-solid fa-utensils",
      itemPlaceholder: "Add item (e.g. 2 Chicken Biryani)",
      footnote: ""
    },
    medicine: {
      titleMain: "MEDICINE ",
      titleSub: "EXPRESS",
      accentColor: "#FF8800",
      pickupPlaceholder: "Pharmacy Pickup Location...",
      dropPlaceholder: "Drop Location (Home)...",
      storeLabel: "PHARMACY / STORE",
      storePlaceholder: "e.g. Apollo Pharmacy, MedPlus...",
      storeIcon: "fa-solid fa-prescription-bottle-medical",
      itemPlaceholder: "Add medicine (e.g. Paracetamol 500mg)",
      footnote: ""
    },
    groceries: {
      titleMain: "GROCERY ",
      titleSub: "ORDER",
      accentColor: "#FF8800",
      pickupPlaceholder: "Supermarket Pickup Location...",
      dropPlaceholder: "Drop Location (Home)...",
      storeLabel: "SUPERMARKET / MART",
      storePlaceholder: "e.g. D-Mart, More Supermarket...",
      storeIcon: "fa-solid fa-cart-shopping",
      itemPlaceholder: "Add item (e.g. 1L Milk, 1kg Rice)",
      footnote: ""
    },
    documents: {
      titleMain: "SEND ",
      titleSub: "DOCUMENTS",
      accentColor: "#FF8800",
      pickupPlaceholder: "Document Pickup Location...",
      dropPlaceholder: "Drop Location...",
      storeLabel: "PICKUP CONTACT / OFFICE",
      storePlaceholder: "Office Name / Contact Person",
      storeIcon: "fa-solid fa-file-signature",
      itemPlaceholder: "Item Description (e.g. Legal File)",
      footnote: "SECURE HANDLING GUARANTEED"
    },
    custom: {
      titleMain: "CUSTOM ",
      titleSub: "TASKS",
      accentColor: "#FF8800",
      pickupPlaceholder: "Custom Task Pickup Location...",
      dropPlaceholder: "Custom Task Drop Location...",
      storeLabel: "TASK TITLE",
      storePlaceholder: "Task Title (e.g. Pick up Keys)",
      storeIcon: "fa-solid fa-clipboard-list",
      itemPlaceholder: "Add item or detail...",
      footnote: "BASE RATE APPLIED. FINAL COST DEPENDS ON TASK."
    }
  };

  const config = serviceConfigs[serviceType] || serviceConfigs.custom;

  // Initialize and properly destroy Leaflet map on mount/unmount or service change
  useEffect(() => {
    let timer;
    if (isOpen && mapContainerRef.current) {
      timer = setTimeout(() => {
        // Clean up previous map instance if exists
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {}
          mapInstanceRef.current = null;
        }

        const pickupCoords = [17.3850, 78.4867];
        const dropCoords = [17.3980, 78.4980];

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([17.3915, 78.4923], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        // Green Marker for Pickup Location
        const pickupIcon = L.divIcon({
          html: '<div style="width:22px;height:22px;background:#22c55e;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 10px rgba(34,197,94,0.9);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;background:#ffffff;border-radius:50%;"></div></div>',
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        // Red Marker for Drop Location
        const dropIcon = L.divIcon({
          html: '<div style="width:22px;height:22px;background:#ef4444;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 10px rgba(239,68,68,0.9);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;background:#ffffff;border-radius:50%;"></div></div>',
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        L.marker(pickupCoords, { icon: pickupIcon }).addTo(map);
        L.marker(dropCoords, { icon: dropIcon }).addTo(map);

        const bounds = L.latLngBounds([pickupCoords, dropCoords]);
        map.fitBounds(bounds, { padding: [50, 50] });

        mapInstanceRef.current = map;
      }, 100);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, serviceType]);

  // Re-invalidate map size when sheet collapses/expands
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 200);
    }
  }, [isCollapsed]);

  const handleAddItem = () => {
    if (itemInput.trim()) {
      setItems([...items, itemInput.trim()]);
      setItemInput('');
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Drag handlers for collapsible sheet
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;

    if (diffY > 35 && !isCollapsed) {
      setIsCollapsed(true);
      touchStartY.current = null;
    } else if (diffY < -35 && isCollapsed) {
      setIsCollapsed(false);
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className={`order-modal-container ${isCollapsed ? 'collapsed-mode' : ''}`}>
        {/* Top Map Area with Stacked Floating Location Bars */}
        <div className="map-view-section">
          <div ref={mapContainerRef} className="full-top-map"></div>

          {/* Floating Back Button */}
          <button className="map-back-btn" onClick={onClose} aria-label="Go Back">
            <i className="fa-solid fa-arrow-left"></i>
          </button>

          {/* Floating Stacked Address Bars */}
          <div className="map-address-overlay">
            <div className="address-bar-pill">
              <span className="dot-icon green-dot"></span>
              <input
                type="text"
                className="overlay-input"
                placeholder={config.pickupPlaceholder}
                value={pickupAddr}
                onChange={(e) => setPickupAddr(e.target.value)}
              />
            </div>
            <div className="address-bar-pill">
              <span className="dot-icon red-dot"></span>
              <input
                type="text"
                className="overlay-input"
                placeholder={config.dropPlaceholder}
                value={dropAddr}
                onChange={(e) => setDropAddr(e.target.value)}
              />
              <button className="location-target-btn" title="Use current location">
                <i className="fa-solid fa-crosshairs"></i>
              </button>
            </div>
          </div>

          {/* Floating Expand Pill Button when collapsed */}
          {isCollapsed && (
            <button className="map-expand-pill" onClick={() => setIsCollapsed(false)}>
              <i className="fa-solid fa-chevron-up" style={{ color: '#ffffff' }}></i>
              <span>View Order Details</span>
            </button>
          )}
        </div>

        {/* Bottom Form Sheet */}
        <div
          className={`modal-content-bottom ${isCollapsed ? 'sheet-collapsed' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle Bar */}
          <div className="drag-handle-container" onClick={toggleCollapse}>
            <div className="modal-drag-handle"></div>
            <div className="collapse-hint-bar">
              <span className="collapse-title">{config.titleMain} {config.titleSub}</span>
              <i className={`fa-solid ${isCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'} collapse-icon`}></i>
            </div>
          </div>

          {/* Form Content - Hides when dragged to bottom */}
          {!isCollapsed && (
            <>
              <div className="form-group">
                <label className="form-label">{config.storeLabel}</label>
                <div className="store-input-wrapper">
                  <div className="store-icon-box">
                    <i className={config.storeIcon || 'fa-solid fa-store'} style={{ color: '#FF8800' }}></i>
                  </div>
                  <input
                    type="text"
                    className="input-control store-input"
                    placeholder={config.storePlaceholder}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ITEMS TO ORDER</label>
                <div className="input-wrapper item-add-wrapper">
                  <input
                    type="text"
                    className="input-control no-icon item-input"
                    placeholder={config.itemPlaceholder}
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                  />
                  <button type="button" className="btn-orange-add" onClick={handleAddItem} aria-label="Add item">
                    <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: '900', lineHeight: '1' }}>+</span>
                  </button>
                </div>
                {items.length === 0 ? (
                  <p className="no-items-text">
                    No items added yet.
                  </p>
                ) : (
                  <ul className="added-items-list">
                    {items.map((item, index) => (
                      <li key={index}>
                        <span>{item}</span>
                        <i
                          className="fa-solid fa-xmark remove-item-btn"
                          style={{ cursor: 'pointer', color: '#ef4444' }}
                          onClick={() => handleRemoveItem(index)}
                        ></i>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {serviceType === 'custom' && (
                <div className="form-group">
                  <label className="form-label">DETAILED INSTRUCTIONS</label>
                  <textarea
                    className="input-control no-icon"
                    rows={2}
                    placeholder="Detailed instructions for rider..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    style={{ resize: 'none' }}
                  ></textarea>
                </div>
              )}

              {/* Price & Distance Summary */}
              <div className="price-summary-box">
                <div className="summary-col">
                  <span className="summary-label">SHORTEST DIST.</span>
                  <strong className="summary-val">0.0 KM</strong>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-col">
                  <span className="summary-label">DELIVERY FEE</span>
                  <strong className="summary-val accent-orange">₹0.00</strong>
                </div>
              </div>

              {config.footnote && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
                  {config.footnote}
                </p>
              )}

              <button type="button" className="btn-primary btn-orange-submit" onClick={onClose}>
                <span>{t('confirm_order')}</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
