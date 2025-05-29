// lib/utils/helpers.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'

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
 * Generate a secure device fingerprint
 * This helps identify and manage user devices (max 5 per user)
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  // In a real app, you'd want more sophisticated device fingerprinting
  // including screen resolution, timezone, installed fonts, etc.
  const baseString = `${userAgent}-${ip}-${Date.now()}`
  return btoa(baseString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
}

/**
 * Format phone number for consistent storage and display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country code if not present (assuming US for now)
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  return `+${cleaned}`
}

/**
 * Validate username according to OneStep requirements
 * Must be 6-20 characters, alphanumeric with underscores only
 */
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
  
  return { isValid: true }
}

/**
 * Generate a secure OTP code
 * Returns a 6-digit numeric code
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash sensitive data (like passcodes) before storage
 * Using bcrypt would be better, but this is a simple implementation
 */
export async function hashSensitiveData(data: string): Promise<string> {
  // In a real app, use bcrypt or similar
  // This is just for demonstration
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify hashed data
 */
export async function verifyHashedData(data: string, hash: string): Promise<boolean> {
  const dataHash = await hashSensitiveData(data)
  return dataHash === hash
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
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN' {
  const ua = userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'MOBILE'
  }
  
  if (/tablet|ipad/i.test(ua)) {
    return 'TABLET'
  }
  
  if (/desktop|windows|macintosh|linux/i.test(ua)) {
    return 'DESKTOP'
  }
  
  return 'UNKNOWN'
}

/**
 * Calculate password/passcode strength
 * Used by the AVV system to validate user inputs
 */
export function calculatePasscodeStrength(passcode: string): {
  score: number
  feedback: string[]
  isWeak: boolean
} {
  const feedback: string[] = []
  let score = 0
  
  // Check length
  if (passcode.length >= 6) {
    score += 20
  } else {
    feedback.push('Passcode should be at least 6 digits')
  }
  
  // Check for obvious patterns
  const hasPattern = /^(\d)\1+$/.test(passcode) || // All same digits
                    /012345|123456|234567|345678|456789|567890/.test(passcode) || // Sequential
                    /987654|876543|765432|654321|543210|432109/.test(passcode) // Reverse sequential
  
  if (!hasPattern) {
    score += 30
  } else {
    feedback.push('Avoid obvious patterns like 111111 or 123456')
  }
  
  // Check for variety in digits
  const uniqueDigits = new Set(passcode.split('')).size
  if (uniqueDigits >= 4) {
    score += 25
  } else if (uniqueDigits >= 2) {
    score += 15
  } else {
    feedback.push('Use different digits for better security')
  }
  
  // Check for common weak passcodes
  const commonWeak = ['000000', '111111', '123456', '654321', '123123', '456456']
  if (!commonWeak.includes(passcode)) {
    score += 25
  } else {
    feedback.push('This passcode is too common and easily guessed')
  }
  
  const isWeak = score < 60
  
  return { score, feedback, isWeak }
}

/**
 * Check if passcode is related to date of birth
 * Part of the AVV system validation
 */
export function isPasscodeRelatedToDob(passcode: string, dateOfBirth: string): boolean {
  if (!dateOfBirth) return false
  
  const dob = new Date(dateOfBirth)
  const day = dob.getDate().toString().padStart(2, '0')
  const month = (dob.getMonth() + 1).toString().padStart(2, '0')
  const year = dob.getFullYear().toString()
  const shortYear = year.slice(-2)
  
  // Check various combinations that might be related to DOB
  const dobPatterns = [
    day + month,           // DDMM
    month + day,           // MMDD
    day + month + shortYear, // DDMMYY
    month + day + shortYear, // MMDDYY
    shortYear + month + day, // YYMMDD
    day + shortYear,       // DDYY
    month + shortYear,     // MMYY
    year.slice(-4),        // YYYY
  ]
  
  return dobPatterns.some(pattern => 
    passcode.includes(pattern) || pattern.includes(passcode)
  )
}

/**
 * Sanitize user input to prevent XSS and other attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return nanoid(32)
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

/**
 * Rate limiting utility - track requests per IP
 * In production, you'd use Redis or similar for this
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    const newRecord = { count: 1, resetTime: now + windowMs }
    requestCounts.set(identifier, newRecord)
    return { allowed: true, remaining: maxRequests - 1, resetTime: newRecord.resetTime }
  }
  
  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  // Increment count
  record.count++
  requestCounts.set(identifier, record)
  
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetTime: record.resetTime 
  }
}