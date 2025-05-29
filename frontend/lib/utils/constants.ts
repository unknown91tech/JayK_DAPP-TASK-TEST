// lib/utils/constants.ts
/**
 * Application constants for OneStep Authentication
 * These values define the core behavior and limits of our system
 */

// Application Information
export const APP_CONFIG = {
  name: 'OneStep Authentication',
  version: '1.0.0',
  description: 'Advanced Multi-Layered Authentication System',
  supportEmail: 'support@onestep-auth.com',
  website: 'https://onestep-auth.com'
} as const

// Authentication Limits
export const AUTH_LIMITS = {
  // Maximum number of devices per user
  maxDevicesPerUser: 5,
  
  // Passcode requirements
  passcodeLength: 6,
  passcodeMinStrength: 60, // Score out of 100
  
  // OTP settings
  otpLength: 6,
  otpExpiryMinutes: 10,
  maxOtpAttempts: 3,
  
  // Rate limiting
  maxLoginAttemptsPerHour: 10,
  maxOtpRequestsPerHour: 3,
  maxPasswordResetPerDay: 5,
  
  // Session settings
  sessionDurationDays: 7,
  refreshTokenDays: 30,
  
  // Account lockout
  maxFailedAttempts: 5,
  lockoutDurationHours: 24
} as const

// Security Settings
export const SECURITY_CONFIG = {
  // Minimum security scores for AVV system
  minPasscodeScore: 60,
  minDeviceTrustScore: 50,
  minBehaviorScore: 40,
  
  // Risk levels
  riskThresholds: {
    low: 0,
    medium: 40,
    high: 70,
    critical: 90
  },
  
  // Biometric settings
  biometricTimeout: 60000, // 60 seconds
  maxBiometricCredentials: 3,
  
  // Device fingerprint settings
  deviceFingerprintExpiry: 90, // days
  trustedDeviceThreshold: 85 // trust score
} as const

// UI/UX Constants
export const UI_CONFIG = {
  // Animation durations (in milliseconds)
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
    pageTransition: 200
  },
  
  // Breakpoints (should match Tailwind config)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  
  // Toast/notification settings
  toastDuration: 5000,
  
  // Loading states
  minLoadingTime: 1000, // Minimum time to show loading spinner
  
  // Auto-refresh intervals
  sessionRefreshInterval: 25 * 60 * 1000, // 25 minutes
  securityCheckInterval: 5 * 60 * 1000, // 5 minutes
} as const

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    signup: '/api/auth/signup',
    refresh: '/api/auth/refresh',
    verifyOtp: '/api/auth/verify-otp',
    resendOtp: '/api/auth/resend-otp'
  },
  
  user: {
    profile: '/api/user/profile',
    devices: '/api/user/devices',
    osId: '/api/user/os-id'
  },
  
  security: {
    avv: '/api/security/avv',
    logs: '/api/security/logs',
    events: '/api/security/events'
  },
  
  biometrics: {
    register: '/api/auth/biometrics/register',
    authenticate: '/api/auth/biometrics/authenticate',
    challenge: '/api/auth/biometrics/challenge'
  },
  
  passcode: {
    create: '/api/auth/passcode/create',
    verify: '/api/auth/passcode/verify'
  },
  
  social: {
    telegram: '/api/auth/social/telegram'
  },
  
  sso: {
    authenticate: '/api/sso/authenticate',
    validate: '/api/sso/validate'
  }
} as const

// Error Messages
export const ERROR_MESSAGES = {
  // Generic errors
  generic: 'Something went wrong. Please try again.',
  networkError: 'Network error. Please check your connection.',
  sessionExpired: 'Your session has expired. Please log in again.',
  
  // Authentication errors
  invalidCredentials: 'Invalid credentials. Please try again.',
  accountLocked: 'Your account has been temporarily locked due to multiple failed attempts.',
  deviceNotTrusted: 'This device is not trusted. Please verify your identity.',
  
  // Passcode errors
  weakPasscode: 'Passcode is too weak. Please choose a stronger one.',
  passcodeMatch: 'Passcode cannot be related to your personal information.',
  
  // Biometric errors
  biometricNotSupported: 'Biometric authentication is not supported on this device.',
  biometricFailed: 'Biometric authentication failed. Please try again.',
  biometricCancelled: 'Biometric authentication was cancelled.',
  
  // OTP errors
  invalidOtp: 'Invalid OTP code. Please try again.',
  expiredOtp: 'OTP has expired. Please request a new one.',
  maxOtpAttempts: 'Maximum OTP attempts exceeded. Please try again later.',
  
  // Rate limiting
  rateLimitExceeded: 'Too many requests. Please try again later.',
  
  // Device management
  maxDevicesReached: 'Maximum number of devices reached. Please remove a device first.',
  deviceAlreadyRegistered: 'This device is already registered.',
  
  // Profile errors
  emailAlreadyExists: 'This email is already registered.',
  phoneAlreadyExists: 'This phone number is already registered.',
  usernameAlreadyExists: 'This username is already taken.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  // Authentication
  loginSuccess: 'Successfully logged in!',
  logoutSuccess: 'Successfully logged out.',
  signupSuccess: 'Account created successfully!',
  
  // Profile
  profileUpdated: 'Profile updated successfully.',
  passwordChanged: 'Password changed successfully.',
  
  // Security
  passcodeCreated: 'Passcode created successfully.',
  biometricRegistered: 'Biometric authentication enabled.',
  deviceRegistered: 'Device registered successfully.',
  deviceRemoved: 'Device removed successfully.',
  
  // Verification
  otpSent: 'OTP sent successfully.',
  phoneVerified: 'Phone number verified.',
  emailVerified: 'Email address verified.'
} as const

// Validation Rules
export const VALIDATION_RULES = {
  username: {
    minLength: 6,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 6-20 characters and contain only letters, numbers, and underscores.'
  },
  
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address.'
  },
  
  phoneNumber: {
    minLength: 10,
    pattern: /^\+?[\d\s-()]+$/,
    message: 'Please enter a valid phone number.'
  },
  
  passcode: {
    length: 6,
    pattern: /^\d{6}$/,
    message: 'Passcode must be exactly 6 digits.'
  },
  
  otp: {
    length: 6,
    pattern: /^\d{6}$/,
    message: 'OTP must be exactly 6 digits.'
  },
  
  name: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes.'
  }
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  // Authentication methods
  enableBiometrics: true,
  enableSocialLogin: true,
  enablePasscodeLogin: true,
  
  // Social providers
  enableTelegram: true,
  enableTwitter: false, // Future feature
  enableDiscord: false, // Future feature
  
  // Advanced features
  enableDeviceManagement: true,
  enableSecurityMonitoring: true,
  enableAVVSystem: true,
  enableKYC: true,
  
  // Development features
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableTestMode: process.env.NODE_ENV === 'test',
  
  // Experimental features
  enableAdvancedBiometrics: false,
  enableBehavioralAnalysis: false,
  enableMLFraudDetection: false
} as const

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // URLs
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || '/api',
  
  // External service settings
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME,
  
  // WebAuthn settings
  webauthnOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
  webauthnRpId: process.env.WEBAUTHN_RP_ID || 'localhost',
  webauthnRpName: process.env.WEBAUTHN_RP_NAME || 'OneStep Authentication'
} as const
