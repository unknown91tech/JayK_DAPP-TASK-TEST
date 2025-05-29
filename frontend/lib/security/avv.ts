// lib/security/avv.ts
/**
 * Auto-Verification & Validation (AVV) System
 * This system automatically validates user inputs and behaviors to detect fraud,
 * ensure security compliance, and maintain system integrity
 */

// Types for AVV checks
export type AVVCheckType = 
  | 'PASSCODE_STRENGTH'
  | 'PASSCODE_PERSONAL_DATA'
  | 'BIOMETRIC_QUALITY'
  | 'DEVICE_TRUST'
  | 'BEHAVIORAL_PATTERN'
  | 'IP_REPUTATION'
  | 'LOGIN_FREQUENCY'
  | 'DEVICE_FINGERPRINT'

export type AVVResult = 'PASS' | 'FAIL' | 'WARNING'

export interface AVVCheckResult {
  result: AVVResult
  score: number // 0-100, higher is better
  reason?: string
  recommendations?: string[]
  metadata?: any
}

/**
 * Main AVV check function - routes to specific validators
 */
export async function performAVVCheck(
  checkType: AVVCheckType, 
  input: any, 
  context?: any
): Promise<AVVCheckResult> {
  switch (checkType) {
    case 'PASSCODE_STRENGTH':
      return checkPasscodeStrength(input)
    
    case 'PASSCODE_PERSONAL_DATA':
      return checkPasscodePersonalData(input, context?.userProfile)
    
    case 'BIOMETRIC_QUALITY':
      return checkBiometricQuality(input)
    
    case 'DEVICE_TRUST':
      return checkDeviceTrust(input, context?.knownDevices)
    
    case 'BEHAVIORAL_PATTERN':
      return checkBehavioralPattern(input, context?.userHistory)
    
    case 'IP_REPUTATION':
      return checkIPReputation(input)
    
    case 'LOGIN_FREQUENCY':
      return checkLoginFrequency(input, context?.recentLogins)
    
    case 'DEVICE_FINGERPRINT':
      return checkDeviceFingerprint(input, context?.trustedFingerprints)
    
    default:
      return {
        result: 'WARNING',
        score: 50,
        reason: 'Unknown AVV check type'
      }
  }
}

/**
 * Check passcode strength using multiple criteria
 */
function checkPasscodeStrength(passcode: string): AVVCheckResult {
  const results = {
    result: 'PASS' as AVVResult,
    score: 0,
    recommendations: [] as string[]
  }

  // Length check
  if (passcode.length >= 6) {
    results.score += 20
  } else {
    results.recommendations.push('Use at least 6 digits')
  }

  // Pattern detection
  const patterns = {
    allSame: /^(\d)\1+$/.test(passcode), // 111111
    sequential: /012345|123456|234567|345678|456789|567890/.test(passcode), // 123456
    reverseSequential: /987654|876543|765432|654321|543210|432109/.test(passcode), // 654321
    repeating: /(\d{2,})\1/.test(passcode), // 123123
    keyboard: /147258|159357|246810|369258/.test(passcode) // keyboard patterns
  }

  if (!Object.values(patterns).some(Boolean)) {
    results.score += 30
  } else {
    results.recommendations.push('Avoid predictable patterns')
  }

  // Digit variety
  const uniqueDigits = new Set(passcode.split(''))
  if (uniqueDigits.size >= 4) {
    results.score += 25
  } else if (uniqueDigits.size >= 2) {
    results.score += 15
  } else {
    results.recommendations.push('Use different digits')
  }

  // Common weak passcodes
  const commonWeak = [
    '000000', '111111', '123456', '654321', '000001', '123123',
    '696969', '121212', '112233', '102030', '123321', '666666'
  ]
  
  if (!commonWeak.includes(passcode)) {
    results.score += 25
  } else {
    results.recommendations.push('This passcode is too common')
  }

  // Determine result based on score
  if (results.score >= 80) {
    results.result = 'PASS'
  } else if (results.score >= 60) {
    results.result = 'WARNING'
  } else {
    results.result = 'FAIL'
  }

  return results
}

/**
 * Check if passcode is related to personal data
 */
