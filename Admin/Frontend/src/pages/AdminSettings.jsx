import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Settings,
  Globe,
  Truck,
  DollarSign,
  Shield,
  Bell,
  Save,
  CheckCircle,
  Mail,
  Phone,
  Lock,
  Zap,
  RefreshCw,
  Sliders,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('General');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Initial form state with empty strings so placeholders are visible!
  const [settingsForm, setSettingsForm] = useState({
    // General
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    currency: '',

    // Delivery & Pricing
    baseFee: '',
    perKmFee: '',
    minOrderValue: '',
    surgeEnabled: true,
    surgeMultiplier: '',

    // Rider Payouts
    riderCommission: '',
    minPayoutThreshold: '',
    autoPayoutSchedule: 'Weekly (Mondays)',
    autoApproveRiders: false,

    // Security & Alerts
    twoFactorAuth: false,
    sessionTimeout: '60 mins',
    smsNotifications: true,
    emailAlerts: true
  });

  // Banners State
  const [banners, setBanners] = useState([]);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');

  useEffect(() => {
    if (activeTab === 'Banners') {
      fetchBanners();
    }
  }, [activeTab]);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners');
      setBanners(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerUrl) return;
    try {
      await api.post('/admin/banners', { imageUrl: newBannerUrl, linkUrl: newBannerLink });
      setNewBannerUrl('');
      setNewBannerLink('');
      fetchBanners();
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (err) {
      console.error('Failed to add banner:', err);
    }
  };

  const handleDeleteBanner = async (id) => {
    try {
      await api.delete(`/admin/banners/${id}`);
      fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  const handleToggle = (key) => {
    setSettingsForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 3000);
  };

  return (
    <div className="settings-view-container advanced">
      {/* Header Bar */}
      <div className="settings-header-row">
        <div>
          <div className="settings-title-badge">
            <Sliders size={14} color="#FF9F00" />
            <span>PLATFORM CONFIGURATION</span>
          </div>
          <h1 className="header-greeting">System Settings</h1>
          <p className="header-subtext">Manage delivery pricing, rider commission rates, platform features, and security controls.</p>
        </div>

        <div className="settings-header-right">
          {showSaveToast && (
            <div className="save-toast-banner glow">
              <CheckCircle size={18} color="#22C55E" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          <button className="add-rider-btn glow-btn" onClick={handleSave}>
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Settings + Right Quick Actions Panel */}
      <div className="settings-main-layout">
        <div className="settings-content-column">
          {/* Advanced Tab Bar */}
          <div className="settings-tabs-row glass-tabs">
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'General' ? 'active' : ''}`}
              onClick={() => setActiveTab('General')}
            >
              <Globe size={16} />
              <span>General</span>
              {activeTab === 'General' && <span className="active-glow-pill"></span>}
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'Delivery' ? 'active' : ''}`}
              onClick={() => setActiveTab('Delivery')}
            >
              <Truck size={16} />
              <span>Delivery & Pricing</span>
              {activeTab === 'Delivery' && <span className="active-glow-pill"></span>}
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'Riders' ? 'active' : ''}`}
              onClick={() => setActiveTab('Riders')}
            >
              <DollarSign size={16} />
              <span>Rider Payouts</span>
              {activeTab === 'Riders' && <span className="active-glow-pill"></span>}
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'Security' ? 'active' : ''}`}
              onClick={() => setActiveTab('Security')}
            >
              <Shield size={16} />
              <span>Security & Alerts</span>
              {activeTab === 'Security' && <span className="active-glow-pill"></span>}
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === 'Banners' ? 'active' : ''}`}
              onClick={() => setActiveTab('Banners')}
            >
              <ImageIcon size={16} />
              <span>Banners</span>
              {activeTab === 'Banners' && <span className="active-glow-pill"></span>}
            </button>
          </div>

          {/* SETTINGS CARD FORM */}
          <form onSubmit={handleSave} className="settings-card-form advanced-glass">
            {/* GENERAL TAB */}
            {activeTab === 'General' && (
              <div className="settings-section">
                <div className="section-title-with-icon">
                  <Globe size={20} color="#FF9F00" />
                  <h2 className="section-heading">Platform General Setup</h2>
                </div>

                <div className="settings-grid-two">
                  <div className="form-group advanced-input-group">
                    <label>Platform Brand Name</label>
                    <input
                      type="text"
                      name="platformName"
                      placeholder="e.g. DParcels Express Logistics"
                      value={settingsForm.platformName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Default Currency Symbol</label>
                    <input
                      type="text"
                      name="currency"
                      placeholder="e.g. ₹ (INR)"
                      value={settingsForm.currency}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Support Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={16} color="#8A9285" />
                      <input
                        type="email"
                        name="supportEmail"
                        placeholder="e.g. support@dparcels.com"
                        value={settingsForm.supportEmail}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Support Helpline Number</label>
                    <div className="input-with-icon">
                      <Phone size={16} color="#8A9285" />
                      <input
                        type="text"
                        name="supportPhone"
                        placeholder="e.g. +91 9671234567"
                        value={settingsForm.supportPhone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DELIVERY & PRICING TAB */}
            {activeTab === 'Delivery' && (
              <div className="settings-section">
                <div className="section-title-with-icon">
                  <Truck size={20} color="#FF9F00" />
                  <h2 className="section-heading">Delivery Rates & Surge Configuration</h2>
                </div>

                <div className="settings-grid-two">
                  <div className="form-group advanced-input-group">
                    <label>Base Delivery Fee (₹)</label>
                    <input
                      type="number"
                      name="baseFee"
                      placeholder="e.g. 30.00"
                      value={settingsForm.baseFee}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Per Kilometer Rate (₹ / KM)</label>
                    <input
                      type="number"
                      name="perKmFee"
                      placeholder="e.g. 12.00"
                      value={settingsForm.perKmFee}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Minimum Order Value (₹)</label>
                    <input
                      type="number"
                      name="minOrderValue"
                      placeholder="e.g. 50.00"
                      value={settingsForm.minOrderValue}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Rain & Demand Surge Multiplier</label>
                    <input
                      type="text"
                      name="surgeMultiplier"
                      placeholder="e.g. 1.5x"
                      value={settingsForm.surgeMultiplier}
                      onChange={handleChange}
                      disabled={!settingsForm.surgeEnabled}
                    />
                  </div>
                </div>

                <div className="setting-toggle-row advanced">
                  <div>
                    <span className="toggle-title">Enable Dynamic Surge Pricing</span>
                    <span className="toggle-desc">Automatically apply surge rates during heavy rain or peak hour demand.</span>
                  </div>
                  <button
                    type="button"
                    className={`advanced-switch-btn ${settingsForm.surgeEnabled ? 'on' : 'off'}`}
                    onClick={() => handleToggle('surgeEnabled')}
                  >
                    <span className="switch-glow"></span>
                    <span className="switch-handle"></span>
                  </button>
                </div>
              </div>
            )}

            {/* RIDER PAYOUTS TAB */}
            {activeTab === 'Riders' && (
              <div className="settings-section">
                <div className="section-title-with-icon">
                  <DollarSign size={20} color="#FF9F00" />
                  <h2 className="section-heading">Rider Earnings & Payout Rules</h2>
                </div>

                <div className="settings-grid-two">
                  <div className="form-group advanced-input-group">
                    <label>Rider Share Percentage (%)</label>
                    <input
                      type="number"
                      name="riderCommission"
                      placeholder="e.g. 80"
                      value={settingsForm.riderCommission}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Minimum Payout Threshold (₹)</label>
                    <input
                      type="number"
                      name="minPayoutThreshold"
                      placeholder="e.g. 500.00"
                      value={settingsForm.minPayoutThreshold}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group advanced-input-group">
                    <label>Automatic Payout Cycle</label>
                    <select
                      name="autoPayoutSchedule"
                      value={settingsForm.autoPayoutSchedule}
                      onChange={handleChange}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly (Mondays)">Weekly (Mondays)</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Manual Only">Manual Approval Only</option>
                    </select>
                  </div>
                </div>

                <div className="setting-toggle-row advanced">
                  <div>
                    <span className="toggle-title">Auto-Approve Rider Registration</span>
                    <span className="toggle-desc">Automatically approve riders upon document upload without manual verification.</span>
                  </div>
                  <button
                    type="button"
                    className={`advanced-switch-btn ${settingsForm.autoApproveRiders ? 'on' : 'off'}`}
                    onClick={() => handleToggle('autoApproveRiders')}
                  >
                    <span className="switch-glow"></span>
                    <span className="switch-handle"></span>
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY & ALERTS TAB */}
            {activeTab === 'Security' && (
              <div className="settings-section">
                <div className="section-title-with-icon">
                  <Shield size={20} color="#FF9F00" />
                  <h2 className="section-heading">Security & Notification Preferences</h2>
                </div>

                <div className="settings-grid-two">
                  <div className="form-group advanced-input-group">
                    <label>Admin Session Timeout</label>
                    <select
                      name="sessionTimeout"
                      value={settingsForm.sessionTimeout}
                      onChange={handleChange}
                    >
                      <option value="15 mins">15 minutes</option>
                      <option value="30 mins">30 minutes</option>
                      <option value="60 mins">60 minutes</option>
                      <option value="Never">Never Timeout</option>
                    </select>
                  </div>
                </div>

                <div className="setting-toggle-row advanced">
                  <div>
                    <span className="toggle-title">Two-Factor Authentication (2FA)</span>
                    <span className="toggle-desc">Require OTP verification when logging into the admin panel.</span>
                  </div>
                  <button
                    type="button"
                    className={`advanced-switch-btn ${settingsForm.twoFactorAuth ? 'on' : 'off'}`}
                    onClick={() => handleToggle('twoFactorAuth')}
                  >
                    <span className="switch-glow"></span>
                    <span className="switch-handle"></span>
                  </button>
                </div>

                <div className="setting-toggle-row advanced">
                  <div>
                    <span className="toggle-title">Send SMS Alerts to Riders & Customers</span>
                    <span className="toggle-desc">Send automated order status updates via SMS gateway.</span>
                  </div>
                  <button
                    type="button"
                    className={`advanced-switch-btn ${settingsForm.smsNotifications ? 'on' : 'off'}`}
                    onClick={() => handleToggle('smsNotifications')}
                  >
                    <span className="switch-glow"></span>
                    <span className="switch-handle"></span>
                  </button>
                </div>

                <div className="setting-toggle-row advanced">
                  <div>
                    <span className="toggle-title">Daily Email Summary Digest</span>
                    <span className="toggle-desc">Receive automated daily revenue breakdown via email.</span>
                  </div>
                  <button
                    type="button"
                    className={`advanced-switch-btn ${settingsForm.emailAlerts ? 'on' : 'off'}`}
                    onClick={() => handleToggle('emailAlerts')}
                  >
                    <span className="switch-glow"></span>
                    <span className="switch-handle"></span>
                  </button>
                </div>
              </div>
            )}

            {/* BANNERS TAB */}
            {activeTab === 'Banners' && (
              <div className="settings-section">
                <div className="section-title-with-icon">
                  <ImageIcon size={20} color="#FF9F00" />
                  <h2 className="section-heading">Manage App Banners</h2>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Image URL" 
                    value={newBannerUrl} 
                    onChange={e => setNewBannerUrl(e.target.value)} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2F332A', background: '#12140E', color: 'white' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Target Link (Optional)" 
                    value={newBannerLink} 
                    onChange={e => setNewBannerLink(e.target.value)} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2F332A', background: '#12140E', color: 'white' }}
                  />
                  <button type="button" onClick={handleAddBanner} className="add-rider-btn glow-btn" style={{ padding: '0 20px' }}>Add Banner</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {banners.map(banner => (
                    <div key={banner.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2F332A' }}>
                      <img src={banner.imageUrl} alt="Banner" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      <button 
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* RIGHT QUICK ACTIONS & SYSTEM STATUS SIDEBAR */}
        <div className="settings-side-panel">
          <div className="system-status-card">
            <div className="status-header-row">
              <Zap size={18} color="#FF9F00" />
              <span>SYSTEM STATUS</span>
            </div>
            <div className="status-metric-row">
              <span className="metric-name">Server Health</span>
              <span className="status-val-green">● 99.9% Operational</span>
            </div>
            <div className="status-metric-row">
              <span className="metric-name">Database Sync</span>
              <span className="status-val-green">● Up to date</span>
            </div>
            <div className="status-metric-row">
              <span className="metric-name">API Latency</span>
              <span className="metric-val-orange">42 ms</span>
            </div>
          </div>

          <div className="maintenance-card">
            <div className="maint-title-row">
              <AlertCircle size={18} color={maintenanceMode ? '#EF4444' : '#8A9285'} />
              <span>Maintenance Mode</span>
            </div>
            <p className="maint-desc">Temporarily pause new order bookings for platform updates.</p>

            <div className="setting-toggle-row mini">
              <span className="toggle-title-sm">{maintenanceMode ? 'Active (Orders Paused)' : 'Inactive (Live)'}</span>
              <button
                type="button"
                className={`advanced-switch-btn danger ${maintenanceMode ? 'on' : 'off'}`}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                <span className="switch-handle"></span>
              </button>
            </div>
          </div>

          <div className="quick-tools-card">
            <div className="status-header-row">
              <FileText size={18} color="#9CA3AF" />
              <span>QUICK TOOLS</span>
            </div>
            <button className="quick-tool-btn" type="button">
              <RefreshCw size={14} /> Clear System Cache
            </button>
            <button className="quick-tool-btn" type="button">
              <FileText size={14} /> Export Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
