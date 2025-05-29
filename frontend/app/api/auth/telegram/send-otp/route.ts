// app/api/auth/telegram/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Import the OTP store from the verify-otp route
// In production, this would be Redis or a database
const otpStore = new Map()

// Request validation schema
const sendOtpSchema = z.object({
  telegramUserId: z.number(),
  firstName: z.string(),
  identifier: z.string(),
  purpose: z.enum(['LOGIN', 'SIGNUP']).default('SIGNUP')
})

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via Telegram Bot API
async function sendTelegramOTP(telegramUserId: number, otp: string, purpose: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.log('⚠️ No Telegram bot token found, OTP will only be logged')
    return false
  }

  try {
    const message = purpose === 'LOGIN' 
      ? `🔐 Your OneStep login code is: *${otp}*\n\nThis code will expire in 10 minutes.\n\n_Never share this code with anyone!_`
      : `🎉 Welcome to OneStep!\n\nYour verification code is: *${otp}*\n\nThis code will expire in 10 minutes.\n\n_Never share this code with anyone!_`

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    const data = await response.json()
    
    if (data.ok) {
      console.log('✅ Telegram OTP sent successfully to user:', telegramUserId)
      return true
    } else {
      console.log('❌ Telegram API error:', data.description)
      return false
    }
  } catch (error) {
    console.error('❌ Failed to send Telegram OTP:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📱 Telegram OTP request:', body)
    
    const { telegramUserId, firstName, identifier, purpose } = sendOtpSchema.parse(body)
    
    // Generate OTP
    const otp = generateOTP()
    console.log(`🔢 Generated OTP: ${otp} for ${identifier} (${purpose})`)
    
    // Store OTP with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    const otpData = {
      code: otp,
      purpose,
      expiresAt,
      attempts: 0,
      telegramUserId,
      firstName
    }
    
    otpStore.set(identifier, otpData)
    console.log('💾 OTP stored for identifier:', identifier)
    
    // Try to send via Telegram
    const telegramSent = await sendTelegramOTP(telegramUserId, otp, purpose)
    
    // Prepare response
    const response = {
      success: true,
      message: telegramSent 
        ? `${purpose === 'LOGIN' ? 'Login' : 'Verification'} code sent to your Telegram`
        : `${purpose === 'LOGIN' ? 'Login' : 'Verification'} code generated`,
      telegramSent,
      expiresAt: expiresAt.toISOString()
    }
    
    // In development, include the OTP for easier testing
    if (process.env.NODE_ENV === 'development') {
      response.devOTP = otp
      console.log('🧪 Development mode - OTP included in response')
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Send OTP error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}

// Export the OTP store for use by other routes
export { otpStore }