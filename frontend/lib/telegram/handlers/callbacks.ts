import TelegramBot from 'node-telegram-bot-api'
import { generateProfileKeyboard } from '../utils/keyboards'
import { SUCCESS_MESSAGE, ERROR_MESSAGE } from '../utils/messages'
import { sessionManager } from '../utils/session'
import { prisma } from '@/lib/db/prisma'

type KycStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export async function handleAuthCallback(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id
  const user = callbackQuery.from
  const data = callbackQuery.data

  if (!chatId || !user) return

  try {
    await bot.answerCallbackQuery(callbackQuery.id)

    if (data === 'auth_signup') {
      // Create auth session for signup
      const sessionToken = sessionManager.createSession(user)
      const signupUrl = `${process.env.NEXTAUTH_URL}/signup?telegram_session=${sessionToken}`

      await bot.editMessageText(
        '🚀 *Create Your OneStep Account*\n\nClick the button below to create your secure OneStep account. This link expires in 15 minutes.',
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Create Account',
                  url: signupUrl
                }
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'back_to_menu'
                }
              ]
            ]
          }
        }
      )

    } else if (data === 'auth_login') {
      // Create auth session for login
      const sessionToken = sessionManager.createSession(user)
      const loginUrl = `${process.env.NEXTAUTH_URL}/login?telegram_session=${sessionToken}`

      await bot.editMessageText(
        '🔐 *Sign In to OneStep*\n\nClick the button below to securely sign in to your OneStep account. This link expires in 15 minutes.',
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🔐 Sign In',
                  url: loginUrl
                }
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'back_to_menu'
                }
              ]
            ]
          }
        }
      )

    } else if (data === 'download_app') {
      await bot.editMessageText(
        '📱 *OneStep Mobile Apps*\n\nGet OneStep on your mobile device for the best experience:\n\n🍎 **iOS App** - Coming Soon to App Store\n🤖 **Android App** - Coming Soon to Google Play\n\n💻 **Web Version** - Available now at onestep.com',
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🌐 Open Web Version',
                  url: process.env.NEXTAUTH_URL!
                }
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'back_to_menu'
                }
              ]
            ]
          }
        }
      )

    } else if (data === 'about_onestep') {
      await bot.editMessageText(
        '🛡️ *About OneStep Authentication*\n\nOneStep is a revolutionary multi-layered authentication system that provides:\n\n🔐 **Multiple Auth Methods**\n• 6-digit passcodes\n• Biometric authentication (Touch/Face ID)\n• Social login integration\n\n🆔 **Universal OneStep ID**\n• Single identity across all apps\n• Secure SSO for Web3 & traditional apps\n\n🛡️ **Advanced Security**\n• Auto-verification system (AVV)\n• Device management (up to 5 devices)\n• Real-time security monitoring\n\n📱 **User-Friendly**\n• Beautiful dark theme interface\n• Mobile-first design\n• 24/7 support',
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Get Started',
                  callback_data: 'auth_signup'
                }
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'back_to_menu'
                }
              ]
            ]
          }
        }
      )
    }

  } catch (error) {
    console.error('Auth callback error:', error)
    await bot.sendMessage(chatId, ERROR_MESSAGE.GENERIC)
  }
}

export async function handleVerifyCallback(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id
  const user = callbackQuery.from
  const data = callbackQuery.data

  if (!chatId || !user) return

  try {
    await bot.answerCallbackQuery(callbackQuery.id)

    if (data === 'verify_start') {
      // Create session for verification
      const sessionToken = sessionManager.createSession(user)
      const verifyUrl = `${process.env.NEXTAUTH_URL}/complete-profile?telegram_session=${sessionToken}`

      await bot.editMessageText(
        '✅ *Complete Your Verification*\n\nTo unlock all OneStep features, complete your identity verification:\n\n📋 **What you\'ll need:**\n• Government-issued ID\n• Phone number verification\n• Selfie photo\n\nThe process takes about 5 minutes and is completely secure.',
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Start Verification',
                  url: verifyUrl
                }
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'back_to_menu'
                }
              ]
            ]
          }
        }
      )

    } else if (data === 'verify_status') {
      // Check verification status
      await checkVerificationStatus(bot, chatId, user, callbackQuery.message?.message_id)
    }

  } catch (error) {
    console.error('Verify callback error:', error)
    await bot.sendMessage(chatId, ERROR_MESSAGE.GENERIC)
  }
}


async function checkVerificationStatus(bot: TelegramBot, chatId: number, user: TelegramBot.User, messageId?: number) {
  try {
    const socialLogin = await prisma.socialLogin.findFirst({
      where: {
        provider: 'TELEGRAM',
        providerId: user.id.toString()
      },
      include: {
        user: true
      }
    })

    if (!socialLogin) {
      // ... existing code for no user found
      return
    }

    const user_data = socialLogin.user
    
    // Type-safe status emoji mapping
    const statusEmoji: Record<KycStatus, string> = {
      'PENDING': '⏳',
      'IN_PROGRESS': '🔄',
      'APPROVED': '✅',
      'REJECTED': '❌',
      'EXPIRED': '⏰'
    }

    // Type assertion or safe access
    const kycStatus = user_data.kycStatus as KycStatus
    const kycStatusEmoji = statusEmoji[kycStatus] || '❓'

    const message = `
📊 **Your OneStep Status**

🆔 **OneStep ID:** \`${user_data.osId}\`
${user_data.isVerified ? '✅' : '⏳'} **Account Verified:** ${user_data.isVerified ? 'Yes' : 'Pending'}
${kycStatusEmoji} **Identity Verification:** ${user_data.kycStatus}

${user_data.kycStatus === 'APPROVED' ? 
  '🎉 **Congratulations!** Your account is fully verified and ready to use.' :
  '📋 Complete your verification to unlock all features.'
}
    `

    const keyboard = user_data.kycStatus === 'APPROVED' ? 
      generateProfileKeyboard(user_data.osId) :
      {
        inline_keyboard: [
          [{ text: '✅ Complete Verification', callback_data: 'verify_start' }],
          [{ text: '🔙 Back to Menu', callback_data: 'back_to_menu' }]
        ]
      }

    if (messageId) {
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    } else {
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    }

  } catch (error) {
    console.error('Status check error:', error)
    await bot.sendMessage(chatId, ERROR_MESSAGE.GENERIC)
  }
}