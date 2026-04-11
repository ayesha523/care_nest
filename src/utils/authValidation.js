export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

export const getPasswordError = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return "";
};

export const validateLoginForm = ({ email, password }) => {
  const trimmedEmail = email.trim();

  if (!isValidEmail(trimmedEmail)) {
    return "Please enter a valid email address.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }

  return "";
};

export const validateSignupForm = ({ name, email, password, confirmPassword }) => {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (trimmedName.length < 2) {
    return "Please enter a valid full name (at least 2 characters).";
  }

  if (!isValidEmail(trimmedEmail)) {
    return "Please enter a valid email address.";
  }

  const passwordError = getPasswordError(password);
  if (passwordError) {
    return passwordError;
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return "";
};