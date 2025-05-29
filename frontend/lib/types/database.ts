// lib/types/database.ts
/**
 * Database model types
 * These match our Prisma schema definitions
 */

// Enums from Prisma schema
export enum SocialProvider {
  TELEGRAM = 'TELEGRAM'
}

export enum DeviceType {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP', 
  TABLET = 'TABLET',
  UNKNOWN = 'UNKNOWN'
}

export enum KycStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum OtpPurpose {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  RESET_PASSWORD = 'RESET_PASSWORD',
  VERIFY_PHONE = 'VERIFY_PHONE',
  VERIFY_EMAIL = 'VERIFY_EMAIL'
}

export enum SecurityEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  BIOMETRIC_SETUP = 'BIOMETRIC_SETUP',
  BIOMETRIC_AUTH = 'BIOMETRIC_AUTH',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DEVICE_REGISTERED = 'DEVICE_REGISTERED',
  DEVICE_REMOVED = 'DEVICE_REMOVED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AvvCheckType {
  PASSCODE_STRENGTH = 'PASSCODE_STRENGTH',
  PASSCODE_PERSONAL_DATA = 'PASSCODE_PERSONAL_DATA',
  BIOMETRIC_QUALITY = 'BIOMETRIC_QUALITY',
  DEVICE_TRUST = 'DEVICE_TRUST',
  BEHAVIORAL_PATTERN = 'BEHAVIORAL_PATTERN'
}

export enum AvvResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING'
}

// Database model interfaces (matching Prisma generated types)
export interface User {
  id: string
  osId: string
  username: string
  email?: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: Date
  passcodeHash?: string
  isVerified: boolean
  kycStatus: KycStatus
  kycData?: any
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface SocialLogin {
  id: string
  userId: string
  provider: SocialProvider
  providerId: string
  providerData?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Device {
  id: string
  userId: string
  deviceName: string
  deviceType: DeviceType
  fingerprint: string
  userAgent?: string
  ipAddress?: string
  isActive: boolean
  isTrusted: boolean
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
}

export interface BiometricCredential {
  id: string
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  deviceType?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
}

export interface OtpVerification {
  id: string
  identifier: string
  code: string
  purpose: OtpPurpose
  isUsed: boolean
  attempts: number
  maxAttempts: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface SecurityLog {
  id: string
  userId?: string
  eventType: SecurityEvent
  description?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  riskLevel: RiskLevel
  createdAt: Date
}

export interface AvvLog {
  id: string
  userId: string
  checkType: AvvCheckType
  input?: string
  result: AvvResult
  reason?: string
  metadata?: any
  createdAt: Date
}

export interface SsoSession {
  id: string
  userId: string
  osId: string
  dappId: string
  sessionToken: string
  isActive: boolean
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}