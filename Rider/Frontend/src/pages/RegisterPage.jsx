import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Logo from '../components/Logo';
import ProgressStepper from '../components/ProgressStepper';
import AccountStep from './steps/AccountStep';
import ServiceStep from './steps/ServiceStep';
import DocumentStep from './steps/DocumentStep';
import PaymentStep from './steps/PaymentStep';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: 'Adoni',
    vehicle: 'motorbike',
    utrNumber: ''
  });

  // Document Uploads State
  const [documents, setDocuments] = useState({
    profilePhoto: null,
    aadhaarCard: null,
    drivingLicense: null,
    vehicleRC: null,
    paymentQR: null
  });

  // Errors State
  const [errors, setErrors] = useState({});

  // Handle File Selection
  const handleFileSelect = (docId, file) => {
    setDocuments((prev) => ({
      ...prev,
      [docId]: file
    }));
    setErrors((prev) => ({
      ...prev,
      [docId]: null
    }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full legal name is required';
    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errs.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs = {};
    if (!formData.city.trim()) errs.city = 'Service City is required';
    if (!formData.vehicle) errs.vehicle = 'Please select a vehicle type';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errs = {};
    if (!documents.profilePhoto) errs.profilePhoto = 'Profile photo is required';
    if (!documents.aadhaarCard) errs.aadhaarCard = 'Aadhaar card front side is required';
    if (!documents.drivingLicense) errs.drivingLicense = 'Driving license front side is required';
    if (!documents.vehicleRC) errs.vehicleRC = 'Vehicle RC document is required';
    if (!documents.paymentQR) errs.paymentQR = 'Payment UPI QR code is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    const errs = {};
    if (!formData.utrNumber || formData.utrNumber.trim().length < 6) {
      errs.utrNumber = 'Please enter a valid UTR number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handlers for Navigation
  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setErrors({});
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setErrors({});
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextToStep4 = () => {
    if (validateStep3()) {
      setErrors({});
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep4()) return;

    setIsLoading(true);

    try {
      // Create a simplified payload for the backend MVP
      const payload = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password,
        city: formData.city,
        vehicle: formData.vehicle,
        utrNumber: formData.utrNumber
        // we'll send a base64 encoded dummy string for files since we don't have S3 set up right now
      };

      const response = await api.post('/auth/register/rider', payload);
      
      const { user, accessToken } = response.data.data;
      login(user, accessToken);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF8A00', '#FFFFFF', '#10B981']
        });
      } catch (e) {
        // fallback
      }

      setTimeout(() => {
        setIsLoading(false);
        navigate('/application-status', {
          state: {
            riderName: formData.fullName || 'Partner',
            city: formData.city,
            vehicle: formData.vehicle
          }
        });
      }, 1500);

    } catch (error) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Logo */}
      <Logo size="normal" showSubtitle={true} />

      {/* Main Registration Card */}
      <div className="auth-card auth-card-wide">
        {/* Banner Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '800',
            color: '#FFFFFF',
            lineHeight: '1.25',
            margin: '0 0 8px 0'
          }}>
            Turn your miles into <span style={{ color: '#FF8A00' }}>Money.</span>
          </h1>

          <p style={{
            fontSize: '13px',
            color: '#A0A0A0',
            lineHeight: '1.5',
            margin: '0 0 12px 0',
            maxWidth: '460px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Join 15,000+ partners delivering happiness across the city. Flexible hours, instant payouts, and full insurance cover.
          </p>

          <p style={{ fontSize: '13px', color: '#A0A0A0', margin: 0 }}>
            Already a partner?{' '}
            <Link
              to="/login"
              style={{
                color: '#FF8A00',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Login here
            </Link>
          </p>
        </div>

        {/* 3-Step Progress Stepper */}
        <ProgressStepper currentStep={currentStep} />

        {/* Step Forms */}
        {currentStep === 1 && (
          <AccountStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onNext={handleNextToStep2}
          />
        )}

        {currentStep === 2 && (
          <ServiceStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onNext={handleNextToStep3}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <DocumentStep
            documents={documents}
            onFileSelect={handleFileSelect}
            errors={errors}
            onNext={handleNextToStep4}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <PaymentStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Mobile Footer */}
      <div style={{
        marginTop: '24px',
        fontSize: '11px',
        color: '#A0A0A0',
        fontWeight: '600',
        letterSpacing: '0.08em',
        textAlign: 'center'
      }}>
        DPARCELS FLEET PARTNER SYSTEM • 2026
      </div>
    </div>
  );
};

export default RegisterPage;