function checkPasscodePersonalData(
  passcode: string, 
  userProfile?: {
    dateOfBirth?: string
    phoneNumber?: string
    username?: string
  }
): AVVCheckResult {
  const results = {
    result: 'PASS' as AVVResult,
    score: 100,
    recommendations: [] as string[]
  }

  if (!userProfile) {
    return results
  }

  // Check date of birth patterns
  if (userProfile.dateOfBirth) {
    const dob = new Date(userProfile.dateOfBirth)
    const day = dob.getDate().toString().padStart(2, '0')
    const month = (dob.getMonth() + 1).toString().padStart(2, '0')
    const year = dob.getFullYear().toString()
    const shortYear = year.slice(-2)

    const dobPatterns = [
      day + month,           // DDMM
      month + day,           // MMDD
      day + month + shortYear, // DDMMYY
      month + day + shortYear, // MMDDYY
      shortYear + month + day, // YYMMDD
      day + shortYear,       // DDYY
      month + shortYear,     // MMYY
    ]

    if (dobPatterns.some(pattern => passcode.includes(pattern))) {
      results.result = 'FAIL'
      results.score = 0
      results.recommendations.push('Passcode cannot contain your birth date')
    }
  }

  // Check phone number patterns
  if (userProfile.phoneNumber) {
    const phoneDigits = userProfile.phoneNumber.replace(/\D/g, '')
    // Check for consecutive digits from phone number
    for (let i = 0; i <= phoneDigits.length - 4; i++) {
      const phoneSegment = phoneDigits.substring(i, i + 4)
      if (passcode.includes(phoneSegment)) {
        results.result = 'FAIL'
        results.score = 0
        results.recommendations.push('Passcode cannot contain phone number digits')
        break
      }
    }
  }

  return results
}

/**
 * Check biometric authentication quality
 */
function checkBiometricQuality(biometricData: {
  authenticatorData?: string
  clientDataJSON?: string
  signature?: string
}): AVVCheckResult {
  const results = {
    result: 'PASS' as AVVResult,
    score: 100,
    metadata: {}
  }

  // In a real implementation, you would:
  // 1. Verify the biometric signature
  // 2. Check the authenticator attestation
  // 3. Validate the challenge response
  // 4. Ensure user presence and verification flags are set

  if (!biometricData.signature) {
    results.result = 'FAIL'
    results.score = 0
    return results
  }

  // Simulate biometric quality checks
  results.metadata = {
    userPresent: true,
    userVerified: true,
    attestationType: 'platform'
  }

  return results
}

/**
 * Check device trust level
 */
function checkDeviceTrust(
  deviceInfo: {
    fingerprint: string
    userAgent: string
    ipAddress: string
  },
  knownDevices?: Array<{ fingerprint: string; trusted: boolean }>
): AVVCheckResult {
  const results = {
    result: 'WARNING' as AVVResult,
    score: 50,
    recommendations: [] as string[]
  }

  // Check if device is known
  const knownDevice = knownDevices?.find(d => d.fingerprint === deviceInfo.fingerprint)
  if (knownDevice) {
    results.score = knownDevice.trusted ? 90 : 30
    results.result = knownDevice.trusted ? 'PASS' : 'WARNING'
  }

  // Analyze user agent for suspicious patterns
  const suspiciousUA = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /headless/i, /phantom/i, /selenium/i
  ]

  if (suspiciousUA.some(pattern => pattern.test(deviceInfo.userAgent))) {
    results.result = 'FAIL'
    results.score = 0
    results.recommendations.push('Suspicious browser detected')
  }

  // Basic user agent validation
  if (deviceInfo.userAgent.length < 20 || !deviceInfo.userAgent.includes('Mozilla')) {
    results.score -= 20
    results.recommendations.push('Unusual browser signature')
  }

  return results
}

/**
 * Check behavioral patterns for anomalies
 */
function checkBehavioralPattern(
  currentBehavior: {
    loginTime: string
    typingPattern?: number[]
    mouseMovements?: Array<{ x: number; y: number; timestamp: number }>
  },
  userHistory?: Array<{
    loginTime: string
    success: boolean
    location?: string
  }>
): AVVCheckResult {
  const results = {
    result: 'PASS' as AVVResult,
    score: 80,
    recommendations: [] as string[]
  }

  if (!userHistory || userHistory.length < 5) {
    // Not enough data for behavioral analysis
    return results
  }

  // Analyze login timing patterns
  const currentHour = new Date(currentBehavior.loginTime).getHours()
  const historicalHours = userHistory.map(h => new Date(h.loginTime).getHours())
  
  // Check if current login time is unusual
  const hourCounts = historicalHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const currentHourCount = hourCounts[currentHour] || 0
  const averageHourCount = Object.values(hourCounts).reduce((a, b) => a + b, 0) / 24

  if (currentHourCount < averageHourCount * 0.1) {
    results.score -= 15
    results.recommendations.push('Unusual login time detected')
  }

  // Check for failed login attempts
  const recentFailures = userHistory
    .filter(h => !h.success)
    .filter(h => new Date(h.loginTime) > new Date(Date.now() - 24 * 60 * 60 * 1000))

  if (recentFailures.length > 3) {
    results.result = 'WARNING'
    results.score -= 20
    results.recommendations.push('Multiple recent failed attempts')
  }

  return results
}

