import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent, logAvvCheck } from '@/lib/db/prisma'
import { hashSensitiveData, calculatePasscodeStrength, isPasscodeRelatedToDob } from '@/lib/utils/helpers'

const createPasscodeSchema = z.object({
  passcode: z.string().length(6, 'Passcode must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passcode } = createPasscodeSchema.parse(body)
    
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const osId = request.headers.get('x-os-id')
    
    if (!userId || !osId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user to check date of birth
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // AVV Check 1: Passcode strength
    const strengthCheck = calculatePasscodeStrength(passcode)
    await logAvvCheck({
      userId,
      checkType: 'PASSCODE_STRENGTH',
      input: 'REDACTED', // Don't log actual passcode
      result: strengthCheck.isWeak ? 'FAIL' : 'PASS',
      reason: strengthCheck.isWeak ? strengthCheck.feedback.join(', ') : undefined,
      metadata: { score: strengthCheck.score }
    })
    
    if (strengthCheck.isWeak) {
      return NextResponse.json({
        error: 'Passcode does not meet security requirements',
        feedback: strengthCheck.feedback
      }, { status: 400 })
    }
    
    // AVV Check 2: Check if passcode is related to date of birth
    if (user.dateOfBirth) {
      const dobCheck = isPasscodeRelatedToDob(passcode, user.dateOfBirth.toISOString())
      await logAvvCheck({
        userId,
        checkType: 'PASSCODE_PERSONAL_DATA',
        result: dobCheck ? 'FAIL' : 'PASS',
        reason: dobCheck ? 'Passcode appears to be related to date of birth' : undefined
      })
      
      if (dobCheck) {
        return NextResponse.json({
          error: 'Passcode cannot be related to your date of birth'
        }, { status: 400 })
      }
    }
    
    // Hash the passcode before storing
    const hashedPasscode = await hashSensitiveData(passcode)
    
    // Update user with hashed passcode
    await prisma.user.update({
      where: { id: userId },
      data: { passcodeHash: hashedPasscode }
    })
    
    // Log successful passcode creation
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      userId,
      eventType: 'PASSCODE_SETUP',
      description: 'Passcode created successfully',
      metadata: { avvPassed: true },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Passcode created successfully'
    })
    
  } catch (error) {
    console.error('Passcode creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid passcode format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create passcode' },
      { status: 500 }
    )
  }
}