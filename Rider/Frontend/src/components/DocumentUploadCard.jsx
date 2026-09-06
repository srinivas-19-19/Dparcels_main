import React, { useRef } from 'react';
import { Camera, CreditCard, FileText, QrCode, Upload, CheckCircle2 } from 'lucide-react';

const DocumentUploadCard = ({
  id,
  title,
  subtitle,
  iconType,
  file,
  onFileSelect,
  error
}) => {
  const fileInputRef = useRef(null);

  const renderIcon = () => {
    const iconProps = { size: 24, color: file ? '#FF8A00' : '#A0A0A0' };
    switch (iconType) {
      case 'camera':
        return <Camera {...iconProps} />;
      case 'id-card':
        return <CreditCard {...iconProps} />;
      case 'license':
        return <CreditCard {...iconProps} />;
      case 'document':
        return <FileText {...iconProps} />;
      case 'qr':
        return <QrCode {...iconProps} />;
      default:
        return <Upload {...iconProps} />;
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      onFileSelect(id, selectedFile);
    }
  };

  return (
    <div style={{
      marginBottom: '14px',
      width: '100%'
    }}>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderRadius: '14px',
          backgroundColor: file ? 'rgba(255, 138, 0, 0.08)' : '#111111',
          border: error 
            ? '1.5px dashed #EF4444' 
            : file 
              ? '1.5px dashed #FF8A00' 
              : '1.5px dashed #2A2A2A',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!file && !error) {
            e.currentTarget.style.borderColor = '#FF8A00';
            e.currentTarget.style.backgroundColor = '#181818';
          }
        }}
        onMouseLeave={(e) => {
          if (!file && !error) {
            e.currentTarget.style.borderColor = '#2A2A2A';
            e.currentTarget.style.backgroundColor = '#111111';
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          style={{ display: 'none' }}
        />

        {/* Left Side: Icon & Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: file ? 'rgba(255, 138, 0, 0.15)' : '#181818',
            border: '1px solid ' + (file ? 'rgba(255, 138, 0, 0.4)' : '#2A2A2A'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {renderIcon()}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#FFFFFF',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {title}
              </h4>
            </div>

            {file ? (
              <p style={{
                fontSize: '12px',
                color: '#FF8A00',
                margin: '2px 0 0 0',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                📄 {file.name}
              </p>
            ) : (
              <p style={{
                fontSize: '12px',
                color: '#A0A0A0',
                margin: '2px 0 0 0'
              }}>
                {subtitle || 'Tap to Upload'}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Status Badge */}
        <div style={{ flexShrink: 0, marginLeft: '12px' }}>
          {file ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <CheckCircle2 size={13} />
              <span>Uploaded</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#181818',
              border: '1px solid #2A2A2A',
              color: '#A0A0A0',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              <Upload size={12} />
              <span>Upload</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <span style={{
          color: '#EF4444',
          fontSize: '12px',
          fontWeight: '500',
          marginTop: '4px',
          display: 'block'
        }}>
          • {error}
        </span>
      )}
    </div>
  );
};

export default DocumentUploadCard;
