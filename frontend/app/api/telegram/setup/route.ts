import { NextRequest, NextResponse } from 'next/server'
import { oneStepBot } from '@/lib/telegram/bot'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper authorization
    const authHeader = request.headers.get('authorization')
    const isAuthorized = authHeader === `Bearer ${process.env.ADMIN_SECRET}` || 
                        process.env.NODE_ENV === 'development'
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Setup webhook for production
    if (process.env.NODE_ENV === 'production') {
      await oneStepBot.setupWebhook()
      return NextResponse.json({ 
        message: 'Webhook setup complete',
        webhook_url: process.env.TELEGRAM_WEBHOOK_URL
      })
    } else {
      return NextResponse.json({ 
        message: 'Bot running in polling mode (development)',
        mode: 'polling'
      })
    }
    
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}