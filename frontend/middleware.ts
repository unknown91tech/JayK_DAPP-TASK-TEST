// middleware.ts - Enhanced middleware to handle signup->setup flow properly
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Define route patterns that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/verify-otp',
  '/help',
  '/privacy',
  '/terms',
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/verify-otp',
  '/api/auth/telegram/oauth',
  '/api/auth/telegram/send-otp',
  '/api/auth/telegram/setup',
  '/api/auth/telegram/webhook',
  '/api/auth/resend-otp',
  '/api/auth/webauthn/get-challenge',
  '/api/auth/webauthn/verify-assertion',
  '/api/sso/validate',
  '/api/telegram/setup',
  '/api/telegram/webhook',
  '/setup-account',
  '/api/auth/setup-account',
]

// Routes that allow incomplete setup (for user account creation flow)
const setupRoutes = [
  '/setup-account',
  '/setup-passcode', 
  '/biometrics',
  '/complete-profile',
  '/api/auth/setup-account',
  '/api/auth/passcode/create',
  '/api/security/avv'
]

// Special login routes that need special handling
const loginRoutes = [
  '/api/auth/passcode/verify', // Allow passcode verification during login
  '/api/auth/session' // Allow session checks but handle incomplete setup gracefully
]

// Protected dashboard routes that require complete setup
const protectedRoutes = [
  '/dashboard',
  '/api/user/profile',
  '/api/user/devices',
  '/api/user/os-id',
  '/api/kyc/submit',
  '/api/kyc/status'
]

// Function to check if a path matches any pattern in an array
function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    // Exact match
    if (pathname === route) return true
    
    // Pattern match for API routes (e.g., /api/auth/* matches /api/auth/anything)
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2)
      return pathname.startsWith(baseRoute)
    }
    
    return false
  })
}

// Function to verify JWT token and extract user info
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
    const { payload } = await jwtVerify(token, secret)
    
    return {
      userId: payload.userId as string,
      osId: payload.osId as string,
      username: payload.username as string,
      isSetupComplete: payload.isSetupComplete as boolean,
      isVerified: payload.isVerified as boolean
    }
  } catch (error) {
    console.log('❌ Token verification failed:', error)
    return null
  }
}

// Helper function to check if username exists in the client-side localStorage
// Note: This is a workaround since middleware runs on server-side
function shouldRedirectToSetup(user: any, request: NextRequest): boolean {
  // Primary check: JWT token indicates setup is incomplete
  if (!user.isSetupComplete) {
    return true
  }
  
  // Secondary check: Username not set in JWT (indicates incomplete setup)
  if (!user.username || user.username === '' || user.username === 'User') {
    return true
  }
  
  // If all checks pass, setup is complete
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔒 Middleware checking:', pathname)
  
  // Allow all public routes without any authentication
  if (matchesRoutes(pathname, publicRoutes)) {
    console.log('✅ Public route allowed:', pathname)
    return NextResponse.next()
  }
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('onestep-session')?.value
  
  if (!sessionToken) {
    console.log('❌ No session token found for protected route:', pathname)
    
    // If accessing an API route without auth, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Verify the session token
  console.log('🔍 Checking authentication for:', pathname)
  console.log('🍪 Session token found, verifying...')
  
  const user = await verifyToken(sessionToken)
  
  if (!user) {
    console.log('❌ Invalid session token')
    
    // Clear the invalid cookie
    const response = pathname.startsWith('/api/') 
      ? NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    
    response.cookies.set('onestep-session', '', { maxAge: 0 })
    return response
  }
  
  console.log('✅ Token verified for user:', user.osId)
  console.log('🏁 Setup complete:', user.isSetupComplete)
  console.log('👤 Username:', user.username)
  
  // Special handling for login routes (passcode verification, session checks)
  if (matchesRoutes(pathname, loginRoutes)) {
    console.log('🔑 Login route detected, checking special conditions...')
    
    // Check if this is a login flow (indicated by special header)
    const isLoginFlow = request.headers.get('x-login-flow') === 'true'
    
    if (pathname === '/api/auth/passcode/verify' && isLoginFlow) {
      console.log('🔐 Allowing passcode verification for login flow')
      // Add user info to headers for the API route to use
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.userId)
      response.headers.set('x-os-id', user.osId)
      response.headers.set('x-username', user.username || '')
      return response
    }
    
    if (pathname === '/api/auth/session') {
      console.log('🔍 Session check - returning user data regardless of setup status')
      // Always allow session checks and return current user status
      return NextResponse.next()
    }
  }
  
  // Handle setup routes - allow if user is authenticated but setup incomplete
  if (matchesRoutes(pathname, setupRoutes)) {
    console.log('⚙️ Setup route detected')
    
    // Check if user needs setup based on our improved logic
    const needsSetup = shouldRedirectToSetup(user, request)
    
    if (needsSetup) {
      console.log('✅ Allowing access to setup route for incomplete user')
      // Add user info to headers for setup API routes
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.userId)
      response.headers.set('x-os-id', user.osId)
      response.headers.set('x-username', user.username || '')
      response.headers.set('x-setup-required', 'true')
      return response
    } else {
      console.log('🔄 Setup complete, redirecting to dashboard')
      // If setup is complete, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Handle protected routes - require complete setup
  if (matchesRoutes(pathname, protectedRoutes) || pathname.startsWith('/dashboard')) {
    const needsSetup = shouldRedirectToSetup(user, request)
    
    if (needsSetup) {
      console.log('⚠️ User needs setup, redirecting to setup flow')
      
      // For API routes, return 403 with setup required message
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ 
          error: 'Account setup required',
          redirectTo: '/setup-account',
          setupComplete: false,
          reason: 'Username or profile incomplete'
        }, { status: 403 })
      }
      
      // For page routes, redirect to setup
      return NextResponse.redirect(new URL('/setup-account', request.url))
    }
    
    console.log('✅ Full access granted to protected route')
    // Add user info to headers for protected API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.userId)
    response.headers.set('x-os-id', user.osId)
    response.headers.set('x-username', user.username || '')
    response.headers.set('x-setup-complete', 'true')
    return response
  }
  
  // Default: allow the request to proceed
  console.log('✅ Request allowed by default')
  return NextResponse.next()
}

// Configure which routes this middleware should run on
export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}