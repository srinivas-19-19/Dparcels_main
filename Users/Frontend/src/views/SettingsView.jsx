import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import customerService from '../utils/customerService';
import addressService from '../utils/addressService';
import { SavedAddressesModal } from '../components/SavedAddressesModal';

export const SettingsView = ({ onOpenLanguage }) => {
  const { t, currentLang, translations } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();

  const fileInputRef = useRef(null);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Status & Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Avatar States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Saved Addresses State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    setIsLoadingAddresses(true);
    try {
      const addrs = await addressService.getAddresses();
      setSavedAddresses(addrs || []);
    } catch (err) {
      console.warn('[SettingsView] Error fetching addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  // Initialize form from authenticated user profile
  useEffect(() => {
    if (user) {
      const profile = user.customerProfile;
      const computedName = profile
        ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
        : '';
      setFullName(computedName);
      setPhone(profile?.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Handle Personal Details Form Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setSaveError('Full Name is required.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^\+?[0-9\s-]{10,15}$/.test(trimmedPhone)) {
      setSaveError('Please enter a valid phone number (10-15 digits).');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await customerService.updateProfile({
        name: trimmedName,
        phone: trimmedPhone || null,
      });

      updateUser(updated);
      setSaveSuccess('Profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Avatar Selection & Supabase Upload
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, or WebP images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Avatar image must be under 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updated = await customerService.uploadAvatar(file);
      updateUser(updated);
      setSaveSuccess('Avatar updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload avatar to Supabase.';
      setAvatarError(msg);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Avatar Removal
  const handleAvatarDelete = async () => {
    if (!user?.customerProfile?.profileImage) return;

    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      const updated = await customerService.deleteAvatar();
      updateUser(updated);
      setSaveSuccess('Avatar removed successfully.');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove avatar.';
      setAvatarError(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const currentAvatarUrl = user?.customerProfile?.profileImage;
  const userInitials = (fullName || 'Customer')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentLangName = translations[currentLang]?.name || 'English';

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          className="settings-icon-badge"
          style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary-orange-light)' }}
        >
          <i className="fa-solid fa-motorcycle"></i>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>
          {t('settings_pref')}
        </span>
      </div>

      <h1 className="greeting-title" dangerouslySetInnerHTML={{ __html: t('account_settings') }}></h1>
      <p className="subtitle">{t('settings_sub')}</p>

      <div style={{ marginTop: 16 }}>
        {/* Language Preference Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div
              className="settings-icon-badge"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
            >
              <i className="fa-solid fa-language"></i>
            </div>
            <div>
              <h3 className="settings-card-title">
                {t('app_language')} ({currentLangName})
              </h3>
              <p className="settings-card-sub">{t('app_language_sub')}</p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={onOpenLanguage}>
            <i className="fa-solid fa-globe"></i> <span>{t('change_language_btn')}</span>
          </button>
        </div>

        {/* Appearance Box */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <i className="fa-solid fa-palette"></i>
            </div>
            <div>
              <h3 className="settings-card-title">
                {t('theme_mode')} ({theme.toUpperCase()})
              </h3>
              <p className="settings-card-sub">{t('theme_sub')}</p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={toggleTheme}>
            <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
            <span>{t('toggle_theme')}</span>
          </button>
        </div>

        {/* Personal Details Box */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <div>
              <h3 className="settings-card-title">{t('personal_details')}</h3>
              <p className="settings-card-sub">{t('personal_sub')}</p>
            </div>
          </div>

          {/* Avatar / Profile Picture Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 0 16px 0',
              borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--primary-orange-dark, #ff6b00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 22,
                fontWeight: 800,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                flexShrink: 0,
              }}
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Profile Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <span>{userInitials}</span>
              )}

              {isUploadingAvatar && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 18, color: '#fff' }}></i>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarSelect}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <i className="fa-solid fa-camera"></i>
                  <span>{currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}</span>
                </button>

                {currentAvatarUrl && (
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                    onClick={handleAvatarDelete}
                    disabled={isUploadingAvatar}
                  >
                    <i className="fa-regular fa-trash-can" style={{ marginRight: 4 }}></i>
                    Remove
                  </button>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Supports JPG, PNG, WebP up to 5MB (Supabase Storage)
              </span>
            </div>
          </div>

          {avatarError && (
            <div
              style={{
                color: '#ef4444',
                fontSize: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '8px 12px',
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
              {avatarError}
            </div>
          )}

          {saveSuccess && (
            <div
              style={{
                color: '#10b981',
                fontSize: 13,
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div
              style={{
                color: '#ef4444',
                fontSize: 13,
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">{t('full_name')}</label>
              <div className="input-wrapper">
                <i className="fa-regular fa-user"></i>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Enter Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('phone_number')}</label>
              <div className="input-wrapper">
                <i className="fa-solid fa-phone"></i>
                <input
                  type="tel"
                  className="input-control"
                  placeholder="+91 XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('email_address')}{' '}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                  (Read-only)
                </span>
              </label>
              <div className="input-wrapper" style={{ opacity: 0.75 }}>
                <i className="fa-regular fa-envelope"></i>
                <input
                  type="email"
                  className="input-control"
                  placeholder="name@example.com"
                  value={email}
                  readOnly
                  disabled
                  style={{ cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: 10 }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{t('save_changes')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Saved Addresses Box */}
        <div className="settings-card">
          <div className="settings-card-header" style={{ marginBottom: savedAddresses.length > 0 ? 14 : 0 }}>
            <div
              className="settings-icon-badge"
              style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}
            >
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="settings-card-title" style={{ margin: 0 }}>{t('saved_addresses')}</h3>
                {savedAddresses.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {savedAddresses.length} {savedAddresses.length === 1 ? 'saved' : 'saved'}
                  </span>
                )}
              </div>
              <p className="settings-card-sub">{t('addresses_sub')}</p>
            </div>
            <button
              type="button"
              className="icon-btn"
              title="Add New Address"
              onClick={() => setIsAddressModalOpen(true)}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>

          {/* Address Preview / Quick Summary */}
          {savedAddresses.length > 0 ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                marginBottom: 14,
              }}
            >
              {(() => {
                const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <i
                          className={
                            defaultAddr.label === 'Home'
                              ? 'fa-solid fa-house'
                              : defaultAddr.label === 'Work'
                              ? 'fa-solid fa-briefcase'
                              : 'fa-solid fa-location-dot'
                          }
                        ></i>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-color, #fff)' }}>
                            {defaultAddr.label}
                          </span>
                          {defaultAddr.isDefault && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.15)',
                                padding: '1px 6px',
                                borderRadius: 10,
                              }}
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {defaultAddr.streetAddress}, {defaultAddr.city} {defaultAddr.postalCode ? `- ${defaultAddr.postalCode}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: '10px 0 14px 0',
                lineHeight: 1.4,
              }}
            >
              No saved addresses yet. Save Home, Work, or favorite spots for fast 1-click orders.
            </p>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => setIsAddressModalOpen(true)}
          >
            <i className="fa-solid fa-map-location-dot"></i>
            <span>{savedAddresses.length > 0 ? 'Manage Saved Addresses' : 'Add First Address'}</span>
          </button>
        </div>
      </div>

      {/* Saved Addresses Modal */}
      <SavedAddressesModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          fetchAddresses();
        }}
      />
    </div>
  );
};
