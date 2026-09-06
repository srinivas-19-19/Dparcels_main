// Validation Utility Functions

export function validatePasswordRequirements(password = '') {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  };
}

export function isPasswordValid(password = '') {
  const reqs = validatePasswordRequirements(password);
  return reqs.minLength && reqs.hasUpper && reqs.hasNumber && reqs.hasSpecial;
}

export function validateEmail(email = '') {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone = '') {
  // Simple clean phone validation allowing spaces, dashes, +, digits (min 7 digits)
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
}
