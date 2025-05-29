import { NextRequest, NextResponse } from 'next/server'
import { oneStepBot } from '@/lib/telegram/bot'
import { createHmac } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    const secretToken = process.env.TELEGRAM_SECRET_TOKEN
    const receivedToken = request.headers.get('x-telegram-bot-api-secret-token')
    
    if (secretToken && receivedToken !== secretToken) {
      console.error('Invalid secret token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the update from Telegram
    const update = await request.json()
    
    // Process the update through our bot
    await oneStepBot.handleWebhookUpdate(update)
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Telegram will only send POST requests
export async function GET() {
  return NextResponse.json({ 
    message: 'OneStep Telegram Bot Webhook',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}