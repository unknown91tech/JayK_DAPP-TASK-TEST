// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
// This prevents multiple instances in development due to hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with logging for development
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Middleware to handle common operations and logging
prisma.$use(async (params, next) => {
  const before = Date.now()
  
  // Execute the query
  const result = await next(params)
  
  const after = Date.now()
  
  // Log slow queries in development
  if (process.env.NODE_ENV === 'development' && after - before > 1000) {
    console.log(`⚠️  Slow Query: ${params.model}.${params.action} took ${after - before}ms`)
  }
  
  return result
})

// Utility functions for common database operations

/**
 * Find user by OS-ID (most common lookup)
 */
export async function findUserByOsId(osId: string) {
  return prisma.user.findUnique({
    where: { osId },
    include: {
      devices: true,
      biometrics: true,
      socialLogins: true,
    }
  })
}

/**
 * Find user by username
 */
export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: {
      devices: true,
      socialLogins: true,
    }
  })
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  })
  return !existingUser
}

/**
 * Get user's active devices (for device management - max 5)
 */
export async function getUserActiveDevices(userId: string) {
  return prisma.device.findMany({
    where: {
      userId,
      isActive: true
    },
    orderBy: {
      lastUsedAt: 'desc'
    }
  })
}

/**
 * Log security events for monitoring
 */
export async function logSecurityEvent(data: {
  userId?: string
  eventType: string
  description?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}) {
  return prisma.securityLog.create({
    data: {
      ...data,
      riskLevel: data.riskLevel || 'LOW',
    }
  })
}

/**
 * Log AVV (Auto-Verification & Validation) checks
 */
export async function logAvvCheck(data: {
  userId: string
  checkType: string
  input?: string
  result: 'PASS' | 'FAIL' | 'WARNING'
  reason?: string
  metadata?: any
}) {
  return prisma.avvLog.create({
    data
  })
}

/**
 * Create or update OTP verification record
 */
export async function upsertOtpVerification(data: {
  identifier: string
  code: string
  purpose: 'LOGIN' | 'SIGNUP' | 'RESET_PASSWORD' | 'VERIFY_PHONE' | 'VERIFY_EMAIL'
  expiresAt: Date
}) {
  // First, deactivate any existing OTP for this identifier
  await prisma.otpVerification.updateMany({
    where: {
      identifier: data.identifier,
      purpose: data.purpose,
      isUsed: false
    },
    data: {
      isUsed: true
    }
  })
  
  // Create new OTP record
  return prisma.otpVerification.create({
    data
  })
}

/**
 * Verify OTP code
 */
export async function verifyOtp(identifier: string, code: string, purpose: string) {
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      identifier,
      purpose,
      isUsed: false,
      expiresAt: {
        gt: new Date()
      }
    }
  })
  
  if (!otpRecord) {
    return { success: false, error: 'Invalid or expired OTP' }
  }
  
  // Check if max attempts exceeded
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    return { success: false, error: 'Maximum attempts exceeded' }
  }
  
  // Increment attempts
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { attempts: otpRecord.attempts + 1 }
  })
  
  // Verify code (in production, you'd hash the stored code)
  if (otpRecord.code !== code) {
    return { success: false, error: 'Invalid OTP code' }
  }
  
  // Mark as used
  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { isUsed: true }
  })
  
  return { success: true }
}

/**
 * Clean up expired OTP records (should be run periodically)
 */
export async function cleanupExpiredOtps() {
  const result = await prisma.otpVerification.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date()
          }
        },
        {
          isUsed: true,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
          }
        }
      ]
    }
  })
  
  console.log(`🧹 Cleaned up ${result.count} expired OTP records`)
  return result
}

/**
 * Create SSO session for external dApp access
 */
export async function createSsoSession(data: {
  userId: string
  osId: string
  dappId: string
  sessionToken: string
  expiresAt: Date
}) {
  return prisma.ssoSession.create({
    data
  })
}

/**
 * Validate SSO session
 */
export async function validateSsoSession(sessionToken: string) {
  return prisma.ssoSession.findUnique({
    where: {
      sessionToken,
      isActive: true,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      // We'll need to join with user table through osId
      // This would require adjusting the schema to add the relation
    }
  })
}

/**
 * Get security logs for monitoring dashboard
 */
export async function getSecurityLogs(params: {
  userId?: string
  eventType?: string
  riskLevel?: string
  limit?: number
  offset?: number
}) {
  const { userId, eventType, riskLevel, limit = 50, offset = 0 } = params
  
  return prisma.securityLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(eventType && { eventType }),
      ...(riskLevel && { riskLevel }),
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          username: true,
          osId: true
        }
      }
    }
  })
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})