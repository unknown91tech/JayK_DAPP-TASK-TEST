// lib/utils/api-client.ts
/**
 * API client configuration and utilities
 * Centralized API communication with proper error handling and types
 */

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000

// Response interface for all API calls
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// API error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic API client with proper error handling
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  // Generic request method with timeout and error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Add timeout to the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new ApiError(
          'Invalid response format',
          response.status
        )
      }

      const data: ApiResponse<T> = await response.json()

      // Handle API-level errors
      if (!response.ok) {
        throw new ApiError(
          data.error || `Request failed with status ${response.status}`,
          response.status
        )
      }

      if (!data.success) {
        throw new ApiError(
          data.error || 'Request failed',
          response.status
        )
      }

      return data.data as T
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiError) {
        throw error
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408)
        }
        throw new ApiError(error.message, 500)
      }
      
      throw new ApiError('Unknown error occurred', 500)
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    return this.request<T>(url.pathname + url.search)
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Upload files (multipart/form-data)
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
    })
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

// Specific API service classes for better organization
export class AuthService {
  // Login with different methods
  static async login(data: {
    identifier: string
    method: 'social' | 'passcode' | 'biometric'
    passcode?: string
    biometricData?: any
  }) {
    return apiClient.post('/auth/login', data)
  }

  // Verify OTP
  static async verifyOtp(data: {
    identifier: string
    otp: string
    purpose: string
  }) {
    return apiClient.post('/auth/verify-otp', data)
  }

  // Resend OTP
  static async resendOtp(identifier: string) {
    return apiClient.post('/auth/resend-otp', { identifier })
  }

  // Logout
  static async logout() {
    return apiClient.post('/auth/logout')
  }

  // Check username availability
  static async checkUsername(username: string) {
    return apiClient.post('/auth/check-username', { username })
  }

  // Setup account
  static async setupAccount(data: any) {
    return apiClient.post('/auth/setup-account', data)
  }

  // Create passcode
  static async createPasscode(passcode: string) {
    return apiClient.post('/auth/passcode/create', { passcode })
  }
}

export class UserService {
  // Get user profile
  static async getProfile() {
    return apiClient.get('/user/profile')
  }

  // Update user profile
  static async updateProfile(data: any) {
    return apiClient.put('/user/profile', data)
  }

  // Get user devices
  static async getDevices() {
    return apiClient.get('/user/devices')
  }

  // Register new device
  static async registerDevice(data: {
    deviceName: string
    fingerprint?: string
  }) {
    return apiClient.post('/user/devices', data)
  }

  // Remove device
  static async removeDevice(deviceId: string) {
    return apiClient.delete(`/user/devices?deviceId=${deviceId}`)
  }

  // Get OS-ID information
  static async getOsId() {
    return apiClient.get('/user/os-id')
  }
}

export class SecurityService {
  // Get security events
  static async getEvents(params?: {
    limit?: number
    offset?: number
    eventType?: string
  }) {
    return apiClient.get('/security/events', params)
  }

  // Get security statistics
  static async getStats() {
    return apiClient.get('/security/stats')
  }

  // Run AVV check
  static async runAvvCheck(data: {
    checkType: string
    input: any
    context?: any
  }) {
    return apiClient.post('/security/avv', data)
  }
}

export class KycService {
  // Submit KYC information
  static async submit(formData: FormData) {
    return apiClient.upload('/kyc/submit', formData)
  }

  // Get KYC status
  static async getStatus() {
    return apiClient.get('/kyc/status')
  }
}

export class SsoService {
  // Authenticate for SSO
  static async authenticate(data: {
    osId: string
    dappId: string
    callbackUrl: string
    scope?: string[]
  }) {
    return apiClient.post('/sso/authenticate', data)
  }

  // Validate SSO token
  static async validate(data: {
    token: string
    dappId: string
  }) {
    return apiClient.post('/sso/validate', data)
  }
}

// Error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on client errors (4xx) except for timeout
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }

  throw lastError!
}