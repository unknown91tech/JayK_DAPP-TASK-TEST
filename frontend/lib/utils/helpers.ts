// lib/utils/helpers.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Utility function to merge Tailwind classes safely
 * This prevents conflicts and ensures proper class application
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique OneStep ID (OS-ID)
 * This is the universal identifier that users will use across all dApps
 */
export function generateOsId(): string {
  // Using a combination of timestamp and random string for uniqueness
  const timestamp = Date.now().toString(36)
  const randomStr = nanoid(8)
  return `OS-${timestamp}-${randomStr}`.toUpperCase()
}

/**
 * Format time remaining for OTP expiration
 */
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Check if user agent suggests a trusted device
 * This is a simple implementation - in production you'd want more sophisticated checks
 */
export function isTrustedUserAgent(userAgent: string): boolean {
  // Check for known browser user agents
  const trustedBrowsers = [
    'Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'
  ]
  
  return trustedBrowsers.some(browser => 
    userAgent.includes(browser)
  )
}



// Generate a secure random string for tokens, session IDs, etc.
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate a session token for SSO and other purposes
export function generateSessionToken(): string {
  return generateSecureToken(32)
}

// Format phone numbers to a consistent format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country code if missing (assuming US +1 for this example)
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // Return as-is if it already looks international
  return cleaned.startsWith('+') ? phone : `+${cleaned}`
}

// Validate username according to our rules
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }
  
  if (username.length < 6) {
    return { isValid: false, error: 'Username must be at least 6 characters' }
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }
  
  // Check for common weak usernames
  const weakUsernames = ['password', 'username', 'admin', 'test', 'user', '123456', 'qwerty']
  if (weakUsernames.includes(username.toLowerCase())) {
    return { isValid: false, error: 'Please choose a more unique username' }
  }
  
  return { isValid: true }
}

// Hash sensitive data like passcodes
export async function hashSensitiveData(data: string): Promise<string> {
  const saltRounds = 12 // High security for sensitive data
  return await bcrypt.hash(data, saltRounds)
}

// Verify hashed data
export async function verifyHashedData(plaintext: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plaintext, hashed)
}

// Calculate passcode strength for AVV system
export function calculatePasscodeStrength(passcode: string): {
  score: number
  isWeak: boolean
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Check length (should be exactly 6 digits)
  if (passcode.length !== 6) {
    feedback.push('Passcode must be exactly 6 digits')
    return { score: 0, isWeak: true, feedback }
  }
  
  // Check if all digits
  if (!/^\d{6}$/.test(passcode)) {
    feedback.push('Passcode must contain only digits')
    return { score: 0, isWeak: true, feedback }
  }
  
  // Check for sequential patterns (123456, 654321)
  const isSequential = /012345|123456|234567|345678|456789|987654|876543|765432|654321|543210/.test(passcode)
  if (isSequential) {
    feedback.push('Avoid sequential patterns')
    score -= 30
  } else {
    score += 20
  }
  
  // Check for repeated digits (000000, 111111, etc.)
  const isRepeated = /^(\d)\1{5}$/.test(passcode)
  if (isRepeated) {
    feedback.push('Avoid repeated digits')
    score -= 40
  } else {
    score += 20
  }
  
  // Check for common weak patterns
  const weakPatterns = ['123456', '654321', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '121212', '101010', '123123', '456456']
  if (weakPatterns.includes(passcode)) {
    feedback.push('This is a commonly used passcode')
    score -= 50
  } else {
    score += 30
  }
  
  // Check for digit variety (bonus for using different digits)
  const uniqueDigits = new Set(passcode.split('')).size
  if (uniqueDigits >= 4) {
    score += 20
  } else if (uniqueDigits <= 2) {
    feedback.push('Use more varied digits')
    score -= 20
  }
  
  // Calculate final score (0-100)
  score = Math.max(0, Math.min(100, score + 50)) // Base score of 50
  
  const isWeak = score < 60 || feedback.length > 0
  
  if (!isWeak) {
    feedback.push('Strong passcode!')
  }
  
  return { score, isWeak, feedback }
}

// Check if passcode is related to date of birth
export function isPasscodeRelatedToDob(passcode: string, dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth)
  const year = dob.getFullYear().toString()
  const month = (dob.getMonth() + 1).toString().padStart(2, '0')
  const day = dob.getDate().toString().padStart(2, '0')
  
  // Check various date formats
  const patterns = [
    `${month}${day}${year.slice(-2)}`, // MMDDYY
    `${day}${month}${year.slice(-2)}`, // DDMMYY
    `${month}${day}${year.slice(-4)}`, // MMDDYYYY (only first 6 digits)
    `${day}${month}${year.slice(-4)}`, // DDMMYYYY (only first 6 digits)
    year.slice(-2) + month + day, // YYMMDD
    year.slice(-2) + day + month, // YYDDMM
    year.slice(-4) + month + day, // YYYYMMDD (only first 6 digits)
    month + year.slice(-2), // MMYY + any
    day + year.slice(-2), // DDYY + any
    year.slice(-2) + month, // YYMM + any
    year.slice(-2) + day, // YYDD + any
  ]
  
  return patterns.some(pattern => {
    const pattern6 = pattern.slice(0, 6).padEnd(6, '0')
    return passcode === pattern6 || passcode.includes(pattern.slice(0, 4))
  })
}

