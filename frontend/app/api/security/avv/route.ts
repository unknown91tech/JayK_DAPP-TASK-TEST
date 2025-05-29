import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logAvvCheck } from '@/lib/db/prisma'
import { calculatePasscodeStrength, isPasscodeRelatedToDob } from '@/lib/utils/helpers'

const avvSchema = z.object({
  checkType: z.enum(['PASSCODE_STRENGTH', 'PASSCODE_PERSONAL_DATA', 'BIOMETRIC_QUALITY', 'DEVICE_TRUST', 'BEHAVIORAL_PATTERN']),
  input: z.string(),
  metadata: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checkType, input, metadata } = avvSchema.parse(body)
    
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    let result: 'PASS' | 'FAIL' | 'WARNING' = 'PASS'
    let reason: string | undefined
    let avvMetadata: any = {}
    
    switch (checkType) {
      case 'PASSCODE_STRENGTH': {
        const strengthCheck = calculatePasscodeStrength(input)
        result = strengthCheck.isWeak ? 'FAIL' : 'PASS'
        reason = strengthCheck.isWeak ? strengthCheck.feedback.join(', ') : undefined
        avvMetadata = { score: strengthCheck.score, feedback: strengthCheck.feedback }
        break
      }
      
      case 'PASSCODE_PERSONAL_DATA': {
        // This would require additional user data like DOB
        const dateOfBirth = metadata?.dateOfBirth
        if (dateOfBirth) {
          const isDobRelated = isPasscodeRelatedToDob(input, dateOfBirth)
          result = isDobRelated ? 'FAIL' : 'PASS'
          reason = isDobRelated ? 'Input appears to be related to personal data' : undefined
        }
        break
      }
      
      case 'DEVICE_TRUST': {
        // Basic device trust check based on user agent
        const userAgent = request.headers.get('user-agent') || ''
        const isTrusted = !userAgent.includes('bot') && userAgent.length > 20
        result = isTrusted ? 'PASS' : 'WARNING'
        reason = isTrusted ? undefined : 'Device appears suspicious'
        avvMetadata = { userAgent }
        break
      }
      
      default:
        result = 'WARNING'
        reason = 'AVV check not implemented'
    }
    
    // Log the AVV check
    await logAvvCheck({
      userId,
      checkType,
      input: checkType === 'PASSCODE_STRENGTH' || checkType === 'PASSCODE_PERSONAL_DATA' ? 'REDACTED' : input,
      result,
      reason,
      metadata: avvMetadata
    })
    
    return NextResponse.json({
      result,
      reason,
      metadata: avvMetadata
    })
    
  } catch (error) {
    console.error('AVV check error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'AVV check failed' },
      { status: 500 }
    )
  }
}