// app/api/auth/passcode/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { prisma, logSecurityEvent, logAvvCheck } from '@/lib/db/prisma'
import { hashSensitiveData, calculatePasscodeStrength, isPasscodeRelatedToDob } from '@/lib/utils/helpers'

// Validation schema for the incoming request
const createPasscodeSchema = z.object({
  passcode: z.string()
    .length(6, 'Passcode must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Passcode must contain only numbers')
})

export async function POST(request: NextRequest) {
  console.log('🔐 Passcode creation API endpoint called')
  
  try {
    // Step 1: Parse and validate the request body
    let body
    try {
      body = await request.json()
      console.log('📦 Request body received (passcode redacted for security)')
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate the passcode format
    let validatedData
    try {
      validatedData = createPasscodeSchema.parse(body)
      console.log('✅ Passcode format validation passed')
    } catch (validationError) {
      console.error('❌ Passcode validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid passcode format', 
            details: validationError.errors.map(err => err.message)
          },
          { status: 400 }
        )
      }
    }

    const { passcode } = validatedData

    // Step 2: Get user information from the session cookie
    console.log('🔍 Extracting user information from session...')
    const sessionToken = request.cookies.get('onestep-session')?.value

    if (!sessionToken) {
      console.log('❌ No session token found')
      return NextResponse.json(
        { error: 'Authentication required. Please complete account setup first.' },
        { status: 401 }
      )
    }

    // Verify the JWT session token to get user info
    let userId: string, osId: string
    try {
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET environment variable not set')
        throw new Error('Server configuration error')
      }

      const secret = new TextEncoder().encode(jwtSecret)
      const { payload } = await jwtVerify(sessionToken, secret)
      
      userId = payload.userId as string
      osId = payload.osId as string
      
      console.log('✅ Session verified for user:', osId)
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError)
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    // Step 3: Get user details from database to check date of birth
    console.log('🔍 Fetching user details from database...')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        osId: true,
        dateOfBirth: true,
        passcodeHash: true // Check if user already has a passcode
      }
    })

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    // Check if user already has a passcode set up
    if (user.passcodeHash) {
      console.log('⚠️ User already has a passcode')
      return NextResponse.json(
        { error: 'Passcode already exists. Use the reset function to change it.' },
        { status: 409 }
      )
    }

    console.log('✅ User found, proceeding with passcode creation')

    // Step 4: Run AVV (Auto-Verification & Validation) security checks
    console.log('🛡️ Running AVV security checks...')

    // AVV Check 1: Passcode strength analysis
    console.log('🔍 AVV Check 1: Analyzing passcode strength...')
    const strengthCheck = calculatePasscodeStrength(passcode)
    
    // Log the strength check result for monitoring
    await logAvvCheck({
      userId,
      checkType: 'PASSCODE_STRENGTH',
      input: 'REDACTED', // Never log actual passcode for security
      result: strengthCheck.isWeak ? 'FAIL' : 'PASS',
      reason: strengthCheck.isWeak ? strengthCheck.feedback.join(', ') : undefined,
      metadata: { 
        score: strengthCheck.score,
        feedbackCount: strengthCheck.feedback.length
      }
    })

    if (strengthCheck.isWeak) {
      console.log('❌ Passcode strength check failed:', strengthCheck.feedback)
      return NextResponse.json({
        error: 'Passcode does not meet security requirements',
        feedback: strengthCheck.feedback,
        suggestions: [
          'Try using a mix of different numbers',
          'Avoid obvious patterns like 123456 or 111111',
          'Make sure it\'s not easily guessable'
        ]
      }, { status: 400 })
    }

    console.log('✅ Passcode strength check passed')

    // AVV Check 2: Check if passcode is related to personal data (date of birth)
    if (user.dateOfBirth) {
      console.log('🔍 AVV Check 2: Checking against date of birth...')
      const dobCheck = isPasscodeRelatedToDob(passcode, user.dateOfBirth.toISOString())
      
      // Log the DOB check result
      await logAvvCheck({
        userId,
        checkType: 'PASSCODE_PERSONAL_DATA',
        result: dobCheck ? 'FAIL' : 'PASS',
        reason: dobCheck ? 'Passcode appears to be related to date of birth' : undefined,
        metadata: { 
          hasDateOfBirth: true,
          dobYear: user.dateOfBirth.getFullYear()
        }
      })

      if (dobCheck) {
        console.log('❌ Passcode is related to date of birth')
        return NextResponse.json({
          error: 'Passcode cannot be related to your date of birth',
          suggestions: [
            'Try a completely different set of numbers',
            'Avoid using your birth year, month, or day',
            'Consider using a meaningful date that\'s not your birthday'
          ]
        }, { status: 400 })
      }

      console.log('✅ Passcode DOB check passed')
    } else {
      console.log('⚠️ No date of birth on file, skipping DOB check')
    }

    // Step 5: Hash the passcode securely before storing
    console.log('🔐 Hashing passcode for secure storage...')
    let hashedPasscode: string
    try {
      hashedPasscode = await hashSensitiveData(passcode)
      console.log('✅ Passcode hashed successfully')
    } catch (hashError) {
      console.error('❌ Failed to hash passcode:', hashError)
      return NextResponse.json(
        { error: 'Failed to secure passcode. Please try again.' },
        { status: 500 }
      )
    }

    // Step 6: Update user record with the hashed passcode
    console.log('💾 Storing hashed passcode in database...')
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          passcodeHash: hashedPasscode,
          // Mark user as closer to setup completion
          // Note: isSetupComplete will be set to true after biometric setup
        }
      })
      console.log('✅ Passcode stored successfully')
    } catch (dbError) {
      console.error('❌ Database error storing passcode:', dbError)
      return NextResponse.json(
        { error: 'Failed to save passcode. Please try again.' },
        { status: 500 }
      )
    }

    // Step 7: Log the successful passcode creation for security monitoring
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    await logSecurityEvent({
      userId,
      eventType: 'PASSCODE_SETUP',
      description: 'User successfully created their passcode',
      metadata: { 
        avvPassed: true,
        strengthScore: strengthCheck.score,
        osId: user.osId
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })

    console.log('✅ Security event logged')

    // Step 8: Return success response
    console.log('🎉 Passcode creation completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Passcode created successfully',
      nextStep: 'biometric_setup',
      metadata: {
        strengthScore: strengthCheck.score,
        avvChecksPassed: 2
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Unexpected error in passcode creation:', error)

    // Handle different types of errors appropriately
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // For any other errors, return generic message to avoid exposing internals
    return NextResponse.json(
      { error: 'Passcode creation failed. Please try again.' },
      { status: 500 }
    )
  }
}