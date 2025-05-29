
// lib/utils/validation.ts
import { z } from 'zod'
import { VALIDATION_RULES } from './constants'

/**
 * Zod schemas for form validation
 * These provide type-safe validation for all user inputs
 */

// Base schemas for reusable fields
export const baseSchemas = {
  username: z.string()
    .min(VALIDATION_RULES.username.minLength, `Username must be at least ${VALIDATION_RULES.username.minLength} characters`)
    .max(VALIDATION_RULES.username.maxLength, `Username must be less than ${VALIDATION_RULES.username.maxLength} characters`)
    .regex(VALIDATION_RULES.username.pattern, VALIDATION_RULES.username.message),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  
  phoneNumber: z.string()
    .min(VALIDATION_RULES.phoneNumber.minLength, 'Phone number is too short')
    .regex(VALIDATION_RULES.phoneNumber.pattern, VALIDATION_RULES.phoneNumber.message),
  
  passcode: z.string()
    .length(VALIDATION_RULES.passcode.length, `Passcode must be exactly ${VALIDATION_RULES.passcode.length} digits`)
    .regex(VALIDATION_RULES.passcode.pattern, VALIDATION_RULES.passcode.message),
  
  otp: z.string()
    .length(VALIDATION_RULES.otp.length, `OTP must be exactly ${VALIDATION_RULES.otp.length} digits`)
    .regex(VALIDATION_RULES.otp.pattern, VALIDATION_RULES.otp.message),
  
  name: z.string()
    .min(VALIDATION_RULES.name.minLength, 'Name is required')
    .max(VALIDATION_RULES.name.maxLength, `Name must be less than ${VALIDATION_RULES.name.maxLength} characters`)
    .regex(VALIDATION_RULES.name.pattern, VALIDATION_RULES.name.message),
  
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 13 && age <= 120 // Reasonable age limits
    }, 'Please enter a valid date of birth')
}

// Authentication schemas
export const authSchemas = {
  // Login with OTP
  otpLogin: z.object({
    identifier: z.string().min(1, 'Phone number or email is required'),
    otp: baseSchemas.otp
  }),
  
  // Login with passcode
  passcodeLogin: z.object({
    identifier: z.string().min(1, 'Username or phone number is required'),
    passcode: baseSchemas.passcode
  }),
  
  // Social login
  socialLogin: z.object({
    provider: z.enum(['telegram', 'twitter', 'discord']),
    authData: z.any() // Provider-specific auth data
  }),
  
  // Signup
  signup: z.object({
    identifier: z.string().min(1, 'Phone number or email is required')
  }),
  
  // Account setup
  accountSetup: z.object({
    username: baseSchemas.username,
    firstName: baseSchemas.name,
    lastName: baseSchemas.name,
    dateOfBirth: baseSchemas.dateOfBirth,
    phoneNumber: baseSchemas.phoneNumber,
    referralCode: z.string().optional().or(z.literal(''))
  }),
  
  // Passcode setup
  passcodeSetup: z.object({
    passcode: baseSchemas.passcode,
    confirmPasscode: baseSchemas.passcode
  }).refine((data) => data.passcode === data.confirmPasscode, {
    message: "Passcodes don't match",
    path: ["confirmPasscode"]
  }),
  
  // OTP verification
  otpVerification: z.object({
    otp: baseSchemas.otp,
    identifier: z.string().min(1, 'Identifier is required')
  })
}

// Profile management schemas
export const profileSchemas = {
  // Update basic profile
  updateProfile: z.object({
    firstName: baseSchemas.name.optional(),
    lastName: baseSchemas.name.optional(),
    email: baseSchemas.email.optional(),
    phoneNumber: baseSchemas.phoneNumber.optional()
  }),
  
  // Change passcode
  changePasscode: z.object({
    currentPasscode: baseSchemas.passcode,
    newPasscode: baseSchemas.passcode,
    confirmPasscode: baseSchemas.passcode
  }).refine((data) => data.newPasscode === data.confirmPasscode, {
    message: "New passcodes don't match",
    path: ["confirmPasscode"]
  }).refine((data) => data.currentPasscode !== data.newPasscode, {
    message: "New passcode must be different from current passcode",
    path: ["newPasscode"]
  })
}

// Device management schemas
export const deviceSchemas = {
  // Register device
  registerDevice: z.object({
    deviceName: z.string()
      .min(1, 'Device name is required')
      .max(100, 'Device name is too long'),
    fingerprint: z.string().optional()
  }),
  
  // Trust device
  trustDevice: z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    trusted: z.boolean()
  })
}

// Security schemas
export const securitySchemas = {
  // AVV check
  avvCheck: z.object({
    checkType: z.enum([
      'PASSCODE_STRENGTH',
      'PASSCODE_PERSONAL_DATA',
      'BIOMETRIC_QUALITY',
      'DEVICE_TRUST',
      'BEHAVIORAL_PATTERN',
      'IP_REPUTATION',
      'LOGIN_FREQUENCY',
      'DEVICE_FINGERPRINT'
    ]),
    input: z.any(),
    context: z.any().optional()
  }),
  
  // Security event logging
  securityEvent: z.object({
    eventType: z.string(),
    description: z.string().optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    metadata: z.any().optional()
  })
}

// Biometric schemas
export const biometricSchemas = {
  // Register biometric credential
  registerBiometric: z.object({
    credentialId: z.string(),
    publicKey: z.string(),
    deviceType: z.string().optional()
  }),
  
  // Authenticate with biometric
  authenticateBiometric: z.object({
    credentialId: z.string(),
    signature: z.string(),
    challenge: z.string()
  })
}

/**
 * Validation helper functions
 */

// Check if username is available format (doesn't check database)
export function isValidUsernameFormat(username: string): boolean {
  return baseSchemas.username.safeParse(username).success
}

// Check if email format is valid
export function isValidEmailFormat(email: string): boolean {
  return baseSchemas.email.safeParse(email).success
}

// Check if phone number format is valid
export function isValidPhoneFormat(phone: string): boolean {
  return baseSchemas.phoneNumber.safeParse(phone).success
}

// Validate passcode strength (format only, not security)
export function isValidPasscodeFormat(passcode: string): boolean {
  return baseSchemas.passcode.safeParse(passcode).success
}

// Custom validation for age verification
export function isValidAge(dateOfBirth: string, minAge: number = 13): boolean {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= minAge
  }
  
  return age >= minAge
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}