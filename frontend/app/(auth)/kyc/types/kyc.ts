// app/(auth)/kyc/types/kyc.ts

export interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  countryOfResidence: string
  cityOfResidence: string
  address: string
  zipPostalCode: string
  addressOptional?: string
  dateOfBirth: string
  phoneNumber: string
  // Additional fields for backend compatibility
  middleName?: string
  nationality?: string
  occupation?: string
  state?: string
}

export interface IdentityVerification {
  documentType: 'passport' | 'drivers_license' | 'national_id' | ''
  documentNumber: string
  issuingCountry: string
  expirationDate: string
  documentFront?: File
  documentBack?: File
  selfiePhoto?: File
}

export interface KYCStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
  currentStep: number
  completedSteps: number[]
}

export interface DocumentType {
  value: 'passport' | 'drivers_license' | 'national_id'
  label: string
  description: string
}

export const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 
  'Japan', 'Singapore', 'Switzerland', 'Netherlands', 'Sweden', 'Norway',
  'India', 'Brazil', 'Mexico', 'South Korea', 'Italy', 'Spain', 'Other'
]

export const DOCUMENT_TYPES: DocumentType[] = [
  { value: 'passport', label: 'Passport', description: 'Valid government-issued passport' },
  { value: 'drivers_license', label: 'Driver\'s License', description: 'Government-issued driver\'s license' },
  { value: 'national_id', label: 'National ID Card', description: 'Government-issued national ID card' }
]