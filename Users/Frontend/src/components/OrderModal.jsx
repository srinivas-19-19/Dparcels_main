import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useJsApiLoader, GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import api from '../utils/api';
import mapService from '../utils/mapService';
import addressService from '../utils/addressService';
import { useLanguage } from '../context/LanguageContext';
import { ErrorBoundary } from './ErrorBoundary';

export const OrderModal = ({ isOpen, serviceType, onClose, onNavigateOrders }) => {
  const { t } = useLanguage();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const mapInstanceRef = useRef(null);

  // -----------------------------------------------------------
  // 1. LOCATION STATE (Address + Geo-coordinates)
  // -----------------------------------------------------------
  const [pickupLocation, setPickupLocation] = useState({
    address: 'Banjara Hills, Hyderabad',
    lat: 17.4156,
    lng: 78.4357
  });

  const [dropoffLocation, setDropoffLocation] = useState({
    address: 'Hitech City, Hyderabad',
    lat: 17.4435,
    lng: 78.3772
  });

  // Autocomplete suggestions & active input state
  const [pickupQuery, setPickupQuery] = useState('Banjara Hills, Hyderabad');
  const [dropQuery, setDropQuery] = useState('Hitech City, Hyderabad');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDrop, setIsSearchingDrop] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState(null); // 'pickup' | 'drop' | null

  // Geolocation detection state
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    if (isOpen) {
      addressService.getAddresses()
        .then((addrs) => {
          setSavedAddresses(addrs || []);
          // If default address is present, optionally pre-fill dropoff if not yet customized
          const defaultAddr = addrs?.find((a) => a.isDefault);
          if (defaultAddr && dropoffLocation.address === 'Hitech City, Hyderabad') {
            const formatted = [defaultAddr.streetAddress, defaultAddr.city].filter(Boolean).join(', ');
            setDropoffLocation({
              address: formatted,
              lat: Number(defaultAddr.latitude),
              lng: Number(defaultAddr.longitude),
            });
            setDropQuery(formatted);
          }
        })
        .catch((err) => console.warn('[OrderModal] Error loading saved addresses:', err));
    }
  }, [isOpen]);

  // -----------------------------------------------------------
  // 2. PRICING ESTIMATE STATE
  // -----------------------------------------------------------
  const [estimate, setEstimate] = useState(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState('');

  // -----------------------------------------------------------
  // 3. ORDER SUBMISSION & FORM STATE
  // -----------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const touchStartY = useRef(null);
  const searchDebounceRef = useRef(null);

  // Service configuration details
  const serviceConfigs = {
    food: {
      titleMain: "FOOD ",
      titleSub: "PICKUP",
      accentColor: "#FF8800",
      pickupPlaceholder: "Pickup Location (Restaurant)...",
      dropPlaceholder: "Drop Location (Home/Office)...",
      storeLabel: "RESTAURANT",
      storePlaceholder: "e.g. Bawarchi, Paradise, Shah Ghouse...",
      storeIcon: "fa-solid fa-utensils",
      itemPlaceholder: "Add item (e.g. 2 Chicken Biryani)",
      footnote: "₹39 FOR FIRST 3 KM • ₹10/KM THEREAFTER"
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
      footnote: "₹39 FOR FIRST 3 KM • ₹10/KM THEREAFTER"
    },
    groceries: {
      titleMain: "GROCERY ",
      titleSub: "ORDER",
      accentColor: "#FF8800",
      pickupPlaceholder: "Supermarket Pickup Location...",
      dropPlaceholder: "Drop Location (Home)...",
      storeLabel: "SUPERMARKET / MART",
      storePlaceholder: "e.g. D-Mart, Ratnadeep, More...",
      storeIcon: "fa-solid fa-cart-shopping",
      itemPlaceholder: "Add item (e.g. 1L Milk, 1kg Rice)",
      footnote: "₹39 FOR FIRST 3 KM • ₹10/KM THEREAFTER"
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
      itemPlaceholder: "Item Description (e.g. Legal File, Passport)",
      footnote: "₹39 FOR FIRST 3 KM • ₹10/KM THEREAFTER"
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
      footnote: "₹39 FOR FIRST 3 KM • ₹10/KM THEREAFTER"
    }
  };

  const config = serviceConfigs[serviceType] || serviceConfigs.custom;

  // -----------------------------------------------------------
  // 4. MAP INITIALIZATION & INTERACTIVE MARKERS
  // -----------------------------------------------------------
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded && isOpen && window.google?.maps) {
      const hasPickup = pickupLocation.lat !== null && pickupLocation.lng !== null;
      const hasDrop = dropoffLocation.lat !== null && dropoffLocation.lng !== null;

      if (hasPickup && hasDrop) {
        try {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
          bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });
          mapInstanceRef.current.fitBounds(bounds, 50);
        } catch (err) {
          console.warn('Map bounds error:', err);
        }
      } else if (hasPickup) {
        mapInstanceRef.current.panTo({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      }
    }
  }, [pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng, isLoaded, isOpen]);

  // Invalidate map size on sheet collapse/expand (Google Maps handles this mostly, but we can trigger resize)
  useEffect(() => {
    if (mapInstanceRef.current && window.google?.maps?.event) {
      const t = setTimeout(() => {
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isCollapsed]);

  // -----------------------------------------------------------
  // 5. REVERSE GEOCODING (Coords -> Human Readable Address via Backend Maps)
  // -----------------------------------------------------------
  const reverseGeocode = async (lat, lng, target) => {
    try {
      const data = await mapService.reverseGeocode(lat, lng);
      if (data && data.formattedAddress) {
        const concise = data.formattedAddress;
        if (target === 'pickup') {
          setPickupLocation(prev => ({ ...prev, address: concise }));
          setPickupQuery(concise);
        } else {
          setDropoffLocation(prev => ({ ...prev, address: concise }));
          setDropQuery(concise);
        }
      }
    } catch (err) {
      console.warn('[ReverseGeocode] Notice:', err);
    }
  };

  // -----------------------------------------------------------
  // 6. AUTOCOMPLETE SEARCH (Query -> Suggestions via Backend Maps)
  // -----------------------------------------------------------

  const handleAddressSearch = (query, target) => {
    if (target === 'pickup') {
      setPickupQuery(query);
      setActiveLocationField('pickup');
    } else {
      setDropQuery(query);
      setActiveLocationField('drop');
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!query || query.trim().length < 2) {
      if (target === 'pickup') setPickupSuggestions([]);
      else setDropSuggestions([]);
      return;
    }

    if (target === 'pickup') setIsSearchingPickup(true);
    else setIsSearchingDrop(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await mapService.autocomplete(query);
        if (target === 'pickup') {
          setPickupSuggestions(results || []);
        } else {
          setDropSuggestions(results || []);
        }
      } catch (e) {
        console.warn('[Map Autocomplete Error]:', e);
      } finally {
        if (target === 'pickup') setIsSearchingPickup(false);
        else setIsSearchingDrop(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = async (item, target) => {
    let lat = item.lat;
    let lng = item.lng ?? item.lon;
    let concise = item.description || item.formattedAddress || item.display_name;

    if ((lat === undefined || lng === undefined) && item.placeId) {
      try {
        const details = await mapService.getPlaceDetails(item.placeId);
        if (details) {
          lat = details.lat;
          lng = details.lng;
          concise = details.formattedAddress || concise;
        }
      } catch (err) {
        console.warn('[GetPlaceDetails Error]:', err);
      }
    }

    if (lat !== undefined && lng !== undefined) {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      if (target === 'pickup') {
        setPickupLocation({ address: concise, lat: numLat, lng: numLng });
        setPickupQuery(concise);
        setPickupSuggestions([]);
        setActiveLocationField(null);
      } else {
        setDropoffLocation({ address: concise, lat: numLat, lng: numLng });
        setDropQuery(concise);
        setDropSuggestions([]);
        setActiveLocationField(null);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([numLat, numLng]);
      }
    }
  };

  const handleSelectSavedAddress = (addr, target = 'dropoff') => {
    const formatted = [addr.streetAddress, addr.city].filter(Boolean).join(', ');
    const numLat = parseFloat(addr.latitude);
    const numLng = parseFloat(addr.longitude);

    if (target === 'pickup') {
      setPickupLocation({ address: formatted, lat: numLat, lng: numLng });
      setPickupQuery(formatted);
      setPickupSuggestions([]);
      setActiveLocationField(null);
    } else {
      setDropoffLocation({ address: formatted, lat: numLat, lng: numLng });
      setDropQuery(formatted);
      setDropSuggestions([]);
      setActiveLocationField(null);
    }

    if (mapInstanceRef.current && !isNaN(numLat) && !isNaN(numLng)) {
      mapInstanceRef.current.panTo([numLat, numLng]);
    }
  };

  // -----------------------------------------------------------
  // 7. CURRENT GPS LOCATION DETECTION
  // -----------------------------------------------------------
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        setPickupLocation(prev => ({
          ...prev,
          lat,
          lng,
          address: 'Current Location'
        }));
        setPickupQuery('Current Location');
        setIsLocatingUser(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(15);
        }

        reverseGeocode(lat, lng, 'pickup');
      },
      (err) => {
        console.warn('[Geolocation Error]:', err.message);
        setIsLocatingUser(false);
        alert('Could not retrieve current location. Please select on the map or type an address.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // -----------------------------------------------------------
  // 8. PRICING ENGINE API INTEGRATION
  // -----------------------------------------------------------
  const fetchPriceEstimate = useCallback(async () => {
    const hasValidCoords =
      pickupLocation.lat !== null &&
      pickupLocation.lng !== null &&
      dropoffLocation.lat !== null &&
      dropoffLocation.lng !== null &&
      !isNaN(pickupLocation.lat) &&
      !isNaN(pickupLocation.lng) &&
      !isNaN(dropoffLocation.lat) &&
      !isNaN(dropoffLocation.lng);

    if (!hasValidCoords) {
      setEstimate(null);
      setPricingError('');
      return;
    }

    setIsPricingLoading(true);
    setPricingError('');

    try {
      const payload = {
        pickupLat: Number(pickupLocation.lat),
        pickupLng: Number(pickupLocation.lng),
        dropLat: Number(dropoffLocation.lat),
        dropLng: Number(dropoffLocation.lng),
        serviceType: serviceType === 'medicine' ? 'EXPRESS' : 'STANDARD'
      };

      const response = await api.post('/pricing/estimate', payload);
      const data = response.data?.data;

      if (data && typeof data.totalAmount === 'number') {
        setEstimate(data);
      } else {
        throw new Error('Invalid price response from pricing engine.');
      }
    } catch (error) {
      console.error('[Pricing Estimate API Error]:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Unable to calculate fare. Please adjust pickup and dropoff points.';
      setPricingError(errorMsg);
      setEstimate(null);
    } finally {
      setIsPricingLoading(false);
    }
  }, [pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng, serviceType]);

  useEffect(() => {
    if (isOpen) {
      fetchPriceEstimate();
    }
  }, [fetchPriceEstimate, isOpen]);

  // -----------------------------------------------------------
  // 9. ITEMS & DRAG HANDLE
  // -----------------------------------------------------------
  const handleAddItem = () => {
    if (itemInput.trim()) {
      setItems([...items, itemInput.trim()]);
      setItemInput('');
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

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

  // -----------------------------------------------------------
  // 10. ORDER CONFIRMATION & SUBMISSION TO BACKEND
  // -----------------------------------------------------------
  const canConfirmOrder =
    estimate !== null &&
    !isPricingLoading &&
    !pricingError &&
    pickupLocation.lat !== null &&
    dropoffLocation.lat !== null &&
    !isSubmitting;

  const handleConfirmOrder = async () => {
    if (!canConfirmOrder) return;

    setIsSubmitting(true);
    setOrderError('');

    // Generate cryptographic or collision-resistant UUID v4 idempotency key
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);

    const payload = {
      idempotencyKey,
      pickupAddress: (pickupLocation.address || pickupQuery || 'Pickup Point').trim(),
      pickupLat: Number(pickupLocation.lat),
      pickupLng: Number(pickupLocation.lng),
      dropAddress: (dropoffLocation.address || dropQuery || 'Drop Point').trim(),
      dropoffAddress: (dropoffLocation.address || dropQuery || 'Drop Point').trim(),
      dropLat: Number(dropoffLocation.lat),
      dropoffLat: Number(dropoffLocation.lat),
      dropLng: Number(dropoffLocation.lng),
      dropoffLng: Number(dropoffLocation.lng),
      totalAmount: Number(estimate.totalAmount),
      distanceKm: Number(estimate.distanceKm),
      serviceType: serviceType ? serviceType.toUpperCase() : 'STANDARD',
      packageCategory: serviceType || 'custom',
      storeName: storeName.trim() || undefined,
      items: items.length > 0 ? items : undefined,
      instructions: instructions.trim() || undefined,
    };

    try {
      const response = await api.post('/orders', payload);
      const createdOrder = response.data?.data;

      // Reset local state
      setStoreName('');
      setItems([]);
      setItemInput('');
      setInstructions('');
      setEstimate(null);
      setIsSubmitting(false);

      // Dispatch real-time events across UI components
      window.dispatchEvent(new CustomEvent('dparcels:orderCreated', { detail: createdOrder }));
      window.dispatchEvent(new CustomEvent('dparcels:refreshDashboard'));

      // On Success: Close modal and redirect user to /orders view
      if (onNavigateOrders) {
        onNavigateOrders(createdOrder);
      } else {
        // Fallback event dispatch
        window.dispatchEvent(new CustomEvent('dparcels:navigate', { detail: 'orders' }));
        onClose();
      }
    } catch (err) {
      console.error('[Order Creation Error]:', err);
      setIsSubmitting(false);

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to create order. Please try again.';

      setOrderError(errorMsg);
    }
  };

  const polylinePath = useMemo(() => {
    if (pickupLocation.lat && dropoffLocation.lat) {
      return [
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: dropoffLocation.lat, lng: dropoffLocation.lng }
      ];
    }
    return null;
  }, [pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className={`order-modal-container ${isCollapsed ? 'collapsed-mode' : ''}`}>
        
        {/* TOP MAP VIEW SECTION */}
        <div className="map-view-section">
          <ErrorBoundary>
            {isLoaded ? (
              <GoogleMap
                mapContainerClassName="full-top-map"
                center={{ lat: pickupLocation.lat || 17.3850, lng: pickupLocation.lng || 78.4867 }}
                zoom={13}
                options={{ disableDefaultUI: true, zoomControl: false }}
                onLoad={(map) => { mapInstanceRef.current = map; }}
                onClick={(e) => {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  const cleanLat = parseFloat(lat.toFixed(6));
                  const cleanLng = parseFloat(lng.toFixed(6));
        
                  if (activeLocationField === 'pickup') {
                    setPickupLocation(prev => ({ ...prev, lat: cleanLat, lng: cleanLng }));
                    reverseGeocode(cleanLat, cleanLng, 'pickup');
                  } else {
                    setDropoffLocation(prev => ({ ...prev, lat: cleanLat, lng: cleanLng }));
                    reverseGeocode(cleanLat, cleanLng, 'dropoff');
                  }
                }}
              >
                {pickupLocation.lat && (
                  <Marker
                    position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }}
                    draggable={true}
                    onDragEnd={(e) => {
                      if (!e.latLng) return;
                      const lat = parseFloat(e.latLng.lat().toFixed(6));
                      const lng = parseFloat(e.latLng.lng().toFixed(6));
                      setPickupLocation(prev => ({ ...prev, lat, lng }));
                      reverseGeocode(lat, lng, 'pickup');
                    }}
                    icon={'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="13" fill="#22c55e"/><circle cx="13" cy="13" r="4" fill="#ffffff"/></svg>')}
                  />
                )}
                {dropoffLocation.lat && (
                  <Marker
                    position={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }}
                    draggable={true}
                    onDragEnd={(e) => {
                      if (!e.latLng) return;
                      const lat = parseFloat(e.latLng.lat().toFixed(6));
                      const lng = parseFloat(e.latLng.lng().toFixed(6));
                      setDropoffLocation(prev => ({ ...prev, lat, lng }));
                      reverseGeocode(lat, lng, 'dropoff');
                    }}
                    icon={'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="13" fill="#ef4444"/><circle cx="13" cy="13" r="4" fill="#ffffff"/></svg>')}
                  />
                )}
                {polylinePath && (
                  <Polyline
                    path={polylinePath}
                    options={{
                      strokeColor: '#FF8800',
                      strokeWeight: 4,
                      strokeOpacity: 0.85
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="full-top-map" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--primary-orange-light)', fontSize: 24 }}></i>
              </div>
            )}
          </ErrorBoundary>

          {/* Floating Back Button */}
          <button className="map-back-btn" onClick={onClose} aria-label="Go Back" disabled={isSubmitting}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>

          {/* FLOATING STACKED LOCATION SELECTION BARS */}
          <div className="map-address-overlay">
            
            {/* PICKUP ADDRESS BAR */}
            <div className="address-bar-pill" style={{ position: 'relative' }}>
              <span className="dot-icon green-dot" title="Pickup Location (Green Pin)"></span>
              <div className="address-input-container">
                <input
                  type="text"
                  className="overlay-input"
                  placeholder={config.pickupPlaceholder}
                  value={pickupQuery}
                  onChange={(e) => handleAddressSearch(e.target.value, 'pickup')}
                  onFocus={() => setActiveLocationField('pickup')}
                  disabled={isSubmitting}
                />
                
                {/* Autocomplete suggestions dropdown for Pickup */}
                {pickupSuggestions.length > 0 && activeLocationField === 'pickup' && (
                  <ul className="autocomplete-dropdown">
                    {pickupSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        className="autocomplete-item"
                        onClick={() => handleSelectSuggestion(item, 'pickup')}
                      >
                        <i className="fa-solid fa-location-dot" style={{ color: '#22c55e' }}></i>
                        <span>
                          {item.mainText ? (
                            <>
                              <strong>{item.mainText}</strong>{' '}
                              <small style={{ opacity: 0.75, display: 'block', fontSize: 11 }}>
                                {item.secondaryText}
                              </small>
                            </>
                          ) : (
                            item.description || item.display_name
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Use Current GPS Location Button */}
              <button
                type="button"
                className="location-target-btn"
                title="Use Current GPS Location"
                onClick={handleUseCurrentLocation}
                disabled={isLocatingUser || isSubmitting}
              >
                <i className={`fa-solid ${isLocatingUser ? 'fa-spinner fa-spin' : 'fa-crosshairs'}`}></i>
              </button>
            </div>

            {/* DROPOFF ADDRESS BAR */}
            <div className="address-bar-pill" style={{ position: 'relative' }}>
              <span className="dot-icon red-dot" title="Dropoff Location (Red Pin)"></span>
              <div className="address-input-container">
                <input
                  type="text"
                  className="overlay-input"
                  placeholder={config.dropPlaceholder}
                  value={dropQuery}
                  onChange={(e) => handleAddressSearch(e.target.value, 'dropoff')}
                  onFocus={() => setActiveLocationField('drop')}
                  disabled={isSubmitting}
                />

                {/* Autocomplete suggestions dropdown for Dropoff */}
                {dropSuggestions.length > 0 && activeLocationField === 'drop' && (
                  <ul className="autocomplete-dropdown">
                    {dropSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        className="autocomplete-item"
                        onClick={() => handleSelectSuggestion(item, 'dropoff')}
                      >
                        <i className="fa-solid fa-location-dot" style={{ color: '#ef4444' }}></i>
                        <span>
                          {item.mainText ? (
                            <>
                              <strong>{item.mainText}</strong>{' '}
                              <small style={{ opacity: 0.75, display: 'block', fontSize: 11 }}>
                                {item.secondaryText}
                              </small>
                            </>
                          ) : (
                            item.description || item.display_name
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* SAVED ADDRESSES QUICK-PICKER CHIPS ROW */}
            {savedAddresses.length > 0 && (
              <div
                className="saved-addresses-chips-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  overflowX: 'auto',
                  padding: '2px 0',
                  marginTop: 2,
                  scrollbarWidth: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#FF8800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <i className="fa-solid fa-bookmark" style={{ fontSize: 9 }}></i>
                  {activeLocationField === 'pickup' ? 'PICKUP:' : 'DROP:'}
                </span>

                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'rgba(20, 20, 20, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 14,
                      padding: '3px 9px',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                    onClick={() => {
                      const target = activeLocationField === 'pickup' ? 'pickup' : 'dropoff';
                      handleSelectSavedAddress(addr, target);
                    }}
                    title={`${addr.label}: ${addr.streetAddress}, ${addr.city}`}
                  >
                    <i
                      className={
                        addr.label === 'Home'
                          ? 'fa-solid fa-house'
                          : addr.label === 'Work'
                          ? 'fa-solid fa-briefcase'
                          : 'fa-solid fa-location-dot'
                      }
                      style={{ fontSize: 10, color: '#FF8800' }}
                    ></i>
                    <span>{addr.label}</span>
                    {addr.isDefault && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: '#10b981',
                        }}
                      ></span>
                    )}
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Floating Expand Pill when sheet is collapsed */}
          {isCollapsed && (
            <button className="map-expand-pill" onClick={() => setIsCollapsed(false)}>
              <i className="fa-solid fa-chevron-up" style={{ color: '#ffffff' }}></i>
              <span>View Fare & Order Details</span>
            </button>
          )}
        </div>

        {/* BOTTOM FORM SHEET */}
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

          {/* FORM CONTENT */}
          {!isCollapsed && (
            <>
              {/* ORDER SUBMISSION ERROR BANNER */}
              {orderError && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 16, flexShrink: 0 }}></i>
                  <span style={{ flex: 1 }}>{orderError}</span>
                  <button
                    type="button"
                    onClick={() => setOrderError('')}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14 }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}

              {/* PRICING CALCULATION ERROR BANNER */}
              {pricingError && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>{pricingError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchPriceEstimate}
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* STORE OR VENDOR NAME */}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* ITEMS LIST INPUT */}
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
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn-orange-add"
                    onClick={handleAddItem}
                    aria-label="Add item"
                    disabled={isSubmitting}
                  >
                    <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: '900', lineHeight: '1' }}>+</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <p className="no-items-text">
                    No items added yet. Type an item name and click +
                  </p>
                ) : (
                  <ul className="added-items-list">
                    {items.map((item, index) => (
                      <li key={index}>
                        <span>{item}</span>
                        <i
                          className="fa-solid fa-xmark remove-item-btn"
                          style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer', color: '#ef4444' }}
                          onClick={() => !isSubmitting && handleRemoveItem(index)}
                        ></i>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CUSTOM INSTRUCTIONS */}
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
                    disabled={isSubmitting}
                  ></textarea>
                </div>
              )}

              {/* DYNAMIC PRICING & DISTANCE SUMMARY CARD */}
              <div className="price-summary-box" style={{ flexDirection: 'column', gap: 10 }}>
                {isPricingLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 0' }}>
                    <div className="pricing-spinner"></div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-orange-light)' }}>
                      Calculating accurate route distance & fare...
                    </span>
                  </div>
                ) : estimate ? (
                  <>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <div className="summary-col">
                        <span className="summary-label">SHORTEST DIST.</span>
                        <strong className="summary-val">{estimate.distanceKm} KM</strong>
                      </div>
                      <div className="summary-divider"></div>
                      <div className="summary-col">
                        <span className="summary-label">ESTIMATED TIME</span>
                        <strong className="summary-val">{estimate.estimatedTimeMins} MINS</strong>
                      </div>
                      <div className="summary-divider"></div>
                      <div className="summary-col">
                        <span className="summary-label">TOTAL FARE</span>
                        <strong className="summary-val accent-orange">₹{estimate.totalAmount}</strong>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: 8,
                      fontSize: 11,
                      color: 'var(--text-muted)'
                    }}>
                      <span>Base Fare (≤ 3 km): <strong style={{ color: '#fff' }}>₹{estimate.basePrice || 39}</strong></span>
                      <span>
                        {estimate.distancePrice > 0
                          ? `Extra (${estimate.extraKm ?? Math.ceil(estimate.distanceKm - 3)} km @ ₹10/km): `
                          : 'Extra Dist. (> 3 km): '}
                        <strong style={{ color: '#fff' }}>₹{estimate.distancePrice || 0}</strong>
                      </span>
                      <span style={{ color: '#22c55e', fontWeight: 800 }}>LIVE RATE</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: 'rgba(255, 136, 0, 0.08)',
                      border: '1px dashed rgba(255, 136, 0, 0.3)',
                      borderRadius: 8,
                      padding: '5px 10px',
                      fontSize: 11,
                      color: 'var(--primary-orange-light, #FF8800)',
                      fontWeight: 600,
                      marginTop: 4
                    }}>
                      <i className="fa-solid fa-tag" style={{ fontSize: 10 }}></i>
                      <span>₹39 for first 3 km • ₹10 for each extra 1 km</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    <i className="fa-solid fa-map-pin" style={{ color: '#FF8800', marginRight: 6 }}></i>
                    <span>Select both pickup and dropoff points to calculate route fare.</span>
                  </div>
                )}
              </div>

              {/* FOOTNOTE */}
              {config.footnote && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
                  {config.footnote}
                </p>
              )}

              {/* ACTION BUTTON (DISABLED UNTIL VALID ESTIMATE RETURNED OR SUBMITTING) */}
              <button
                type="button"
                className="btn-primary btn-orange-submit"
                disabled={!canConfirmOrder}
                onClick={handleConfirmOrder}
                style={{
                  opacity: canConfirmOrder ? 1 : 0.65,
                  cursor: canConfirmOrder ? 'pointer' : 'not-allowed',
                  boxShadow: canConfirmOrder ? '0 6px 20px rgba(255, 107, 0, 0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="pricing-spinner" style={{ borderTopColor: '#ffffff' }}></div>
                    <span>CREATING ORDER...</span>
                  </>
                ) : isPricingLoading ? (
                  <span>CALCULATING FARE...</span>
                ) : estimate ? (
                  <span>CONFIRM ORDER • ₹{estimate.totalAmount} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 6 }}></i></span>
                ) : (
                  <span>SELECT LOCATIONS TO CONTINUE</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
