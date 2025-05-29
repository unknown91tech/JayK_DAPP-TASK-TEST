import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Telegram OAuth endpoint called')
    
    // For development, we'll simulate Telegram OAuth response
    // In production, you'd validate real Telegram auth data here
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    // Simulate successful Telegram user data
    const mockTelegramUser = {
      id: 1694779369,
      first_name: 'TestUser',
      last_name: 'OneStep',
      username: 'testuser_onestep',
      auth_date: Math.floor(Date.now() / 1000)
    }

    console.log('✅ Simulated Telegram user:', mockTelegramUser)

    return NextResponse.json({
      success: true,
      user: mockTelegramUser,
      message: 'Telegram authentication successful'
    })

  } catch (error) {
    console.error('❌ Telegram OAuth error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Telegram authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}