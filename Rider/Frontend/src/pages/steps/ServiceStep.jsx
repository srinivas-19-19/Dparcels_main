import React from 'react';
import { MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import InputField from '../../components/InputField';
import VehicleCard from '../../components/VehicleCard';
import PrimaryButton from '../../components/PrimaryButton';

const ServiceStep = ({ formData, setFormData, errors, onNext, onBack }) => {
  const handleCityChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      city: e.target.value
    }));
  };

  const handleVehicleSelect = (vehicleId) => {
    setFormData((prev) => ({
      ...prev,
      vehicle: vehicleId
    }));
  };

  const vehicles = [
    {
      id: 'motorbike',
      label: 'Motorbike',
      description: 'Standard gears or fuel bike (100cc - 250cc)',
      iconType: 'motorbike'
    },
    {
      id: 'scooter',
      label: 'Scooter',
      description: 'Automatic transmission gearless scooter',
      iconType: 'scooter'
    },
    {
      id: 'electric',
      label: 'Electric Vehicle',
      description: 'Zero emission EV bike / e-scooter',
      iconType: 'electric'
    }
  ];

  return (
    <div className="animate-fade-in">
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '20px'
      }}>
        Where will you ride?
      </h2>

      {/* Service City / Area Input */}
      <InputField
        label="SERVICE CITY / AREA"
        name="city"
        value={formData.city || 'Adoni'}
        onChange={handleCityChange}
        placeholder="Adoni"
        leftIcon={MapPin}
        error={errors.city}
        required
      />

      {/* Vehicle Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#94A3B8',
          marginBottom: '12px',
          display: 'block'
        }}>
          SELECT VEHICLE <span style={{ color: '#FFCC00' }}>*</span>
        </label>

        {vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            id={v.id}
            label={v.label}
            description={v.description}
            iconType={v.iconType}
            isSelected={formData.vehicle === v.id}
            onClick={() => handleVehicleSelect(v.id)}
          />
        ))}

        {errors.vehicle && (
          <span style={{
            color: '#EF4444',
            fontSize: '12px',
            fontWeight: '500',
            marginTop: '6px',
            display: 'block'
          }}>
            • {errors.vehicle}
          </span>
        )}
      </div>

      {/* Navigation Buttons: Back and Next */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '12px',
        marginTop: '28px'
      }}>
        <PrimaryButton variant="outline" onClick={onBack} icon={ArrowLeft}>
          Back
        </PrimaryButton>

        <PrimaryButton onClick={onNext} icon={ArrowRight}>
          Next Step →
        </PrimaryButton>
      </div>
    </div>
  );
};

export default ServiceStep;
