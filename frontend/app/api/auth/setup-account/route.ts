// app/api/auth/setup-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, isUsernameAvailable, logSecurityEvent } from '@/lib/db/prisma'
import { generateOsId, formatPhoneNumber, validateUsername } from '@/lib/utils/helpers'
import { SignJWT } from 'jose'

// Validation schema - must match frontend exactly
const setupAccountSchema = z.object({
  username: z.string()
    .min(6, 'Username must be at least 6 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      // Validate that it's a proper date and user is at least 13 years old
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 13
    }, 'You must be at least 13 years old'),
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  referralCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  console.log('🎯 Setup account API endpoint called')
  
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('📦 Request body received:', { 
        ...body, 
        // Don't log sensitive data in production
        phoneNumber: body.phoneNumber ? '[REDACTED]' : undefined 
      })
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate input data using Zod
    let validatedData
    try {
      validatedData = setupAccountSchema.parse(body)
      console.log('✅ Data validation passed')
    } catch (validationError) {
      console.error('❌ Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid input data', 
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
    }

    const { username, dateOfBirth, phoneNumber, referralCode } = validatedData

    // Additional username validation (custom business logic)
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      console.log('❌ Username validation failed:', usernameValidation.error)
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      )
    }

    // Check if username is available in database
    console.log('🔍 Checking username availability...')
    const isAvailable = await isUsernameAvailable(username)
    if (!isAvailable) {
      console.log('❌ Username already taken:', username)
      return NextResponse.json(
        { error: 'Username is already taken. Please choose a different one.' },
        { status: 409 }
      )
    }
    console.log('✅ Username is available')

    // Format and validate phone number
    console.log('📱 Formatting phone number...')
    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log('✅ Phone number formatted')

    // Check if phone number is already registered
    console.log('🔍 Checking if phone number is already registered...')
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone },
      select: { id: true, username: true }
    })

    if (existingUser) {
      console.log('❌ Phone number already registered')
      return NextResponse.json(
        { error: 'This phone number is already registered with another account.' },
        { status: 409 }
      )
    }
    console.log('✅ Phone number is available')

    // Generate unique OS-ID (keep trying until we get a unique one)
    console.log('🎲 Generating unique OS-ID...')
    let osId: string
    let attempts = 0
    do {
      osId = generateOsId()
      attempts++
      console.log(`📝 Attempt ${attempts}: Generated OS-ID: ${osId}`)
      
      // Prevent infinite loop - shouldn't happen but good safety measure
      if (attempts > 10) {
        console.error('❌ Failed to generate unique OS-ID after 10 attempts')
        throw new Error('Unable to generate unique OS-ID. Please try again.')
      }
      
      // Check if this OS-ID already exists
      const existingOsId = await prisma.user.findUnique({ 
        where: { osId },
        select: { id: true }
      })
      
      if (!existingOsId) {
        console.log('✅ Unique OS-ID generated successfully')
        break
      }
    } while (true)

    // Convert date string to Date object
    const birthDate = new Date(dateOfBirth)
    console.log('📅 Date of birth processed:', birthDate.toISOString())

    // Create user account in database
    console.log('💾 Creating user account in database...')
    try {
      const user = await prisma.user.create({
        data: {
          osId,
          username,
          phoneNumber: formattedPhone,
          dateOfBirth: birthDate,
          isVerified: true, // They completed OTP verification to get here
          // Note: firstName, lastName, email will be set later in profile completion
        },
        select: {
          id: true,
          osId: true,
          username: true,
          phoneNumber: true,
          createdAt: true
        }
      })
      
      console.log('✅ User created successfully:', {
        id: user.id,
        osId: user.osId,
        username: user.username
      })

      // Log security event for account creation
      const clientIp = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      const userAgent = request.headers.get('user-agent') || undefined

      await logSecurityEvent({
        userId: user.id,
        eventType: 'ACCOUNT_CREATED',
        description: 'New user account created successfully',
        metadata: { 
          username, 
          osId, 
          referralCode: referralCode || null,
          phoneNumber: '[REDACTED]' // Don't log sensitive data
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'LOW'
      })
      console.log('✅ Security event logged')

      // Create session token for the setup flow continuation
      console.log('🔑 Creating session token...')
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET environment variable not set')
        throw new Error('Server configuration error')
      }

      const secret = new TextEncoder().encode(jwtSecret)
      const sessionToken = await new SignJWT({
        userId: user.id,
        osId: user.osId,
        username: user.username,
        isSetupComplete: false // Still need passcode and biometric setup
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d') // 1 day for setup flow
      .setIssuedAt()
      .setSubject(user.id)
      .sign(secret)

      console.log('✅ Session token created')

      // Prepare success response
      const response = NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: {
          osId: user.osId,
          username: user.username,
          phoneNumber: user.phoneNumber
        }
      }, { status: 201 })

      // Set session cookie
      response.cookies.set('onestep-session', sessionToken, {
        httpOnly: true, // Prevent XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        maxAge: 24 * 60 * 60, // 1 day in seconds
        path: '/' // Available site-wide
      })

      console.log('✅ Account setup completed successfully')
      return response

    } catch (dbError) {
      console.error('❌ Database error during user creation:', dbError)
      
      // Check if it's a unique constraint violation
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'An account with this information already exists.' },
          { status: 409 }
        )
      }
      
      throw dbError // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('❌ Account setup error:', error)

    // Handle different types of errors appropriately
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    // For any other errors, return generic message to avoid exposing internals
    return NextResponse.json(
      { error: 'Account creation failed. Please try again.' },
      { status: 500 }
    )
  }
}