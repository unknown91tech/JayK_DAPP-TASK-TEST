import TelegramBot from 'node-telegram-bot-api'
import { generateAuthKeyboard, generateVerifyKeyboard } from '../utils/keyboards'
import { WELCOME_MESSAGE, AUTH_MESSAGE, VERIFY_MESSAGE } from '../utils/messages'
import { generateOsId } from '@/lib/utils/helpers'
import { prisma } from '@/lib/db/prisma'

export async function handleStartCommand(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id
  const user = msg.from
  
  if (!user) return

  try {
    // Check if user already exists in our database
    let existingUser = await prisma.socialLogin.findUnique({
      where: {
        provider_providerId: {
          provider: 'TELEGRAM',
          providerId: user.id.toString()
        }
      },
      include: {
        user: true
      }
    })

    if (existingUser) {
      // Existing user - welcome back
      await bot.sendMessage(chatId, WELCOME_MESSAGE.RETURNING_USER(user.first_name), {
        parse_mode: 'Markdown',
        reply_markup: generateAuthKeyboard()
      })
    } else {
      // New user - show welcome and setup
      await bot.sendMessage(chatId, WELCOME_MESSAGE.NEW_USER(user.first_name), {
        parse_mode: 'Markdown',
        reply_markup: generateAuthKeyboard(true) // Show signup option
      })
    }

  } catch (error) {
    console.error('Error in start command:', error)
    await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later.')
  }
}

export async function handleAuthCommand(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id
  const user = msg.from
  
  if (!user) return

  try {
    // Generate authentication session
    const authSession = await generateAuthSession(user)
    
    await bot.sendMessage(chatId, AUTH_MESSAGE.GENERATE_LINK, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🔐 Open OneStep',
            url: `${process.env.NEXTAUTH_URL}/auth/telegram?session=${authSession.token}`
          }
        ], [
          {
            text: '📱 Get Mobile App',
            callback_data: 'download_app'
          }
        ]]
      }
    })

  } catch (error) {
    console.error('Error in auth command:', error)
    await bot.sendMessage(chatId, '❌ Authentication failed. Please try again.')
  }
}

export async function handleVerifyCommand(msg: TelegramBot.Message, bot: TelegramBot) {
  const chatId = msg.chat.id
  const user = msg.from
  
  if (!user) return

  try {
    // Check user's verification status
    const socialLogin = await prisma.socialLogin.findUnique({
      where: {
        provider_providerId: {
          provider: 'TELEGRAM',
          providerId: user.id.toString()
        }
      },
      include: {
        user: true
      }
    })

    if (!socialLogin) {
      await bot.sendMessage(chatId, VERIFY_MESSAGE.NOT_REGISTERED, {
        parse_mode: 'Markdown',
        reply_markup: generateAuthKeyboard(true)
      })
      return
    }

    const verificationStatus = getVerificationStatus(socialLogin.user)
    
    await bot.sendMessage(chatId, verificationStatus.message, {
      parse_mode: 'Markdown',
      reply_markup: verificationStatus.keyboard
    })

  } catch (error) {
    console.error('Error in verify command:', error)
    await bot.sendMessage(chatId, '❌ Verification check failed. Please try again.')
  }
}

// Helper function to generate auth session
async function generateAuthSession(telegramUser: TelegramBot.User) {
  const sessionToken = generateOsId() // Generate unique session token
  
  // Store session temporarily (15 minutes expiry)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  
  // You might want to store this in Redis or database
  // For now, we'll use a simple approach
  
  return {
    token: sessionToken,
    telegramId: telegramUser.id,
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name,
    username: telegramUser.username,
    expiresAt
  }
}

// Helper function to get verification status
function getVerificationStatus(user: any) {
  if (!user.isVerified) {
    return {
      message: VERIFY_MESSAGE.NOT_VERIFIED,
      keyboard: generateVerifyKeyboard()
    }
  }

  if (user.kycStatus === 'APPROVED') {
    return {
      message: VERIFY_MESSAGE.FULLY_VERIFIED(user.osId),
      keyboard: {
        inline_keyboard: [[
          {
            text: '📊 View Dashboard',
            url: `${process.env.NEXTAUTH_URL}/dashboard`
          }
        ]]
      }
    }
  }

  return {
    message: VERIFY_MESSAGE.PARTIAL_VERIFICATION(user.kycStatus),
    keyboard: generateVerifyKeyboard()
  }
}