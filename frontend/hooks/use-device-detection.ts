// hooks/use-device-detection.ts
'use client'

import { useState, useEffect } from 'react'

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  os: string
  browser: string
  fingerprint: string
  screenResolution: string
  timezone: string
  language: string
}

/**
 * Hook for detecting device information and generating fingerprints
 */
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detectDevice = () => {
      try {
        const userAgent = navigator.userAgent.toLowerCase()
        
        // Detect device type
        let type: DeviceInfo['type'] = 'unknown'
        if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
          type = 'mobile'
        } else if (/tablet|ipad/i.test(userAgent)) {
          type = 'tablet'
        } else if (/desktop|windows|macintosh|linux/i.test(userAgent)) {
          type = 'desktop'
        }

        // Detect OS
        let os = 'Unknown'
        if (userAgent.includes('windows')) {
          os = 'Windows'
        } else if (userAgent.includes('mac')) {
          os = 'macOS'
        } else if (userAgent.includes('linux')) {
          os = 'Linux'
        } else if (userAgent.includes('android')) {
          os = 'Android'
        } else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
          os = 'iOS'
        }

        // Detect browser
        let browser = 'Unknown'
        if (userAgent.includes('chrome')) {
          browser = 'Chrome'
        } else if (userAgent.includes('firefox')) {
          browser = 'Firefox'
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          browser = 'Safari'
        } else if (userAgent.includes('edge')) {
          browser = 'Edge'
        } else if (userAgent.includes('opera')) {
          browser = 'Opera'
        }

        // Generate device fingerprint
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.textBaseline = 'top'
          ctx.font = '14px Arial'
          ctx.fillText('OneStep Device Fingerprint', 2, 2)
        }

        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width + 'x' + screen.height,
          new Date().getTimezoneOffset(),
          canvas.toDataURL(),
          navigator.hardwareConcurrency || 'unknown',
          navigator.deviceMemory || 'unknown'
        ].join('|')

        // Simple hash function for fingerprint
        let hash = 0
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convert to 32-bit integer
        }

        const deviceData: DeviceInfo = {
          type,
          os,
          browser,
          fingerprint: Math.abs(hash).toString(36),
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        }

        setDeviceInfo(deviceData)
        setLoading(false)
      } catch (error) {
        console.error('Device detection failed:', error)
        setLoading(false)
      }
    }

    detectDevice()
  }, [])

  return { deviceInfo, loading }
}