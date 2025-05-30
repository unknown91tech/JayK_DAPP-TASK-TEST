// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/verify-otp',
  '/help',
  '/terms',
  '/privacy',
  '/recovery',
  '/dashboard',
  '/setup-account',
  '/setup-password',
  '/biometrics',
]

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/telegram/send-otp',
  '/api/auth/telegram/oauth',
  '/api/auth/social/telegram',
  '/api/auth/webauthn/get-challenge',
  '/api/auth/webauthn/verify-assertion',
  '/api/auth/setup-account',
  '/api/security/avv',
  '/api/auth/passcode/create',

  // SSO validation endpoints (they have their own auth)
  '/api/sso/validate'
]

// Routes that are part of the setup flow (partially authenticated)
const setupRoutes = [
  '/setup-account',
  '/setup-passcode',
  '/biometrics',
  '/complete-profile'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔒 Middleware checking:', pathname)
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    console.log('✅ Public route allowed:', pathname)
    return NextResponse.next()
  }

  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    console.log('✅ Public API route allowed:', pathname)
    return NextResponse.next()
  }
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') // Allow files with extensions
  ) {
    console.log('✅ Static file allowed:', pathname)
    return NextResponse.next()
  }
  
  console.log('🔍 Checking authentication for:', pathname)
  
  // Get the session token from cookies or headers
  const sessionToken = request.cookies.get('onestep-session')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!sessionToken) {
    console.log('❌ No session token found for:', pathname)
    // No session token, redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  console.log('🎟️ Session token found, verifying...')
  
  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
    const { payload } = await jwtVerify(sessionToken, secret)
    
    const user = payload as {
      userId: string
      osId: string
      username?: string
      isSetupComplete?: boolean
      isVerified?: boolean
    }
    
    console.log('✅ Token verified for user:', user.osId)
    console.log('🔧 Setup complete:', user.isSetupComplete)
    
    // Check if user needs to complete setup (only for new users)
    if (user.isSetupComplete === false && !setupRoutes.includes(pathname)) {
      console.log('⚠️ User needs setup, redirecting to setup flow')
      // User hasn't completed setup, redirect to setup flow
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Setup required' },
          { status: 403 }
        )
      }
      
      return NextResponse.redirect(new URL('/setup-account', request.url))
    }
    
    // Check if completed user is trying to access setup routes
    if (user.isSetupComplete === true && setupRoutes.includes(pathname)) {
      console.log('✅ Setup complete, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-os-id', user.osId)
    if (user.username) {
      requestHeaders.set('x-username', user.username)
    }
    
    console.log('✅ Authentication successful, proceeding to:', pathname)
    
    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
    
  } catch (error) {
    console.error('❌ JWT verification failed:', error)
    
    // Invalid token, clear it and redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Clear the invalid cookie
    response.cookies.delete('onestep-session')
    return response
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}