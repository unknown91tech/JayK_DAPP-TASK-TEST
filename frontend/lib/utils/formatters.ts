/**
 * Data formatting utilities for OneStep Authentication
 * These functions help display data consistently throughout the app
 */

/**
 * Format phone numbers for display
 */
export function formatPhoneForDisplay(phone: string): string {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Format based on length
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number with country code
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    // US number without country code
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length > 10) {
    // International number
    return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`
  }
  
  // Fallback for other formats
  return phone
}

/**
 * Format dates for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return dateObj.toLocaleDateString(undefined, defaultOptions)
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else {
    return formatDate(dateObj)
  }
}

/**
 * Format OS-ID for display (with spacing)
 */
export function formatOsId(osId: string): string {
  // Add spaces every 4 characters for better readability
  return osId.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Mask sensitive data (like phone numbers or emails)
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'passcode'): string {
  switch (type) {
    case 'email':
      const [localPart, domain] = data.split('@')
      if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`
      }
      return `${localPart.slice(0, 2)}***@${domain}`
    
    case 'phone':
      const cleaned = data.replace(/\D/g, '')
      if (cleaned.length >= 10) {
        return `***-***-${cleaned.slice(-4)}`
      }
      return '***-****'
    
    case 'passcode':
      return '••••••'
    
    default:
      return '***'
  }
}

/**
 * Format device type for display
 */
export function formatDeviceType(deviceType: string): string {
  const deviceTypeMap: Record<string, string> = {
    'MOBILE': 'Mobile Phone',
    'TABLET': 'Tablet',
    'DESKTOP': 'Desktop Computer',
    'LAPTOP': 'Laptop',
    'UNKNOWN': 'Unknown Device'
  }
  
  return deviceTypeMap[deviceType.toUpperCase()] || deviceType
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format security risk level
 */
export function formatRiskLevel(riskLevel: string): {
  label: string
  color: string
  icon: string
} {
  const riskMap = {
    'LOW': {
      label: 'Low Risk',
      color: 'text-status-success',
      icon: '🟢'
    },
    'MEDIUM': {
      label: 'Medium Risk',
      color: 'text-status-warning',
      icon: '🟡'
    },
    'HIGH': {
      label: 'High Risk',
      color: 'text-status-error',
      icon: '🟠'
    },
    'CRITICAL': {
      label: 'Critical Risk',
      color: 'text-status-error',
      icon: '🔴'
    }
  }
  
  return riskMap[riskLevel as keyof typeof riskMap] || {
    label: 'Unknown',
    color: 'text-foreground-tertiary',
    icon: '⚪'
  }
}

/**
 * Format KYC status
 */
export function formatKycStatus(status: string): {
  label: string
  color: string
  description: string
} {
  const statusMap = {
    'PENDING': {
      label: 'Pending',
      color: 'text-status-warning',
      description: 'Identity verification is pending'
    },
    'IN_PROGRESS': {
      label: 'In Progress',
      color: 'text-accent-primary',
      description: 'Identity verification is being processed'
    },
    'APPROVED': {
      label: 'Verified',
      color: 'text-status-success',
      description: 'Identity has been verified'
    },
    'REJECTED': {
      label: 'Rejected',
      color: 'text-status-error',
      description: 'Identity verification was rejected'
    },
    'EXPIRED': {
      label: 'Expired',
      color: 'text-foreground-tertiary',
      description: 'Identity verification has expired'
    }
  }
  
  return statusMap[status as keyof typeof statusMap] || {
    label: 'Unknown',
    color: 'text-foreground-tertiary',
    description: 'Unknown verification status'
  }
}

/**
 * Format currency (for future premium features)
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format user's full name
 */
export function formatFullName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'Unknown User'
  if (!lastName) return firstName || ''
  if (!firstName) return lastName || ''
  return `${firstName} ${lastName}`
}

/**
 * Generate user initials for avatars
 */
export function getUserInitials(firstName?: string, lastName?: string, fallback: string = 'U'): string {
  if (!firstName && !lastName) return fallback
  
  const firstInitial = firstName?.charAt(0).toUpperCase() || ''
  const lastInitial = lastName?.charAt(0).toUpperCase() || ''
  
  if (firstInitial && lastInitial) return firstInitial + lastInitial
  return firstInitial || lastInitial || fallback
}