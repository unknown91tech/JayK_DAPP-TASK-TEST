/**
 * Telegram Bot Integration for OneStep Authentication
 * This handles sending OTP codes via Telegram bot
 */

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

interface TelegramBotMessage {
  chat_id: number
  text: string
  parse_mode?: 'HTML' | 'Markdown'
}

class TelegramBot {
  private botToken: string
  private baseUrl: string

  constructor(botToken: string) {
    this.botToken = botToken
    this.baseUrl = `https://api.telegram.org/bot${botToken}`
  }

  /**
   * Send OTP code to user via Telegram
   */
  async sendOTP(chatId: number, otpCode: string, firstName: string): Promise<boolean> {
    const message: TelegramBotMessage = {
      chat_id: chatId,
      text: `🔐 OneStep Authentication

Hi there! 👋

Your verification code is: <code>${otpCode}</code>

⏰ This code expires in 10 minutes
🔒 Keep this code secure and don't share it

✨ Welcome to OneStep Authentication!`,
      parse_mode: 'HTML'
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })

      const result = await response.json()
      
      if (result.ok) {
        console.log('✅ OTP sent successfully to Telegram user:', chatId)
        return true
      } else {
        console.error('❌ Failed to send OTP:', result)
        return false
      }
    } catch (error) {
      console.error('❌ Telegram API error:', error)
      return false
    }
  }

  /**
   * Get bot information (for testing)
   */
  async getBotInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/getMe`)
      const result = await response.json()
      return result
    } catch (error) {
      console.error('❌ Failed to get bot info:', error)
      return null
    }
  }

  /**
   * Set webhook for receiving messages (optional for development)
   */
  async setWebhook(webhookUrl: string) {
    try {
      const response = await fetch(`${this.baseUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message']
        })
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('❌ Failed to set webhook:', error)
      return null
    }
  }
}

// Export singleton instance
export const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!)