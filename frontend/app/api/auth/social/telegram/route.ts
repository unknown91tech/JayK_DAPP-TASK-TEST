import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateOsId } from '@/lib/utils/helpers'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()
    
    // Validate session token and get Telegram user data
    const telegramUserData = await validateTelegramSession(sessionToken)
    
    if (!telegramUserData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Find or create user
    let socialLogin = await prisma.socialLogin.findUnique({
      where: {
        provider_providerId: {
          provider: 'TELEGRAM',
          providerId: telegramUserData.id.toString()
        }
      },
      include: { user: true }
    })

    if (!socialLogin) {
      // Create new user and social login
      const osId = generateOsId()
      
      const user = await prisma.user.create({
        data: {
          osId,
          firstName: telegramUserData.firstName,
          lastName: telegramUserData.lastName,
          username: telegramUserData.username || `user_${osId.slice(-8)}`,
          isVerified: false,
          socialLogins: {
            create: {
              provider: 'TELEGRAM',
              providerId: telegramUserData.id.toString(),
              providerData: telegramUserData
            }
          }
        }
      })

      return NextResponse.json({ 
        success: true, 
        isNewUser: true,
        user: {
          osId: user.osId,
          firstName: user.firstName,
          isVerified: user.isVerified
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      isNewUser: false,
      user: {
        osId: socialLogin.user.osId,
        firstName: socialLogin.user.firstName,
        isVerified: socialLogin.user.isVerified
      }
    })

  } catch (error) {
    console.error('Telegram auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

async function validateTelegramSession(sessionToken: string) {
  // Implementation depends on how you store temporary sessions
  // Could be Redis, database, or in-memory store
  return null // Placeholder
}