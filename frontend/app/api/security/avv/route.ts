// app/api/security/avv/route.ts
// AVV = Auto-Verification & Validation system
// This endpoint runs various security checks on user inputs
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { logAvvCheck } from '@/lib/db/prisma'
import { calculatePasscodeStrength, isPasscodeRelatedToDob } from '@/lib/utils/helpers'

// Validation schema for AVV check requests
const avvSchema = z.object({
  checkType: z.enum([
    'PASSCODE_STRENGTH', 
    'PASSCODE_PERSONAL_DATA', 
    'BIOMETRIC_QUALITY', 
    'DEVICE_TRUST', 
    'BEHAVIORAL_PATTERN'
  ], {
    errorMap: () => ({ message: 'Invalid check type specified' })
  }),
  input: z.string().min(1, 'Input data is required'),
  metadata: z.any().optional() // Additional context data
})

export async function POST(request: NextRequest) {
  console.log('🛡️ AVV (Auto-Verification & Validation) check requested')
  
  try {
    // Step 1: Parse and validate the request
    let body
    try {
      body = await request.json()
      console.log('📦 AVV request received:', {
        checkType: body.checkType,
        hasInput: !!body.input,
        hasMetadata: !!body.metadata
      })
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate the request structure
    let validatedData
    try {
      validatedData = avvSchema.parse(body)
      console.log('✅ AVV request validation passed')
    } catch (validationError) {
      console.error('❌ AVV validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid AVV request format', 
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
    }

    const { checkType, input, metadata } = validatedData

    // Step 2: Get user information from session (for logging purposes)
    console.log('🔍 Extracting user information for AVV logging...')
    let userId: string | undefined
    let osId: string | undefined

    const sessionToken = request.cookies.get('onestep-session')?.value
    if (sessionToken) {
      try {
        const jwtSecret = process.env.JWT_SECRET
        if (jwtSecret) {
          const secret = new TextEncoder().encode(jwtSecret)
          const { payload } = await jwtVerify(sessionToken, secret)
          userId = payload.userId as string
          osId = payload.osId as string
          console.log('✅ User session verified for AVV check:', osId)
        }
      } catch (jwtError) {
        console.log('⚠️ Could not verify session for AVV check (proceeding anyway)')
        // Continue without user info - some AVV checks might be anonymous
      }
    }

    // Step 3: Initialize AVV check results
    let result: 'PASS' | 'FAIL' | 'WARNING' = 'PASS'
    let reason: string | undefined
    let avvMetadata: any = {}
    let score: number | undefined

    // Step 4: Run the specific AVV check based on type
    console.log(`🔍 Running AVV check: ${checkType}`)

    switch (checkType) {
      case 'PASSCODE_STRENGTH': {
        console.log('💪 Analyzing passcode strength...')
        
        // Run our passcode strength algorithm
        const strengthCheck = calculatePasscodeStrength(input)
        
        result = strengthCheck.isWeak ? 'FAIL' : 'PASS'
        reason = strengthCheck.isWeak ? strengthCheck.feedback.join(', ') : 'Passcode meets security requirements'
        score = strengthCheck.score
        avvMetadata = { 
          score: strengthCheck.score, 
          feedback: strengthCheck.feedback,
          hasSequential: /012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(input),
          hasRepeated: /(\d)\1{2,}/.test(input),
          uniqueDigits: new Set(input).size
        }
        
        console.log(`${result === 'PASS' ? '✅' : '❌'} Passcode strength: ${score}/100`)
        break
      }

      case 'PASSCODE_PERSONAL_DATA': {
        console.log('👤 Checking passcode against personal data...')
        
        // This check requires date of birth in metadata
        const dateOfBirth = metadata?.dateOfBirth
        if (!dateOfBirth) {
          result = 'WARNING'
          reason = 'Cannot check against personal data - date of birth not provided'
          console.log('⚠️ Date of birth not provided for personal data check')
        } else {
          const isDobRelated = isPasscodeRelatedToDob(input, dateOfBirth)
          result = isDobRelated ? 'FAIL' : 'PASS'
          reason = isDobRelated 
            ? 'Passcode appears to be related to your date of birth' 
            : 'Passcode is not related to your personal data'
          avvMetadata = { 
            hasDateOfBirth: true,
            dobRelated: isDobRelated,
            dobYear: new Date(dateOfBirth).getFullYear()
          }
          
          console.log(`${result === 'PASS' ? '✅' : '❌'} Personal data check: ${isDobRelated ? 'FAILED' : 'PASSED'}`)
        }
        break
      }

      case 'DEVICE_TRUST': {
        console.log('📱 Analyzing device trust level...')
        
        // Analyze device characteristics for trustworthiness
        const userAgent = request.headers.get('user-agent') || ''
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        
        // Basic device trust checks
        const isSuspiciousUserAgent = userAgent.includes('bot') || 
                                    userAgent.includes('crawler') || 
                                    userAgent.length < 20
        const isLocalHost = ipAddress.includes('127.0.0.1') || 
                           ipAddress.includes('localhost')
        
        // Calculate trust score
        let trustScore = 100
        if (isSuspiciousUserAgent) trustScore -= 30
        if (isLocalHost && process.env.NODE_ENV === 'production') trustScore -= 20
        if (userAgent.length < 50) trustScore -= 10
        
        result = trustScore >= 70 ? 'PASS' : trustScore >= 50 ? 'WARNING' : 'FAIL'
        reason = trustScore >= 70 
          ? 'Device appears trustworthy' 
          : trustScore >= 50 
            ? 'Device has some suspicious characteristics' 
            : 'Device appears suspicious'
            
        avvMetadata = { 
          trustScore,
          userAgent: userAgent.substring(0, 100), // Truncate for storage
          ipAddress: ipAddress.substring(0, 45), // IPv6 max length
          isSuspiciousUserAgent,
          isLocalHost
        }
        
        console.log(`${result === 'PASS' ? '✅' : result === 'WARNING' ? '⚠️' : '❌'} Device trust: ${trustScore}/100`)
        break
      }

      case 'BIOMETRIC_QUALITY': {
        console.log('🫁 Analyzing biometric data quality...')
        
        // This would analyze biometric enrollment quality
        // For now, we'll do basic validation
        try {
          const biometricData = JSON.parse(input)
          
          // Check if required fields are present
          const hasCredentialId = !!biometricData.credentialId
          const hasPublicKey = !!biometricData.publicKey
          const hasAuthenticatorData = !!biometricData.authenticatorData
          
          let qualityScore = 0
          if (hasCredentialId) qualityScore += 30
          if (hasPublicKey) qualityScore += 40
          if (hasAuthenticatorData) qualityScore += 30
          
          result = qualityScore >= 80 ? 'PASS' : qualityScore >= 60 ? 'WARNING' : 'FAIL'
          reason = qualityScore >= 80 
            ? 'Biometric data quality is good' 
            : qualityScore >= 60 
              ? 'Biometric data quality is acceptable but could be better' 
              : 'Biometric data quality is poor'
              
          avvMetadata = {
            qualityScore,
            hasCredentialId,
            hasPublicKey,
            hasAuthenticatorData,
            dataSize: input.length
          }
          
        } catch (parseError) {
          result = 'FAIL'
          reason = 'Invalid biometric data format'
          avvMetadata = { parseError: true }
        }
        
        console.log(`${result === 'PASS' ? '✅' : result === 'WARNING' ? '⚠️' : '❌'} Biometric quality check completed`)
        break
      }

      case 'BEHAVIORAL_PATTERN': {
        console.log('🎭 Analyzing behavioral patterns...')
        
        // This would analyze user behavior patterns for anomalies
        // For now, we'll do basic timing and pattern analysis
        const currentTime = Date.now()
        const inputLength = input.length
        const hasNumbers = /\d/.test(input)
        const hasLetters = /[a-zA-Z]/.test(input)
        
        // Simple behavioral scoring
        let behaviorScore = 50 // Start neutral
        if (inputLength >= 6 && inputLength <= 20) behaviorScore += 20
        if (hasNumbers && hasLetters) behaviorScore += 15
        if (metadata?.inputTime && metadata.inputTime < 30000) behaviorScore += 15 // Reasonable input time
        
        result = behaviorScore >= 70 ? 'PASS' : behaviorScore >= 50 ? 'WARNING' : 'FAIL'
        reason = behaviorScore >= 70 
          ? 'Behavioral pattern appears normal' 
          : behaviorScore >= 50 
            ? 'Some behavioral anomalies detected' 
            : 'Unusual behavioral pattern detected'
            
        avvMetadata = {
          behaviorScore,
          inputLength,
          hasNumbers,
          hasLetters,
          inputTime: metadata?.inputTime,
          timestamp: currentTime
        }
        
        console.log(`${result === 'PASS' ? '✅' : result === 'WARNING' ? '⚠️' : '❌'} Behavioral pattern: ${behaviorScore}/100`)
        break
      }

      default:
        console.log('❌ Unknown AVV check type:', checkType)
        result = 'WARNING'
        reason = 'AVV check type not implemented'
        avvMetadata = { checkType, implemented: false }
    }

    // Step 5: Log the AVV check result for monitoring and compliance
    if (userId) {
      console.log('📝 Logging AVV check result...')
      try {
        await logAvvCheck({
          userId,
          checkType,
          input: checkType.includes('PASSCODE') ? 'REDACTED' : input.substring(0, 100), // Redact sensitive data
          result,
          reason,
          metadata: avvMetadata
        })
        console.log('✅ AVV check logged successfully')
      } catch (logError) {
        console.error('⚠️ Failed to log AVV check (continuing anyway):', logError)
        // Don't fail the request if logging fails
      }
    } else {
      console.log('⚠️ No user session - AVV check not logged')
    }

    // Step 6: Return the AVV check result
    console.log(`🏁 AVV check completed: ${result} - ${reason}`)
    
    return NextResponse.json({
      result,
      reason,
      metadata: avvMetadata,
      checkType,
      timestamp: new Date().toISOString(),
      ...(score !== undefined && { score })
    })

  } catch (error) {
    console.error('❌ Unexpected error in AVV check:', error)

    // Handle different types of errors appropriately
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          result: 'FAIL',
          error: 'Invalid AVV request data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // For any other errors, return a safe response
    return NextResponse.json(
      { 
        result: 'FAIL',
        error: 'AVV check failed due to system error',
        reason: 'Internal error during security validation'
      },
      { status: 500 }
    )
  }
}