import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import DocumentUploadCard from '../../components/DocumentUploadCard';
import PrimaryButton from '../../components/PrimaryButton';

const DocumentStep = ({
  documents,
  onFileSelect,
  errors,
  onSubmit,
  onBack,
  isLoading
}) => {
  const docConfigs = [
    {
      id: 'profilePhoto',
      title: 'Profile Photo',
      subtitle: 'Tap to Upload (Clear face photo)',
      iconType: 'camera'
    },
    {
      id: 'aadhaarCard',
      title: 'Aadhaar Card',
      subtitle: 'Front Side (Govt Issued ID)',
      iconType: 'id-card'
    },
    {
      id: 'drivingLicense',
      title: 'Driving License',
      subtitle: 'Front Side (Valid DL)',
      iconType: 'license'
    },
    {
      id: 'vehicleRC',
      title: 'Vehicle RC',
      subtitle: 'RC Card (Registration Doc)',
      iconType: 'document'
    },
    {
      id: 'paymentQR',
      title: 'Payment QR',
      subtitle: 'UPI QR (For instant daily payouts)',
      iconType: 'qr'
    }
  ];

  return (
    <div className="animate-fade-in">
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '6px'
      }}>
        Verification Documents
      </h2>
      <p style={{
        fontSize: '13px',
        color: '#94A3B8',
        marginBottom: '20px'
      }}>
        Please upload clear copies of all required documents to get instant approval.
      </p>

      {/* Upload Cards Grid */}
      <div style={{ marginBottom: '20px' }}>
        {docConfigs.map((doc) => (
          <DocumentUploadCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            subtitle={doc.subtitle}
            iconType={doc.iconType}
            file={documents[doc.id]}
            onFileSelect={onFileSelect}
            error={errors[doc.id]}
          />
        ))}
      </div>

      {/* Navigation & Submit Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '12px',
        marginTop: '24px'
      }}>
        <PrimaryButton variant="outline" onClick={onBack} icon={ArrowLeft} disabled={isLoading}>
          Back
        </PrimaryButton>

        <PrimaryButton onClick={onSubmit} isLoading={isLoading} icon={CheckCircle2}>
          Submit Application
        </PrimaryButton>
      </div>
    </div>
  );
};

export default DocumentStep;
