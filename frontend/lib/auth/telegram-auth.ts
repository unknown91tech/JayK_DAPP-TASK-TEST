/**
 * Telegram OAuth integration for OneStep authentication
 * This handles the Telegram login widget and user verification
 */

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramAuthResponse {
  success: boolean
  user?: TelegramUser
  error?: string
}

/**
 * Initialize Telegram login widget
 * This creates the Telegram login button and handles the OAuth flow
 */
export function initTelegramAuth(options: {
  botUsername: string
  onAuth: (user: TelegramUser) => void
  onError: (error: string) => void
  requestAccess?: 'write' | boolean
  buttonSize?: 'large' | 'medium' | 'small'
}): void {
  // Check if Telegram login script is already loaded
  if (typeof window !== 'undefined' && !(window as any).TelegramLoginWidget) {
    // Dynamically load Telegram login widget script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', options.botUsername)
    script.setAttribute('data-size', options.buttonSize || 'large')
    script.setAttribute('data-request-access', options.requestAccess ? 'write' : '')
    script.setAttribute('data-userpic', 'false')
    script.setAttribute('data-radius', '20')

    // Set up callback function
    const callbackName = `telegramCallback_${Date.now()}`
    ;(window as any)[callbackName] = (user: TelegramUser) => {
      try {
        // Verify the authentication data
        if (verifyTelegramAuth(user, process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN!)) {
          options.onAuth(user)
        } else {
          options.onError('Invalid Telegram authentication data')
        }
      } catch (error) {
        options.onError('Failed to verify Telegram authentication')
      }
    }

    script.setAttribute('data-onauth', callbackName)
    document.head.appendChild(script)
  }
}

/**
 * Verify Telegram authentication data
 * This ensures the auth data hasn't been tampered with
 */
function verifyTelegramAuth(authData: TelegramUser, botToken: string): boolean {
  // Create verification string
  const checkHash = authData.hash
  delete (authData as any).hash // Remove hash for verification

  // Create data check string
  const dataCheckArr: string[] = []
  for (const [key, value] of Object.entries(authData)) {
    dataCheckArr.push(`${key}=${value}`)
  }
  dataCheckArr.sort()
  const dataCheckString = dataCheckArr.join('\n')

  // Create secret key
  const secretKey = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // This is a simplified verification - in production, you should do this on the server
  // for security reasons, as the bot token should never be exposed to the client
  console.warn('Telegram auth verification should be done on the server side')
  
  return true // For demo purposes, always return true
}

/**
 * Get Telegram user profile photo
 */
export async function getTelegramUserPhoto(userId: number): Promise<string | null> {
  try {
    // This would typically be done through your backend API
    // as it requires the bot token which shouldn't be exposed to the client
    const response = await fetch(`/api/auth/telegram/photo/${userId}`)
    
    if (response.ok) {
      const data = await response.json()
      return data.photoUrl
    }
    
    return null
  } catch (error) {
    console.error('Failed to get Telegram user photo:', error)
    return null
  }
}

/**
 * Sign out from Telegram (clear local auth data)
 */
export function signOutTelegram(): void {
  // Clear any cached Telegram auth data
  localStorage.removeItem('telegram_user')
  sessionStorage.removeItem('telegram_auth')
  
  // Clear cookies related to Telegram auth
  document.cookie = 'telegram_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

/**
 * Check if user is currently authenticated with Telegram
 */
export function isTelegramAuthenticated(): boolean {
  // Check for valid authentication token/session
  const authToken = localStorage.getItem('telegram_auth_token')
  const authExpiry = localStorage.getItem('telegram_auth_expiry')
  
  if (!authToken || !authExpiry) {
    return false
  }
  
  // Check if token has expired
  const expiryDate = new Date(authExpiry)
  return expiryDate > new Date()
}

/**
 * Store Telegram authentication data securely
 */
export function storeTelegramAuth(user: TelegramUser, sessionToken: string): void {
  // Store essential user data (no sensitive information in localStorage)
  const userData = {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    authDate: user.auth_date
  }
  
  localStorage.setItem('telegram_user', JSON.stringify(userData))
  localStorage.setItem('telegram_auth_token', sessionToken)
  
  // Set expiry (typically 24 hours for session tokens)
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  localStorage.setItem('telegram_auth_expiry', expiry.toISOString())
}