// Generate device fingerprint for device registration
export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}|${ipAddress}|${Date.now()}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
}

// Detect device type from user agent
export function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return 'desktop'
  }
  
  return 'unknown'
}

// Generate OTP code
export function generateOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Format currency amounts
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Format dates consistently
export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = new Date(date)
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    case 'relative':
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString()
    default:
      return d.toLocaleDateString()
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Generate a random color for user avatars, device icons, etc.
export function generateRandomColor(seed?: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  if (seed) {
    // Generate consistent color based on seed
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }
  
  return colors[Math.floor(Math.random() * colors.length)]
}

// Check if a string is a valid OS-ID format
export function isValidOsId(osId: string): boolean {
  // OS-ID should be: OS + 7 alphanumeric characters (e.g., "OS7K2M4N9")
  return /^OS[A-Z0-9]{7}$/.test(osId)
}

// Rate limiting helper - check if action is allowed
export function checkRateLimit(
  identifier: string, 
  maxAttempts: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: Date } {
  // In production, this would use Redis or a proper rate limiting service
  // For now, we'll use a simple in-memory store
  
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)
  
  // This would be stored in Redis/database in production
  const key = `rate_limit:${identifier}`
  const attempts = getRateLimitAttempts(key, windowStart)
  
  const remaining = Math.max(0, maxAttempts - attempts.length)
  const allowed = remaining > 0
  
  if (allowed) {
    // Record this attempt
    recordRateLimitAttempt(key, now)
  }
  
  const resetTime = new Date(now.getTime() + windowMs)
  
  return { allowed, remaining, resetTime }
}

// Helper functions for rate limiting (would be Redis in production)
const rateLimitStore = new Map<string, Date[]>()

function getRateLimitAttempts(key: string, windowStart: Date): Date[] {
  const attempts = rateLimitStore.get(key) || []
  // Filter to only include attempts within the window
  return attempts.filter(attempt => attempt >= windowStart)
}

function recordRateLimitAttempt(key: string, timestamp: Date): void {
  const attempts = rateLimitStore.get(key) || []
  attempts.push(timestamp)
  rateLimitStore.set(key, attempts)
  
  // Clean up old attempts periodically
  if (attempts.length > 100) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const filtered = attempts.filter(attempt => attempt >= oneHourAgo)
    rateLimitStore.set(key, filtered)
  }
}

// Validate and normalize URLs
export function normalizeUrl(url: string): string | null {
  try {
    const normalized = new URL(url)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(normalized.protocol)) {
      return null
    }
    
    return normalized.toString()
  } catch {
    return null
  }
}

// Generate a secure backup code for account recovery
export function generateBackupCode(): string {
  // Generate 8 groups of 4 characters each (32 characters total)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const groups = []
  
  for (let i = 0; i < 8; i++) {
    let group = ''
    for (let j = 0; j < 4; j++) {
      group += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    groups.push(group)
  }
  
  return groups.join('-') // Example: "A7K3-M9N2-Q5R8-etc"
}

// Mask sensitive data for logging (show only first/last characters)
export function maskSensitiveData(
  data: string, 
  visibleStart: number = 2, 
  visibleEnd: number = 2
): string {
  if (data.length <= visibleStart + visibleEnd) {
    return '*'.repeat(data.length)
  }
  
  const start = data.substring(0, visibleStart)
  const end = data.substring(data.length - visibleEnd)
  const middle = '*'.repeat(data.length - visibleStart - visibleEnd)
  
  return start + middle + end
}

// Convert bytes to human readable format
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Sleep/delay function for testing and rate limiting
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Debounce function for API calls and search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for event handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Generate a QR code data URL for 2FA setup, backup codes, etc.
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  // In a real implementation, you'd use a QR code library like 'qrcode'
  // For now, return a placeholder data URL
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
        QR Code for: ${text.substring(0, 20)}...
      </text>
    </svg>
  `)}`
}

// Validate and parse JWT tokens (client-side verification)
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// Check if JWT token is expired
export function isJWTExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

// Generate a secure random string for challenges, nonces, etc.
export function generateChallenge(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''
  const randomArray = new Uint8Array(length)
  
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    window.crypto.getRandomValues(randomArray)
  } else {
    // Node.js environment
    crypto.randomFillSync(randomArray)
  }
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomArray[i] % chars.length)
  }
  
  return result
}

// Validate and format IP addresses
export function normalizeIP(ip: string): string {
  // Handle various proxy headers and formats
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }
  
  // Remove port numbers
  if (ip.includes(':') && !ip.includes('::')) {
    const parts = ip.split(':')
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      ip = parts[0]
    }
  }
  
  return ip
}

// Check if running in development environment
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Check if running in production environment
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Get environment variable with fallback
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value || fallback || ''
}

// Create a human-readable error message from various error types
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'An unknown error occurred'
}

// Log error with context for debugging
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const timestamp = new Date().toISOString()
  
  console.error(`[${timestamp}] ${context ? `${context}: ` : ''}${message}`)
  
  // In production, you'd send this to your logging service
  if (isProduction()) {
    // Send to logging service like Sentry, LogRocket, etc.
  }
}