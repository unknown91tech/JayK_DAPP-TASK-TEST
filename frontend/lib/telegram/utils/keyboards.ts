import { InlineKeyboardMarkup } from 'node-telegram-bot-api'

export function generateAuthKeyboard(isNewUser = false): InlineKeyboardMarkup {
  const keyboard = []

  if (isNewUser) {
    keyboard.push([
      {
        text: '🚀 Create OneStep Account',
        callback_data: 'auth_signup'
      }
    ])
  }

  keyboard.push([
    {
      text: '🔐 Sign In to OneStep',
      callback_data: 'auth_login'
    }
  ])

  keyboard.push([
    {
      text: '📱 Download Mobile App',
      callback_data: 'download_app'
    },
    {
      text: '❓ What is OneStep?',
      callback_data: 'about_onestep'
    }
  ])

  return { inline_keyboard: keyboard }
}

export function generateVerifyKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: '✅ Complete Verification',
          callback_data: 'verify_start'
        }
      ],
      [
        {
          text: '📋 Check Status',
          callback_data: 'verify_status'
        },
        {
          text: '❓ Need Help?',
          url: `${process.env.NEXTAUTH_URL}/help`
        }
      ]
    ]
  }
}

export function generateProfileKeyboard(osId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: '📊 View Dashboard',
          url: `${process.env.NEXTAUTH_URL}/dashboard`
        }
      ],
      [
        {
          text: '🛡️ Security Settings',
          url: `${process.env.NEXTAUTH_URL}/dashboard/security`
        },
        {
          text: '📱 Manage Devices',
          url: `${process.env.NEXTAUTH_URL}/dashboard/devices`
        }
      ],
      [
        {
          text: '📋 Copy OneStep ID',
          callback_data: `copy_osid_${osId}`
        }
      ]
    ]
  }
}