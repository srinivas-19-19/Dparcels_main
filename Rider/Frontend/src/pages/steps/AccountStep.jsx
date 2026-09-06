import React from 'react';
import { User, Phone, Mail, ArrowRight } from 'lucide-react';
import InputField from '../../components/InputField';
import PasswordField from '../../components/PasswordField';
import PrimaryButton from '../../components/PrimaryButton';

const AccountStep = ({ formData, setFormData, errors, onNext }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '20px'
      }}>
        Let's start with basics
      </h2>

      {/* Full Legal Name */}
      <InputField
        label="FULL LEGAL NAME"
        name="fullName"
        value={formData.fullName || ''}
        onChange={handleChange}
        placeholder="Full Legal Name"
        leftIcon={User}
        error={errors.fullName}
        required
      />

      {/* Mobile Number */}
      <InputField
        label="MOBILE NUMBER"
        type="tel"
        name="mobile"
        value={formData.mobile || ''}
        onChange={handleChange}
        placeholder="Mobile Number"
        leftIcon={Phone}
        error={errors.mobile}
        required
      />

      {/* Email Address */}
      <InputField
        label="EMAIL ADDRESS"
        type="email"
        name="email"
        value={formData.email || ''}
        onChange={handleChange}
        placeholder="Email Address"
        leftIcon={Mail}
        error={errors.email}
        required
      />

      {/* Create Password */}
      <PasswordField
        label="CREATE PASSWORD"
        name="password"
        value={formData.password || ''}
        onChange={handleChange}
        placeholder="Create Password"
        error={errors.password}
        required
      />

      {/* Confirm Password */}
      <PasswordField
        label="CONFIRM PASSWORD"
        name="confirmPassword"
        value={formData.confirmPassword || ''}
        onChange={handleChange}
        placeholder="Confirm Password"
        error={errors.confirmPassword}
        required
      />

      <div style={{ marginTop: '28px' }}>
        <PrimaryButton onClick={onNext} icon={ArrowRight}>
          Next Step →
        </PrimaryButton>
      </div>
    </div>
  );
};

export default AccountStep;
