// lib/db/prisma.ts - Database helper functions
import { PrismaClient } from '@prisma/client'

// Create a global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to get current IP address
export async function getCurrentIpAddress(): Promise<string> {
  try {
    const response = await fetch('https://ipinfo.io/json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
    return 'unknown';
  }
}

// Helper function to generate unique OS-ID (OneStep ID)
export function generateOsId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'OS' // Prefix for OneStep
  
  // Generate 7 random characters for a total of 9 characters (OS + 7)
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result // Example: "OS7K2M4N9"
}

// Helper function to check if username is available
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })
    return !existingUser
  } catch (error) {
    console.error('Error checking username availability:', error)
    throw new Error('Failed to check username availability')
  }
}

// Helper function to find user by OS-ID
export async function findUserByOsId(osId: string) {
  try {
    return await prisma.user.findUnique({
      where: { osId },
      include: {
        socialLogins: true,
        devices: {
          where: { isActive: true }
        }
      }
    })
  } catch (error) {
    console.error('Error finding user by OS-ID:', error)
    throw new Error('Failed to find user')
  }
}

// Helper function to get user's active devices
export async function getUserActiveDevices(userId: string) {
  try {
    return await prisma.device.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        lastUsedAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Error getting user devices:', error)
    throw new Error('Failed to get user devices')
  }
}

// Helper function for logging security events
interface SecurityLogData {
  userId?: string
  eventType: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export async function logSecurityEvent(data: SecurityLogData) {
  try {
    // Get current IP address if not provided
    const ipAddress =  await getCurrentIpAddress();
    await prisma.securityLog.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: ipAddress,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        riskLevel: data.riskLevel || 'LOW'
      }
    })
    console.log('✅ Security event logged:', data.eventType)
  } catch (error) {
    console.error('❌ Failed to log security event:', error)
    // Don't throw error as logging shouldn't break the main flow
  }
}

// Helper function for logging AVV (Auto-Verification & Validation) checks
interface AvvLogData {
  userId: string
  checkType: string
  input?: string
  result: 'PASS' | 'FAIL' | 'WARNING'
  reason?: string
  metadata?: any
}

export async function logAvvCheck(data: AvvLogData) {
  try {
    await prisma.avvLog.create({
      data: {
        userId: data.userId,
        checkType: data.checkType,
        input: data.input,
        result: data.result,
        reason: data.reason,
        metadata: data.metadata || {}
      }
    })
    console.log('✅ AVV check logged:', data.checkType, data.result)
  } catch (error) {
    console.error('❌ Failed to log AVV check:', error)
  }
}

// Helper function to create/update OTP verification records
interface OtpData {
  identifier: string
  code: string
  purpose: 'LOGIN' | 'SIGNUP' | 'RESET_PASSWORD' | 'VERIFY_PHONE' | 'VERIFY_EMAIL'
  expiresAt: Date
}

export async function upsertOtpVerification(data: OtpData) {
  try {
    return await prisma.otpVerification.upsert({
      where: {
        // Create composite unique constraint on identifier + purpose
        id: `${data.identifier}_${data.purpose}`
      },
      update: {
        code: data.code,
        expiresAt: data.expiresAt,
        attempts: 0, // Reset attempts on new OTP
        isUsed: false,
        verifiedAt: null
      },
      create: {
        identifier: data.identifier,
        code: data.code,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        attempts: 0,
        isUsed: false
      }
    })
  } catch (error) {
    console.error('Error upserting OTP verification:', error)
    throw new Error('Failed to store OTP verification')
  }
}

// Helper function to verify OTP
export async function verifyOtp(identifier: string, code: string, purpose: string) {
  try {
    // Find the OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        purpose,
        isUsed: false,
        expiresAt: {
          gt: new Date() // Not expired
        }
      }
    })

    if (!otpRecord) {
      return {
        success: false,
        error: 'OTP not found or expired'
      }
    }

    // Check attempts limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return {
        success: false,
        error: 'Too many failed attempts'
      }
    }

    // Verify the code
    if (otpRecord.code !== code) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      })

      return {
        success: false,
        error: `Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attempts - 1} attempts remaining.`
      }
    }

    // Mark as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        isUsed: true,
        verifiedAt: new Date()
      }
    })

    return {
      success: true,
      message: 'OTP verified successfully'
    }

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return {
      success: false,
      error: 'OTP verification failed'
    }
  }
}

// Helper function to create SSO sessions
interface SsoSessionData {
  userId: string
  osId: string
  dappId: string
  sessionToken: string
  expiresAt: Date
}

export async function createSsoSession(data: SsoSessionData) {
  try {
    return await prisma.ssoSession.create({
      data: {
        userId: data.userId,
        osId: data.osId,
        dappId: data.dappId,
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt
      }
    })
  } catch (error) {
    console.error('Error creating SSO session:', error)
    throw new Error('Failed to create SSO session')
  }
}

// Helper function to validate SSO sessions
export async function validateSsoSession(sessionToken: string) {
  try {
    const session = await prisma.ssoSession.findUnique({
      where: {
        sessionToken,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    return session
  } catch (error) {
    console.error('Error validating SSO session:', error)
    return null
  }
}

// Helper function to clean up expired records (run periodically)
export async function cleanupExpiredRecords() {
  try {
    const now = new Date()
    
    // Clean up expired OTP verifications
    const expiredOtps = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    // Clean up expired SSO sessions
    const expiredSessions = await prisma.ssoSession.updateMany({
      where: {
        expiresAt: {
          lt: now
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    console.log(`🧹 Cleanup complete: ${expiredOtps.count} OTPs, ${expiredSessions.count} SSO sessions`)
    
    return {
      expiredOtps: expiredOtps.count,
      expiredSessions: expiredSessions.count
    }
  } catch (error) {
    console.error('Error during cleanup:', error)
    throw new Error('Cleanup failed')
  }
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`📊 Current user count: ${userCount}`)
    
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}