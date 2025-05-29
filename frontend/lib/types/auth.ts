// lib/types/auth.ts
/**
 * Authentication-related TypeScript types
 * These types ensure type safety across our authentication system
 */

// Basic user information after authentication
export interface AuthUser {
  userId: string
  osId: string
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  isVerified: boolean
  isSetupComplete: boolean
}

// Login method types - what ways users can authenticate
export type LoginMethod = 'social' | 'passcode' | 'biometric' | 'otp'

// Social login providers we support
export type SocialProvider = 'telegram' | 'twitter' | 'discord' | 'google' | 'github'

// Authentication session data
export interface AuthSession {
  token: string
  user: AuthUser
  expiresAt: string
  loginMethod: LoginMethod
  deviceId?: string
}

// OTP verification purposes
export type OtpPurpose = 'LOGIN' | 'SIGNUP' | 'RESET_PASSWORD' | 'VERIFY_PHONE' | 'VERIFY_EMAIL'

// Biometric authentication types
export interface BiometricCredential {
  id: string
  credentialId: string
  deviceType: 'touch_id' | 'face_id' | 'fingerprint' | 'windows_hello' | 'generic'
  publicKey: string
  counter: number
  isActive: boolean
  createdAt: string
  lastUsedAt?: string
}

// Social login user data from providers
export interface SocialUserData {
  provider: SocialProvider
  providerId: string
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  profileImage?: string
  providerData: Record<string, any> // Provider-specific data
}

// Authentication errors
export interface AuthError {
  code: string
  message: string
  details?: Record<string, any>
}

// lib/types/user.ts  
/**
 * User-related TypeScript types
 * Comprehensive type definitions for user data and operations
 */

// Complete user profile information
export interface UserProfile {
  id: string
  osId: string
  username: string
  email?: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  
  // Account status
  isVerified: boolean
  kycStatus: KycStatus
  
  // Timestamps
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

// KYC (Know Your Customer) status types
export type KycStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

// Device information for user's trusted devices
export interface UserDevice {
  id: string
  deviceName: string
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN'
  fingerprint: string
  isActive: boolean
  isTrusted: boolean
  lastUsedAt: string
  createdAt: string
  location?: string
  userAgent?: string
  ipAddress?: string
}

// User preferences and settings
export interface UserPreferences {
  // Security preferences
  enableBiometrics: boolean
  enablePasscode: boolean
  require2FA: boolean
  
  // Notification preferences
  emailNotifications: boolean
  smsNotifications: boolean
  securityAlerts: boolean
  
  // Privacy preferences
  profileVisibility: 'public' | 'private' | 'friends'
  dataSharing: boolean
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto'
  language: string
}

// User activity and security logs
export interface UserActivity {
  id: string
  eventType: string
  description: string
  timestamp: string
  ipAddress?: string
  deviceInfo?: string
  location?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}