import React from 'react';

const PaymentStep = ({ formData, setFormData, errors, onSubmit, onBack, isLoading }) => {
  return (
    <div className="step-container slide-in">
      <h3 className="step-title">Onboarding Fee</h3>
      <p className="step-subtitle">Please pay the one-time onboarding fee of ₹500 via UPI and enter the UTR number below.</p>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        {/* Placeholder for Admin QR Code MVP */}
        <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=admin@okicici&pn=DParcels&am=500.00&cu=INR" alt="UPI QR Code" />
        </div>
        <p style={{ marginTop: '12px', color: '#FF8A00', fontWeight: 'bold' }}>UPI ID: admin@okicici</p>
      </div>

      <div className="form-group">
        <label>Transaction ID (UTR Number)</label>
        <input
          type="text"
          placeholder="e.g. 123456789012"
          className={`form-input ${errors.utrNumber ? 'input-error' : ''}`}
          value={formData.utrNumber || ''}
          onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
        />
        {errors.utrNumber && <p className="error-text">{errors.utrNumber}</p>}
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;
