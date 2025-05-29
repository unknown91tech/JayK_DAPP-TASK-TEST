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
  '/recovery'
]

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/social/telegram',
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
  
  // Allow public routes
  if (publicRoutes.includes(pathname) || publicApiRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }
  
  // Get the session token from cookies or headers
  const sessionToken = request.cookies.get('onestep-session')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!sessionToken) {
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
  
  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(sessionToken, secret)
    
    const user = payload as {
      userId: string
      osId: string
      username?: string
      isSetupComplete?: boolean
    }
    
    // Check if user needs to complete setup
    if (!user.isSetupComplete && !setupRoutes.includes(pathname)) {
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
    if (user.isSetupComplete && setupRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-os-id', user.osId)
    if (user.username) {
      requestHeaders.set('x-username', user.username)
    }
    
    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
    
  } catch (error) {
    // Invalid token, clear it and redirect to login
    console.error('JWT verification failed:', error)
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const response = NextResponse.redirect(new URL('/login', request.url))
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