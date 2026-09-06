import React from 'react';
import {
  ArrowLeft,
  Download,
  Eye,
  CheckCircle2,
  Package,
  ShieldCheck,
  QrCode,
  FileText
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminRiderDetails({ rider, onBack }) {
  // Default fallback if rider prop not passed
  const currentRider = rider || {
    id: 2,
    name: 'Gorkal sreenu',
    joinedDate: 'Joined on 04 Jan 2026',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    status: 'Approved',
    phone: '08309188159',
    email: 'gorkalsreenu10@gmail.com',
    vehicle: 'Scooter',
    plateNo: 'AP 00 XX 0000',
    orders: 18,
    earnings: '₹1,870.00'
  };

  return (
    <div className="rider-details-view-container">
      {/* Dynamic Top Banner */}
      <div className="dashboard-top-title">3. RIDER DETAILS & DOCUMENTS</div>

      <div className="rider-details-card-wrapper">
        {/* Top Bar with Back Button & Branding */}
        <div className="details-header-bar">
          <div className="brand-small">
            <div className="logo-box small">
              <Package size={18} color="#FFF" strokeWidth={2.8} />
            </div>
            <div className="logo-text">
              <span className="logo-title small">DParcels<span className="logo-dot">.</span></span>
              <span className="logo-subtitle small">ADMIN PANEL</span>
            </div>
          </div>

          <button className="back-to-riders-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Riders</span>
          </button>
        </div>

        {/* Content Layout (Left Profile + Right Documents) */}
        <div className="details-content-grid">
          {/* LEFT PROFILE CARD */}
          <div className="profile-summary-card">
            <div className="profile-header-status">
              <div className="avatar-large-container">
                <img src={currentRider.avatar} alt={currentRider.name} className="profile-large-avatar" />
              </div>
              <span className="status-badge-approved">APPROVED</span>
            </div>

            <h2 className="rider-name-large">{currentRider.name}</h2>
            <p className="joined-date">{currentRider.joinedDate || 'Joined on 04 Jan 2026'}</p>

            <div className="profile-fields-list">
              <div className="field-row">
                <span className="field-label">Phone</span>
                <span className="field-value">{currentRider.phone}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Email</span>
                <span className="field-value">{currentRider.email || 'gorkalsreenu10@gmail.com'}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Vehicle</span>
                <span className="field-value">{currentRider.vehicle}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Plate No.</span>
                <span className="field-value">{currentRider.plateNo || 'AP 00 XX 0000'}</span>
              </div>
              <div className="field-row" style={{ background: 'rgba(255, 138, 0, 0.1)', padding: '6px 8px', borderRadius: '6px', border: '1px dashed #FF8A00' }}>
                <span className="field-label" style={{ color: '#FF8A00' }}>Onboarding UTR</span>
                <span className="field-value" style={{ fontWeight: 'bold' }}>{currentRider.utrNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="stats-two-col">
              <div className="stat-box">
                <span className="stat-box-label">Total Orders</span>
                <span className="stat-box-num">{currentRider.orders}</span>
              </div>
              <div className="stat-box">
                <span className="stat-box-label">Total Earnings</span>
                <span className="stat-box-num orange">{currentRider.earnings}</span>
              </div>
            </div>

            <div className="profile-status-footer">
              <span className="status-label">Status</span>
              <span className="status-val-green">
                <CheckCircle2 size={16} /> Approved
              </span>
            </div>
          </div>

          {/* RIGHT DOCUMENTS SECTION */}
          <div className="documents-section">
            <h2 className="section-heading">Submitted Documents</h2>

            <div className="documents-grid">
              {/* Document 1: Aadhaar Card */}
              <div className="document-card">
                <div className="doc-header">
                  <span className="doc-title">Aadhaar Card</span>
                  <button className="doc-download-btn" title="Download Document">
                    <Download size={16} />
                  </button>
                </div>

                <div className="doc-preview-box aadhaar-preview">
                  <div className="card-mock aadhaar-mock">
                    <div className="gov-header">
                      <div className="gov-emblem"></div>
                      <span className="gov-text">GOVERNMENT OF INDIA</span>
                    </div>
                    <div className="aadhaar-body">
                      <div className="user-photo-box"></div>
                      <div className="aadhaar-lines">
                        <div className="line long"></div>
                        <div className="line med"></div>
                        <div className="line short"></div>
                        <div className="aadhaar-number">XXXX XXXX 8159</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="doc-footer">
                  <div className="doc-verified">
                    <CheckCircle2 size={15} className="green-check" />
                    <span>Approved</span>
                    <span className="verified-date">• Verified on 04 Jan 2026</span>
                  </div>
                  <button className="doc-view-btn" title="View Full Screen">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {/* Document 2: Driving License */}
              <div className="document-card">
                <div className="doc-header">
                  <span className="doc-title">Driving License</span>
                  <button className="doc-download-btn" title="Download Document">
                    <Download size={16} />
                  </button>
                </div>

                <div className="doc-preview-box license-preview">
                  <div className="card-mock license-mock">
                    <div className="license-header">UNION OF INDIA DRIVING LICENSE</div>
                    <div className="license-body">
                      <div className="license-photo"></div>
                      <div className="license-lines">
                        <div className="line long"></div>
                        <div className="line med"></div>
                        <div className="license-no">DL-042026008159</div>
                      </div>
                      <div className="qr-mini"></div>
                    </div>
                  </div>
                </div>

                <div className="doc-footer">
                  <div className="doc-verified">
                    <CheckCircle2 size={15} className="green-check" />
                    <span>Approved</span>
                    <span className="verified-date">• Verified on 04 Jan 2026</span>
                  </div>
                  <button className="doc-view-btn" title="View Full Screen">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {/* Document 3: Vehicle RC */}
              <div className="document-card">
                <div className="doc-header">
                  <span className="doc-title">Vehicle RC</span>
                  <button className="doc-download-btn" title="Download Document">
                    <Download size={16} />
                  </button>
                </div>

                <div className="doc-preview-box rc-preview">
                  <div className="card-mock rc-mock">
                    <div className="rc-header">CERTIFICATE OF REGISTRATION</div>
                    <div className="rc-lines">
                      <div className="line long"></div>
                      <div className="line long"></div>
                      <div className="line med"></div>
                      <div className="line short"></div>
                    </div>
                  </div>
                </div>

                <div className="doc-footer">
                  <div className="doc-verified">
                    <CheckCircle2 size={15} className="green-check" />
                    <span>Approved</span>
                    <span className="verified-date">• Verified on 04 Jan 2026</span>
                  </div>
                  <button className="doc-view-btn" title="View Full Screen">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {/* Document 4: Payment QR */}
              <div className="document-card">
                <div className="doc-header">
                  <span className="doc-title">Payment QR</span>
                  <button className="doc-download-btn" title="Download Document">
                    <Download size={16} />
                  </button>
                </div>

                <div className="doc-preview-box qr-preview">
                  <div className="qr-code-box">
                    <QrCode size={110} color="#FFFFFF" strokeWidth={1.8} />
                  </div>
                </div>

                <div className="doc-footer">
                  <div className="doc-verified">
                    <CheckCircle2 size={15} className="green-check" />
                    <span>Approved</span>
                    <span className="verified-date">• Verified on 04 Jan 2026</span>
                  </div>
                  <button className="doc-view-btn" title="View Full Screen">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
