// lib/types/api.ts
/**
 * API response and request types
 * Standardized types for all API communications
 */

// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// Paginated response for lists
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Error response details
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  stack?: string // Only in development
}

// Authentication request/response types
export interface LoginRequest {
  identifier: string // username, email, or phone
  method: LoginMethod
  passcode?: string
  biometricData?: any
  deviceInfo?: {
    fingerprint: string
    name: string
    type: string
  }
}

export interface LoginResponse extends ApiResponse {
  data?: {
    user: AuthUser
    token: string
    expiresAt: string
    requiresSetup?: boolean
    nextStep?: string
  }
}

// OTP request/response types
export interface OtpRequest {
  identifier: string
  purpose: OtpPurpose
}

export interface OtpVerifyRequest {
  identifier: string
  code: string
  purpose: OtpPurpose
}

// Profile update request
export interface ProfileUpdateRequest {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  preferences?: Partial<UserPreferences>
}

// Device management requests
export interface DeviceRegisterRequest {
  deviceName: string
  fingerprint?: string
  deviceType?: string
}

export interface DeviceUpdateRequest {
  deviceName?: string
  isTrusted?: boolean
}

// Security monitoring types
export interface SecurityEvent {
  id: string
  userId?: string
  eventType: string
  description: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  metadata?: Record<string, any>
}

// SSO (Single Sign-On) types
export interface SsoRequest {
  osId: string
  dappId: string
  callbackUrl: string
  scope?: string[]
}

export interface SsoResponse extends ApiResponse {
  data?: {
    token: string
    expiresAt: string
    user: {
      osId: string
      username: string
      email?: string
      firstName?: string
      lastName?: string
    }
  }
}