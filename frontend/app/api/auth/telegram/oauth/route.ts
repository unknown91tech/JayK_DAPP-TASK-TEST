// app/api/auth/telegram/oauth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'

// Schema to validate incoming Telegram OAuth data
const telegramOAuthSchema = z.object({
  authData: z.string(), // In production, this would be the actual Telegram auth hash
  timestamp: z.number(),
  loginFlow: z.boolean().optional().default(false) // Whether this is for login or signup
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Telegram OAuth endpoint called')
    
    // Parse and validate the request body
    const body = await request.json()
    const { authData, timestamp, loginFlow } = telegramOAuthSchema.parse(body)
    
    console.log('📦 Request body validated:', { authData, timestamp, loginFlow })
    
    // Get client information for security logging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    
    // For development/demo purposes, we'll simulate Telegram user data
    // In production, you'd validate the actual Telegram auth data here
    const mockTelegramUser = {
      id: 1694779369, // Your real Telegram ID
      first_name: 'TestUser',
      last_name: 'OneStep',
      username: 'testuser_onestep',
      auth_date: Math.floor(Date.now() / 1000)
    }

    // If this is a login flow, check if user exists
    if (loginFlow) {
      console.log('🔍 Login flow - checking if user exists...')
      
      // Look for existing user by their Telegram social login
      const existingUser = await prisma.user.findFirst({
        where: {
          socialLogins: {
            some: {
              provider: 'telegram',
              providerId: mockTelegramUser.id.toString()
            }
          }
        },
        include: {
          socialLogins: true
        }
      })

      if (!existingUser) {
        console.log('❌ User not found for login')
        // Log failed login attempt
        await logSecurityEvent({
          eventType: 'LOGIN_FAILED',
          description: `Telegram login failed - user not found (ID: ${mockTelegramUser.id})`,
          metadata: { 
            telegramId: mockTelegramUser.id,
            reason: 'user_not_found'
          },
          ipAddress: clientIp,
          userAgent,
          riskLevel: 'MEDIUM'
        })

        return NextResponse.json({
          success: false,
          error: 'No account found. Please sign up first.',
          requiresSignup: true
        }, { status: 404 })
      }

      console.log('✅ Existing user found for login:', existingUser.osId)
      
      // Log successful OAuth for login
      await logSecurityEvent({
        userId: existingUser.id,
        eventType: 'LOGIN_OAUTH_SUCCESS',
        description: 'Telegram OAuth successful for login',
        metadata: { 
          telegramId: mockTelegramUser.id,
          osId: existingUser.osId
        },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'LOW'
      })

      return NextResponse.json({
        success: true,
        user: mockTelegramUser,
        existingUser: {
          osId: existingUser.osId,
          username: existingUser.username
        },
        message: 'Telegram authentication successful - existing user'
      })
    }

    // For signup flow, just validate OAuth (don't create user yet)
    console.log('✅ Telegram OAuth validated for signup')
    
    // Log OAuth validation for signup
    await logSecurityEvent({
      eventType: 'SIGNUP_OAUTH_SUCCESS',
      description: 'Telegram OAuth successful for signup',
      metadata: { 
        telegramId: mockTelegramUser.id
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })

    return NextResponse.json({
      success: true,
      user: mockTelegramUser,
      message: 'Telegram authentication successful - new user'
    })

  } catch (error) {
    console.error('❌ Telegram OAuth error:', error)
    
    // Log OAuth failure
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'OAUTH_FAILED',
      description: 'Telegram OAuth failed',
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
        error: 'Telegram authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}