/**
 * Check IP address reputation
 */
async function checkIPReputation(ipAddress: string): Promise<AVVCheckResult> {
  const results = {
    result: 'PASS' as AVVResult,
    score: 80,
    metadata: {}
  }

  // Check for private/local IPs
  const privateRanges = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^127\./,
    /^::1$/,
    /^fe80:/
  ]

  if (privateRanges.some(range => range.test(ipAddress))) {
    results.metadata = { type: 'private' }
    return results
  }

  // In a real implementation, you would check against:
  // - IP reputation databases (like AbuseIPDB, VirusTotal)
  // - VPN/Proxy detection services
  // - Geolocation services for impossible travel detection
  // - Your own blocklist/allowlist

  // Simulate IP reputation check
  results.metadata = {
    country: 'US',
    region: 'California',
    city: 'San Francisco',
    isp: 'Example ISP',
    threat_score: 0
  }

  return results
}

/**
 * Check login frequency for rate limiting
 */
function checkLoginFrequency(
  currentAttempt: { timestamp: string; ipAddress: string },
  recentLogins?: Array<{ timestamp: string; ipAddress: string; success: boolean }>
): AVVCheckResult {
  const results = {
    result: 'PASS' as AVVResult,
    score: 100,
    recommendations: [] as string[]
  }

  if (!recentLogins) {
    return results
  }

  const now = new Date(currentAttempt.timestamp)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check attempts from same IP in last hour
  const recentFromIP = recentLogins.filter(login => 
    login.ipAddress === currentAttempt.ipAddress &&
    new Date(login.timestamp) > oneHourAgo
  )

  if (recentFromIP.length > 10) {
    results.result = 'FAIL'
    results.score = 0
    results.recommendations.push('Too many attempts from this IP')
  } else if (recentFromIP.length > 5) {
    results.result = 'WARNING'
    results.score = 40
    results.recommendations.push('High frequency login attempts')
  }

  // Check failed attempts in last 24 hours
  const failedAttempts = recentLogins.filter(login =>
    !login.success &&
    new Date(login.timestamp) > oneDayAgo
  )

  if (failedAttempts.length > 20) {
    results.result = 'FAIL'
    results.score = 0
    results.recommendations.push('Too many failed attempts')
  }

  return results
}

/**
 * Check device fingerprint against trusted devices
 */
function checkDeviceFingerprint(
  fingerprint: string,
  trustedFingerprints?: string[]
): AVVCheckResult {
  const results = {
    result: 'WARNING' as AVVResult,
    score: 50,
    recommendations: [] as string[]
  }

  if (trustedFingerprints?.includes(fingerprint)) {
    results.result = 'PASS'
    results.score = 95
  } else {
    results.recommendations.push('New device detected - please verify')
  }

  return results
}

/**
 * Batch AVV checks for comprehensive validation
 */
export async function performBatchAVVChecks(
  checks: Array<{
    type: AVVCheckType
    input: any
    context?: any
  }>
): Promise<{
  overallResult: AVVResult
  overallScore: number
  individualResults: Record<string, AVVCheckResult>
  recommendations: string[]
}> {
  const individualResults: Record<string, AVVCheckResult> = {}
  const recommendations: string[] = []
  let totalScore = 0
  let criticalFailures = 0

  // Run all checks
  for (const check of checks) {
    const result = await performAVVCheck(check.type, check.input, check.context)
    individualResults[check.type] = result
    totalScore += result.score
    
    if (result.result === 'FAIL') {
      criticalFailures++
    }
    
    if (result.recommendations) {
      recommendations.push(...result.recommendations)
    }
  }

  // Calculate overall result
  const averageScore = totalScore / checks.length
  let overallResult: AVVResult = 'PASS'

  if (criticalFailures > 0) {
    overallResult = 'FAIL'
  } else if (averageScore < 70) {
    overallResult = 'WARNING'
  }

  return {
    overallResult,
    overallScore: averageScore,
    individualResults,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  }
}