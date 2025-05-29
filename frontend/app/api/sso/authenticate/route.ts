import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { findUserByOsId, createSsoSession, logSecurityEvent } from '@/lib/db/prisma'
import { generateSessionToken } from '@/lib/utils/helpers'

const ssoAuthSchema = z.object({
  osId: z.string().min(1, 'OS-ID is required'),
  dappId: z.string().min(1, 'dApp ID is required'),
  callbackUrl: z.string().url('Valid callback URL is required'),
  scope: z.array(z.string()).optional() // What data the dApp wants access to
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { osId, dappId, callbackUrl, scope = [] } = ssoAuthSchema.parse(body)
    
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined
    
    // Find user by OS-ID
    const user = await findUserByOsId(osId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid OS-ID' },
        { status: 404 }
      )
    }
    
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Account not verified' },
        { status: 403 }
      )
    }
    
    // Generate SSO session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Create SSO session record
    await createSsoSession({
      userId: user.id,
      osId: user.osId,
      dappId,
      sessionToken,
      expiresAt
    })
    
    // Log SSO authentication
    await logSecurityEvent({
      userId: user.id,
      eventType: 'SSO_AUTH',
      description: `SSO authentication for dApp: ${dappId}`,
      metadata: { dappId, scope, callbackUrl },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'LOW'
    })
    
    // Create JWT token for the dApp
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const dappToken = await new SignJWT({
      osId: user.osId,
      username: user.username,
      dappId,
      scope,
      sessionToken
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setIssuer('onestep-sso')
      .setAudience(dappId)
      .sign(secret)
    
    return NextResponse.json({
      success: true,
      token: dappToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        osId: user.osId,
        username: user.username,
        // Only include requested scope data
        ...(scope.includes('email') && { email: user.email }),
        ...(scope.includes('profile') && { 
          firstName: user.firstName, 
          lastName: user.lastName 
        })
      }
    })
    
  } catch (error) {
    console.error('SSO authentication error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'SSO authentication failed' },
      { status: 500 }
    )
  }
}