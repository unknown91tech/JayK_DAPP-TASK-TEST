import crypto from 'crypto'
import TelegramBot from 'node-telegram-bot-api'

class SessionManager {
  private sessions: Map<string, { 
    user: TelegramBot.User, 
    createdAt: number 
  }> = new Map()

  // Session expiration time (15 minutes)
  private SESSION_EXPIRATION = 15 * 60 * 1000

  createSession(user: TelegramBot.User): string {
    // Clean up expired sessions
    this.cleanupExpiredSessions()

    // Generate a unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Store the session with creation timestamp
    this.sessions.set(sessionToken, {
      user,
      createdAt: Date.now()
    })

    return sessionToken
  }

  getSession(sessionToken: string): TelegramBot.User | null {
    const sessionEntry = this.sessions.get(sessionToken)

    // Check if session exists and is not expired
    if (sessionEntry && (Date.now() - sessionEntry.createdAt) < this.SESSION_EXPIRATION) {
      return sessionEntry.user
    }

    // Remove expired or invalid session
    this.sessions.delete(sessionToken)
    return null
  }

  private cleanupExpiredSessions() {
    const now = Date.now()
    for (const [token, session] of this.sessions.entries()) {
      if ((now - session.createdAt) >= this.SESSION_EXPIRATION) {
        this.sessions.delete(token)
      }
    }
  }
}

export const sessionManager = new SessionManager()