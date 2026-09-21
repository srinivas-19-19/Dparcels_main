import React, { useState, useEffect, useRef } from 'react';
import addressService from '../utils/addressService';
import mapService from '../utils/mapService';

export const SavedAddressesModal = ({ isOpen, onClose, onAddressSelect }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [state, setState] = useState('Telangana');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [lat, setLat] = useState(17.4156);
  const [lng, setLng] = useState(78.4357);
  const [isDefault, setIsDefault] = useState(false);

  // Autocomplete Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Feedback State
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setView('list');
      resetForm();
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.warn('[SavedAddresses] Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setLabel('Home');
    setCustomLabel('');
    setStreetAddress('');
    setCity('Hyderabad');
    setState('Telangana');
    setPostalCode('');
    setCountry('India');
    setLat(17.4156);
    setLng(78.4357);
    setIsDefault(false);
    setSearchQuery('');
    setSuggestions([]);
    setFormError('');
  };

  const handleOpenAddForm = () => {
    resetForm();
    setView('form');
  };

  const handleOpenEditForm = (addr) => {
    setEditingId(addr.id);
    if (['Home', 'Work'].includes(addr.label)) {
      setLabel(addr.label);
      setCustomLabel('');
    } else {
      setLabel('Other');
      setCustomLabel(addr.label);
    }
    setStreetAddress(addr.streetAddress || '');
    setCity(addr.city || 'Hyderabad');
    setState(addr.state || 'Telangana');
    setPostalCode(addr.postalCode || '');
    setCountry(addr.country || 'India');
    setLat(addr.latitude || 17.4156);
    setLng(addr.longitude || 78.4357);
    setIsDefault(addr.isDefault || false);
    setSearchQuery(addr.streetAddress || '');
    setFormError('');
    setView('form');
  };

  // Autocomplete Search Debounce
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setStreetAddress(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await mapService.autocomplete(query);
        setSuggestions(results || []);
      } catch (e) {
        console.warn('[AddressAutocomplete] Error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = async (item) => {
    setSearchQuery(item.mainText || item.description);
    setStreetAddress(item.mainText || item.description);
    setSuggestions([]);

    try {
      const details = await mapService.getPlaceDetails(item.placeId);
      if (details) {
        setStreetAddress(details.streetAddress || item.mainText);
        setCity(details.city || 'Hyderabad');
        setState(details.state || 'Telangana');
        setPostalCode(details.postalCode || '');
        setCountry(details.country || 'India');
        setLat(details.lat || 17.4156);
        setLng(details.lng || 78.4357);
      }
    } catch (e) {
      console.warn('[PlaceDetails] Error:', e);
    }
  };

  // GPS Current Location Detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = parseFloat(pos.coords.latitude.toFixed(6));
        const userLng = parseFloat(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);

        try {
          const rev = await mapService.reverseGeocode(userLat, userLng);
          if (rev) {
            setStreetAddress(rev.streetAddress || rev.address);
            setSearchQuery(rev.streetAddress || rev.address);
            setCity(rev.city || 'Hyderabad');
            setState(rev.state || 'Telangana');
            setPostalCode(rev.postalCode || '');
            setCountry(rev.country || 'India');
          }
        } catch (e) {
          console.warn('[ReverseGeocode] Notice:', e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('[Geolocation Error]:', err.message);
        setIsLocating(false);
        alert('Could not retrieve current location.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Form Submit (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    const finalLabel = label === 'Other' ? (customLabel.trim() || 'Other') : label;

    if (!streetAddress.trim()) {
      setFormError('Street address is required.');
      return;
    }
    if (!city.trim()) {
      setFormError('City is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        label: finalLabel,
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state: state.trim() || 'Telangana',
        postalCode: postalCode.trim() || '500001',
        country: country.trim() || 'India',
        latitude: lat,
        longitude: lng,
        isDefault,
      };

      if (editingId) {
        await addressService.updateAddress(editingId, payload);
      } else {
        await addressService.createAddress(payload);
      }

      await loadAddresses();
      setView('list');
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save address.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      await loadAddresses();
    } catch (err) {
      console.warn('[SetDefault] Error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressService.deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      console.warn('[DeleteAddress] Error:', err);
    }
  };

  if (!isOpen) return null;

  const getLabelIcon = (lbl) => {
    const l = (lbl || '').toLowerCase();
    if (l === 'home') return 'fa-solid fa-house';
    if (l === 'work' || l === 'office') return 'fa-solid fa-briefcase';
    return 'fa-solid fa-location-dot';
  };

  return (
    <div className="modal-overlay side-drawer-overlay active" style={{ zIndex: 9999 }}>
      <div className="side-drawer-content" style={{ maxWidth: 440, display: 'flex', flexDirection: 'column' }}>
        {/* Drawer Header */}
        <div className="side-drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-service-header">
            SAVED <span style={{ color: 'var(--primary-orange-light)' }}>ADDRESSES</span>
          </h2>
          <i
            className="fa-solid fa-xmark"
            style={{ cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}
            onClick={onClose}
          ></i>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
          {view === 'list' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {addresses.length} {addresses.length === 1 ? 'ADDRESS' : 'ADDRESSES'} SAVED
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12, width: 'auto', margin: 0, gap: 6 }}
                  onClick={handleOpenAddForm}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>ADD NEW</span>
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 8 }}></i>
                  <p style={{ fontSize: 13 }}>Loading saved addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    border: '1px dashed var(--border-color, rgba(255,255,255,0.1))',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(255, 107, 0, 0.12)',
                      color: 'var(--primary-orange-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      margin: '0 auto 12px',
                    }}
                  >
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No saved addresses yet</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Save Home, Work, or favorite pickup points for 1-click delivery bookings.
                  </p>
                  <button type="button" className="btn-primary" onClick={handleOpenAddForm}>
                    <i className="fa-solid fa-plus"></i> <span>Add Your First Address</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="settings-card"
                      style={{
                        margin: 0,
                        padding: '14px',
                        border: addr.isDefault
                          ? '1px solid rgba(255, 107, 0, 0.4)'
                          : '1px solid var(--border-color, rgba(255,255,255,0.12))',
                        background: addr.isDefault ? 'rgba(255, 107, 0, 0.08)' : 'var(--input-bg, #121d2f)',
                        cursor: onAddressSelect ? 'pointer' : 'default',
                      }}
                      onClick={() => onAddressSelect && onAddressSelect(addr)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            className="settings-icon-badge"
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: 14,
                              background: addr.isDefault
                                ? 'rgba(255, 107, 0, 0.2)'
                                : 'var(--border-color, rgba(255,255,255,0.1))',
                              color: addr.isDefault ? 'var(--primary-orange-light)' : 'var(--text-main, #fff)',
                            }}
                          >
                            <i className={getLabelIcon(addr.label)}></i>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main, #f8fafc)' }}>
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: 'var(--primary-orange-light)',
                                  background: 'rgba(255, 107, 0, 0.15)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  marginLeft: 6,
                                }}
                              >
                                DEFAULT
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {!addr.isDefault && (
                            <button
                              type="button"
                              title="Set as Default"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted, #cbd5e1)',
                                cursor: 'pointer',
                                padding: 4,
                                fontSize: 13,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(addr.id);
                              }}
                            >
                              <i className="fa-regular fa-star"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            title="Edit Address"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted, #cbd5e1)',
                              cursor: 'pointer',
                              padding: 4,
                              fontSize: 13,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditForm(addr);
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            title="Delete Address"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 4,
                              fontSize: 13,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(addr.id);
                            }}
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: 13, color: 'var(--text-main, #f8fafc)', margin: '4px 0 2px 0', lineHeight: 1.4, fontWeight: 600 }}>
                        {addr.streetAddress}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted, #cbd5e1)', fontWeight: 500 }}>
                        {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Address Form View (Add / Edit) */
            <form onSubmit={handleSubmitForm}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}
                  onClick={() => setView('list')}
                >
                  &larr; BACK TO LIST
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-orange-light)' }}>
                  {editingId ? 'EDIT ADDRESS' : 'NEW ADDRESS'}
                </span>
              </div>

              {formError && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: 12,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                  {formError}
                </div>
              )}

              {/* Label Selection Chips */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">ADDRESS LABEL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: label === lbl
                          ? '1px solid var(--primary-orange-light)'
                          : '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        background: label === lbl ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255,255,255,0.04)',
                        color: label === lbl ? 'var(--primary-orange-light)' : '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                      onClick={() => setLabel(lbl)}
                    >
                      <i className={getLabelIcon(lbl)}></i>
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {label === 'Other' && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">CUSTOM LABEL NAME</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-tag"></i>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Gym, Parents Home, Studio"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Autocomplete / Street Search */}
              <div className="form-group" style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">STREET / LOCALITY (GOOGLE MAPS)</label>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-orange-light)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                  >
                    <i className={isLocating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-crosshairs'}></i>
                    <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
                  </button>
                </div>
                <div className="input-wrapper">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Search address (e.g. Banjara Hills Road 12)"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    required
                  />
                  {isSearching && (
                    <i className="fa-solid fa-spinner fa-spin" style={{ position: 'absolute', right: 12, color: 'var(--text-muted)' }}></i>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(15, 23, 42, 0.98)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                      borderRadius: 8,
                      zIndex: 100,
                      marginTop: 4,
                      maxHeight: 200,
                      overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  >
                    {suggestions.map((item) => (
                      <div
                        key={item.placeId}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary-orange-light)', fontSize: 13 }}></i>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{item.mainText}</p>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.secondaryText}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* City & State Row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">CITY</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-city"></i>
                    <input
                      type="text"
                      className="input-control"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">STATE</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-map"></i>
                    <input
                      type="text"
                      className="input-control"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Postal Code & Country */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">PIN / POSTAL CODE</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-envelope-open-text"></i>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. 500034"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="form-label">COUNTRY</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-globe"></i>
                    <input
                      type="text"
                      className="input-control"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Default Address Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  id="is-default-addr"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary-orange-light)', cursor: 'pointer' }}
                />
                <label htmlFor="is-default-addr" style={{ fontSize: 13, cursor: 'pointer', color: '#e2e8f0' }}>
                  Set as default address for deliveries
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setView('list')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>{editingId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedAddressesModal;
