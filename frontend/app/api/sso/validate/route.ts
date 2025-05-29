import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { validateSsoSession, logSecurityEvent } from '@/lib/db/prisma'

const validateSsoSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  dappId: z.string().min(1, 'dApp ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, dappId } = validateSsoSchema.parse(body)
    
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'onestep-sso',
      audience: dappId
    })
    
    const tokenData = payload as {
      osId: string
      username: string
      dappId: string
      sessionToken: string
      scope: string[]
    }
    
    // Validate SSO session in database
    const session = await validateSsoSession(tokenData.sessionToken)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    // Log successful validation
    await logSecurityEvent({
      eventType: 'SSO_VALIDATE',
      description: `SSO token validated for dApp: ${dappId}`,
      metadata: { dappId, osId: tokenData.osId },
      ipAddress: clientIp,
      riskLevel: 'LOW'
    })
    
    return NextResponse.json({
      valid: true,
      osId: tokenData.osId,
      username: tokenData.username,
      scope: tokenData.scope,
      expiresAt: session.expiresAt
    })
    
  } catch (error) {
    console.error('SSO validation error:', error)
    
    // Log failed validation attempt
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      eventType: 'SSO_VALIDATE_FAILED',
      description: 'SSO token validation failed',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      ipAddress: clientIp,
      riskLevel: 'MEDIUM'
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { valid: false, error: 'Token validation failed' },
      { status: 401 }
    )
  }
}

