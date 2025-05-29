export const WELCOME_MESSAGE = {
  NEW_USER: (firstName: string) => `
🎉 *Welcome to OneStep, ${firstName}!*

OneStep is your secure gateway to Web3 and beyond. With multi-layered authentication including:

🔐 *Passcode Protection*
📱 *Biometric Authentication*
🆔 *Universal OneStep ID*
🛡️ *Advanced Security Monitoring*

Ready to get started? Choose an option below:
  `,
  
  RETURNING_USER: (firstName: string) => `
👋 *Welcome back, ${firstName}!*

Your OneStep account is ready. What would you like to do today?
  `
}

export const AUTH_MESSAGE = {
  GENERATE_LINK: `
🔐 *Authentication Link Generated*

Click the button below to securely authenticate with OneStep. This link will expire in 15 minutes for your security.

*Security Tips:*
• Only use this link on trusted devices
• Don't share this link with anyone
• The link works only once
  `
}

export const VERIFY_MESSAGE = {
  NOT_REGISTERED: `
❌ *Account Not Found*

You don't have a OneStep account yet. Create one to get started with secure authentication across all your favorite apps.
  `,
  
  NOT_VERIFIED: `
⚠️ *Account Verification Pending*

Your OneStep account needs verification to unlock all features:

*Missing:*
• ✅ Phone/Email verification
• 🆔 Identity verification (KYC)
• 🔐 Security setup

Complete verification to access premium features!
  `,
  
  PARTIAL_VERIFICATION: (kycStatus: string) => `
🔄 *Verification In Progress*

Your OneStep account status:
• ✅ Basic verification complete
• 🔄 Identity verification: ${kycStatus}

Complete your verification to unlock all features!
  `,
  
  FULLY_VERIFIED: (osId: string) => `
✅ *Fully Verified Account*

🎉 Your OneStep account is fully verified!

*Your OneStep ID:* \`${osId}\`

You can now:
• Access all OneStep features
• Use biometric authentication
• Connect unlimited dApps
• Enjoy premium support
  `
}

export const ERROR_MESSAGE = {
  GENERIC: '❌ Something went wrong. Please try again later.',
  RATE_LIMITED: '⏰ Too many requests. Please wait a moment and try again.',
  MAINTENANCE: '🔧 OneStep is under maintenance. Please try again in a few minutes.',
  INVALID_SESSION: '🔒 Your session has expired. Please start over with /start'
}

export const SUCCESS_MESSAGE = {
  AUTH_COMPLETE: '✅ Authentication successful! You can now close this chat.',
  VERIFICATION_STARTED: '🔄 Verification process started. Check your OneStep dashboard.',
  PROFILE_UPDATED: '✅ Your profile has been updated successfully.'
}