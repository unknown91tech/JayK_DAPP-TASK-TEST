import { NextRequest, NextResponse } from 'next/server'

// Generate a simple 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store OTP temporarily (in production, use your database)
const otpStore = new Map<string, { code: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramUserId, firstName, identifier } = body

    console.log('📱 Sending OTP to Telegram user:', { telegramUserId, firstName, identifier })

    if (!telegramUserId || !identifier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = Date.now() + (10 * 60 * 1000) // 10 minutes from now

    // Store OTP temporarily
    otpStore.set(identifier, { code: otpCode, expiresAt })

    // Send via Telegram Bot API using your real Telegram ID
    let telegramSent = false
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '7688298767:AAF5j5qJnAjdbyaC1UQZDliBdRmd16aPAuM'

    if (botToken) {
      try {
        // Beautiful OTP message for your Telegram
        const telegramMessage = `🔐 *OneStep Authentication*\n\n` +
          `Hi there! 👋\n\n` +
          `Your verification code is: \`${otpCode}\`\n\n` +
          `⏰ This code expires in 10 minutes\n` +
          `🔒 Keep this code secure and don't share it\n\n` +
          `✨ Welcome to OneStep Authentication!`
        
        console.log('📤 Sending to Telegram chat ID:', telegramUserId)
        console.log('📝 Message:', telegramMessage)
        
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramUserId, // This will be 1694779369
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        })

        const telegramResult = await telegramResponse.json()
        console.log('📋 Telegram API response:', telegramResult)
        
        if (telegramResult.ok) {
          console.log('✅ OTP sent via Telegram successfully!')
          telegramSent = true
        } else {
          console.log('⚠️ Telegram API error:', telegramResult)
          // Log the specific error for debugging
          if (telegramResult.error_code) {
            console.log(`❌ Telegram Error ${telegramResult.error_code}: ${telegramResult.description}`)
          }
        }
      } catch (telegramError) {
        console.log('⚠️ Telegram sending failed:', telegramError)
      }
    } else {
      console.log('⚠️ No Telegram bot token found')
    }

    // Always log the OTP to console for development
    console.log('🔑 DEVELOPMENT OTP CODE:', otpCode)
    console.log('📧 OTP stored for identifier:', identifier)
    console.log('⏰ OTP expires at:', new Date(expiresAt).toLocaleString())

    return NextResponse.json({
      success: true,
      message: telegramSent 
        ? 'OTP sent via Telegram successfully! Check your Telegram chat.' 
        : 'OTP generated successfully (check console)',
      expiresAt: new Date(expiresAt).toISOString(),
      telegramSent,
      // In development, return the OTP for easy testing
      ...(process.env.NODE_ENV === 'development' && { devOTP: otpCode })
    })

  } catch (error) {
    console.error('❌ Send OTP error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send OTP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}