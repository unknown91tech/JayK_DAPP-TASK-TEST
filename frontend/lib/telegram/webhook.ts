import TelegramBot from 'node-telegram-bot-api'
import { handleAuthCommand, handleStartCommand, handleVerifyCommand } from './handlers/commands'
import { handleAuthCallback, handleVerifyCallback } from './handlers/callbacks'

class OneStepBot {
  private bot: TelegramBot
  private isWebhook: boolean

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN!
    this.isWebhook = process.env.NODE_ENV === 'production'
    
    // Create bot instance
    this.bot = new TelegramBot(token, {
      polling: !this.isWebhook, // Use polling in development
      webHook: this.isWebhook   // Use webhook in production
    })

    this.setupHandlers()
  }

  private setupHandlers() {
    // Command handlers
    this.bot.onText(/\/start/, handleStartCommand)
    this.bot.onText(/\/auth/, handleAuthCommand)
    this.bot.onText(/\/verify/, handleVerifyCommand)
    this.bot.onText(/\/help/, this.handleHelp.bind(this))

    // Callback query handlers (inline buttons)
    this.bot.on('callback_query', (callbackQuery) => {
      const data = callbackQuery.data
      
      if (data?.startsWith('auth_')) {
        handleAuthCallback(this.bot, callbackQuery)
      } else if (data?.startsWith('verify_')) {
        handleVerifyCallback(this.bot, callbackQuery)
      }
    })

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error)
    })
  }

  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id
    
    const helpText = `
 *OneStep Authentication Bot*

Available commands:
• /start - Get started with OneStep
• /auth - Generate authentication link
• /verify - Verify your identity
• /profile - View your profile
• /help - Show this help message

*About OneStep:*
OneStep provides secure multi-layered authentication for Web3 and traditional apps. Use this bot to authenticate securely across all supported platforms.

Need help? Visit our help center: https://help.onestep.com
    `

    await this.bot.sendMessage(chatId, helpText, {
      parse_mode: 'Markdown'
    })
  }

  // Method to handle webhook updates
  public async handleWebhookUpdate(update: any) {
    if (this.isWebhook) {
      this.bot.processUpdate(update)
    }
  }

  // Setup webhook (call this once in production)
  public async setupWebhook() {
    if (this.isWebhook) {
      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL!
      const secretToken = process.env.TELEGRAM_SECRET_TOKEN!
      
      await this.bot.setWebHook(webhookUrl, {
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true
      })
      
      console.log('✅ Telegram webhook set up successfully')
    }
  }

  public getBotInstance() {
    return this.bot
  }
}

// Export singleton instance
export const oneStepBot = new OneStepBot()
export default oneStepBot