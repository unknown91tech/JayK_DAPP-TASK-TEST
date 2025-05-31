// app/api/auth/telegram/send-login-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'
import crypto from 'crypto'

// Schema to validate incoming login OTP request data
const loginOTPSchema = z.object({
  telegramUserId: z.number(),
  firstName: z.string().optional().default('User'),
  identifier: z.string(), // telegram_<user_id>
  purpose: z.literal('LOGIN') // Only allow LOGIN purpose for this endpoint
})

// Function to send Telegram message (same as signup)
async function sendTelegramMessage(chatId: number, message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    console.log('❌ TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    console.log(`📤 Attempting to send Telegram message to chat ${chatId}`)
    
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    })

    const result = await response.json()
    
    if (response.ok && result.ok) {
      console.log('✅ Telegram message sent successfully')
      return true
    } else {
      console.error('❌ Telegram API error:', result)
      return false
    }
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login OTP endpoint called')
    
    // Parse and validate the request body
    const body = await request.json()
    const { telegramUserId, firstName, identifier, purpose } = loginOTPSchema.parse(body)
    
    console.log('📦 Login OTP request validated:', { telegramUserId, firstName, identifier, purpose })
    
    // Get client information for security logging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    
    // Step 1: Verify that user exists in the database
    console.log('🔍 Step 1: Checking if user exists for login...')
    const existingUser = await prisma.user.findFirst({
      where: {
        socialLogins: {
          some: {
            provider: 'telegram',
            providerId: telegramUserId.toString()
          }
        }
      },
      include: {
        socialLogins: true
      }
    })

    if (!existingUser) {
      console.log('❌ User not found for login OTP request')
      
      // Log failed login attempt
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: `Login OTP request failed - user not found (Telegram ID: ${telegramUserId})`,
        metadata: { 
          telegramId: telegramUserId,
          identifier,
          reason: 'user_not_found',
          step: 'otp_request'
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'MEDIUM'
      })

      return NextResponse.json({
        success: false,
        error: 'Account not found. Please sign up first.',
        requiresSignup: true
      }, { status: 404 })
    }

    console.log('✅ User found for login:', { osId: existingUser.osId, username: existingUser.username })

    // Step 2: Generate OTP for login
    const otpCode = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    console.log('🔢 Generated login OTP:', otpCode)

    // Step 3: Store or update OTP in database
    await prisma.oTP.upsert({
      where: { identifier },
      update: {
        code: otpCode,
        expiresAt,
        attempts: 0, // Reset attempts for new OTP
        purpose: 'LOGIN',
        userId: existingUser.id // Link to existing user
      },
      create: {
        identifier,
        code: otpCode,
        expiresAt,
        attempts: 0,
        purpose: 'LOGIN',
        userId: existingUser.id // Link to existing user
      }
    })

    console.log('💾 Login OTP stored in database')

    // Step 4: Send OTP via Telegram
    let telegramSent = false
    const loginMessage = `🔐 <b>OneStep Login Verification</b>

Hello ${firstName}! 👋

Your login verification code is: <b>${otpCode}</b>

⏰ This code expires in 10 minutes
🔒 Use this code to log into your OneStep account

If you didn't request this login, please ignore this message.

<i>OneStep Security Team</i>`

    if (process.env.NODE_ENV === 'production' || process.env.SEND_TELEGRAM_IN_DEV === 'true') {
      telegramSent = await sendTelegramMessage(telegramUserId, loginMessage)
    } else {
      console.log('📱 Development mode - Telegram message not sent')
      console.log('📝 Message that would be sent:', loginMessage)
    }

    // Step 5: Log successful OTP generation for login
    await logSecurityEvent({
      userId: existingUser.id,
      eventType: 'LOGIN_OTP_SENT',
      description: `Login OTP sent for user ${existingUser.username}`,
      metadata: { 
        telegramId: telegramUserId,
        identifier,
        osId: existingUser.osId,
        username: existingUser.username,
        telegramSent,
        otpLength: otpCode.length
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })

    // Step 6: Return success response
    const response = {
      success: true,
      message: telegramSent 
        ? 'Login verification code sent to your Telegram' 
        : 'Login verification code generated',
      telegramSent,
      identifier,
      expiresIn: 600, // 10 minutes in seconds
      user: {
        osId: existingUser.osId,
        username: existingUser.username,
        isSetupComplete: existingUser.isSetupComplete
      },
      // Include OTP in development for easier testing
      ...(process.env.NODE_ENV === 'development' && { devOTP: otpCode })
    }

    console.log('✅ Login OTP process completed successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Login OTP error:', error)
    
    // Log OTP failure
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'LOGIN_OTP_FAILED',
      description: 'Login OTP generation failed',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'HIGH'
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send login verification code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}