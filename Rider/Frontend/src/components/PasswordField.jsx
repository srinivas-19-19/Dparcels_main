import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import InputField from './InputField';

const PasswordField = ({
  label = 'PASSWORD',
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••••••',
  error,
  required = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <InputField
      label={label}
      type={showPassword ? 'text' : 'password'}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      required={required}
      leftIcon={Lock}
      rightIcon={showPassword ? EyeOff : Eye}
      onRightIconClick={toggleShowPassword}
      autoComplete="current-password"
    />
  );
};

export default PasswordField;
