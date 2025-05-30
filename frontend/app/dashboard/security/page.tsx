// app/dashboard/security/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Key, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Lock,
  Unlock,
  Activity,
  Settings,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'

interface SecurityEvent {
  id: string
  eventType: string
  description: string
  timestamp: string
  ipAddress: string
  deviceInfo: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface SecuritySettings {
  passcodeEnabled: boolean
  biometricsEnabled: boolean
  twoFactorEnabled: boolean
  sessionTimeout: number
  loginNotifications: boolean
  securityScore: number
}

export default function SecurityPage() {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passcodeEnabled: true,
    biometricsEnabled: false,
    twoFactorEnabled: true,
    sessionTimeout: 7,
    loginNotifications: true,
    securityScore: 98
  })
  
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasscodeChange, setShowPasscodeChange] = useState(false)
  const [changingPasscode, setChangingPasscode] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      // In a real app, these would be separate API calls
      // For now, we'll use mock data
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          eventType: 'LOGIN_SUCCESS',
          description: 'Successful login via Telegram',
          timestamp: new Date().toISOString(),
          ipAddress: '103.120.45.123',
          deviceInfo: 'Chrome on MacOS',
          riskLevel: 'LOW'
        },
        {
          id: '2',
          eventType: 'PASSCODE_CHANGE',
          description: 'Passcode updated successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.123',
          deviceInfo: 'Chrome on MacOS',
          riskLevel: 'LOW'
        },
        {
          id: '3',
          eventType: 'DEVICE_REGISTERED',
          description: 'New device registered: iPhone 15',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.124',
          deviceInfo: 'Safari on iOS',
          riskLevel: 'MEDIUM'
        }
      ]
      
      setRecentEvents(mockEvents)
    } catch (error) {
      console.error('Failed to fetch security data:', error)
      setMessage({ type: 'error', text: 'Failed to load security information' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasscodeChange = async (newPasscode: string) => {
    setChangingPasscode(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/passcode/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: newPasscode }),
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Passcode updated successfully!' })
        setShowPasscodeChange(false)
        await fetchSecurityData() // Refresh security events
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update passcode' })
      }
    } catch (error) {
      console.error('Failed to update passcode:', error)
      setMessage({ type: 'error', text: 'Failed to update passcode. Please try again.' })
    } finally {
      setChangingPasscode(false)
    }
  }

  const toggleSetting = async (setting: keyof SecuritySettings) => {
    const newValue = !securitySettings[setting]
    
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: newValue
    }))

    // In a real app, you'd make an API call here
    setMessage({ 
      type: 'success', 
      text: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${newValue ? 'enabled' : 'disabled'}` 
    })
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-status-success'
      case 'MEDIUM': return 'text-status-warning'
      case 'HIGH': return 'text-status-error'
      case 'CRITICAL': return 'text-red-600'
      default: return 'text-foreground-secondary'
    }
  }

  const getRiskLevelBg = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-status-success/10 border-status-success/20'
      case 'MEDIUM': return 'bg-status-warning/10 border-status-warning/20'
      case 'HIGH': return 'bg-status-error/10 border-status-error/20'
      case 'CRITICAL': return 'bg-red-500/10 border-red-500/20'
      default: return 'bg-background-tertiary border-border-primary'
    }
  }

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const days = Math.floor(diffInHours / 24)
    return `${days} days ago`
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-status-success'
    if (score >= 70) return 'text-status-warning'
    return 'text-status-error'
  }

  const getSecurityRecommendations = () => {
    const recommendations = []
    
    if (!securitySettings.biometricsEnabled) {
      recommendations.push({
        title: 'Enable Biometric Authentication',
        description: 'Add Touch ID or Face ID for faster, more secure access',
        action: () => toggleSetting('biometricsEnabled'),
        priority: 'HIGH'
      })
    }
    
    if (securitySettings.sessionTimeout > 7) {
      recommendations.push({
        title: 'Reduce Session Timeout',
        description: 'Shorter sessions improve security',
        action: () => {},
        priority: 'MEDIUM'
      })
    }

    return recommendations
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-primary">Security Center</h1>
          <p className="text-foreground-secondary">Monitor and manage your account security settings</p>
        </div>
        
        <Button variant="secondary" className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export Security Report</span>
        </Button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-status-success/10 border-status-success/20 text-status-success' 
            : 'bg-status-error/10 border-status-error/20 text-status-error'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Security Score Overview */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-2">Security Score</h3>
            <p className="text-foreground-secondary">
              Your overall account security rating based on enabled features
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-4xl font-bold mb-1 ${getSecurityScoreColor(securitySettings.securityScore)}`}>
              {securitySettings.securityScore}%
            </div>
            <div className="text-sm text-foreground-secondary">Excellent</div>
          </div>
        </div>

        {/* Security Score Breakdown */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              securitySettings.passcodeEnabled ? 'bg-status-success/10' : 'bg-status-error/10'
            }`}>
              <Key className={`w-5 h-5 ${
                securitySettings.passcodeEnabled ? 'text-status-success' : 'text-status-error'
              }`} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground-primary">Passcode</div>
              <div className={`text-xs ${securitySettings.passcodeEnabled ? 'text-status-success' : 'text-status-error'}`}>
                {securitySettings.passcodeEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              securitySettings.biometricsEnabled ? 'bg-status-success/10' : 'bg-status-warning/10'
            }`}>
              <Fingerprint className={`w-5 h-5 ${
                securitySettings.biometricsEnabled ? 'text-status-success' : 'text-status-warning'
              }`} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground-primary">Biometrics</div>
              <div className={`text-xs ${securitySettings.biometricsEnabled ? 'text-status-success' : 'text-status-warning'}`}>
                {securitySettings.biometricsEnabled ? 'Enabled' : 'Not Set'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              securitySettings.twoFactorEnabled ? 'bg-status-success/10' : 'bg-status-error/10'
            }`}>
              <Shield className={`w-5 h-5 ${
                securitySettings.twoFactorEnabled ? 'text-status-success' : 'text-status-error'
              }`} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground-primary">2FA</div>
              <div className={`text-xs ${securitySettings.twoFactorEnabled ? 'text-status-success' : 'text-status-error'}`}>
                {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-status-success/10">
              <Activity className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground-primary">Monitoring</div>
              <div className="text-xs text-status-success">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <h3 className="text-lg font-semibold text-foreground-primary mb-6">Security Settings</h3>
        
        <div className="space-y-6">
          {/* Passcode Settings */}
          <div className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground-primary">OneStep Passcode</h4>
                <p className="text-sm text-foreground-secondary">6-digit passcode for account access</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-status-success">Enabled</span>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowPasscodeChange(true)}
              >
                Change
              </Button>
            </div>
          </div>

          {/* Biometric Settings */}
          <div className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground-primary">Biometric Authentication</h4>
                <p className="text-sm text-foreground-secondary">Touch ID, Face ID, or fingerprint login</p>
              </div>
            </div>
            
            <button
              onClick={() => toggleSetting('biometricsEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
                securitySettings.biometricsEnabled ? 'bg-accent-primary' : 'bg-background-tertiary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.biometricsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground-primary">Two-Factor Authentication</h4>
                <p className="text-sm text-foreground-secondary">Telegram-based verification codes</p>
              </div>
            </div>
            
            <button
              onClick={() => toggleSetting('twoFactorEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
                securitySettings.twoFactorEnabled ? 'bg-accent-primary' : 'bg-background-tertiary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Login Notifications */}
          <div className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground-primary">Login Notifications</h4>
                <p className="text-sm text-foreground-secondary">Get notified of new login attempts</p>
              </div>
            </div>
            
            <button
              onClick={() => toggleSetting('loginNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
                securitySettings.loginNotifications ? 'bg-accent-primary' : 'bg-background-tertiary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Change Passcode Modal */}
      {showPasscodeChange && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">Change Passcode</h3>
          
          <div className="space-y-6">
            <p className="text-sm text-foreground-secondary">
              Enter your new 6-digit passcode. It must not be related to your date of birth.
            </p>
            
            <div className="flex justify-center">
              <PasscodeInput
                onComplete={handlePasscodeChange}
                loading={changingPasscode}
                error={false}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPasscodeChange(false)
                  setMessage(null)
                }}
                disabled={changingPasscode}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Security Events */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground-primary">Recent Security Events</h3>
          <Button variant="ghost" size="sm">
            View All Events
          </Button>
        </div>

        <div className="space-y-4">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-start space-x-4 p-4 bg-background-tertiary/50 rounded-xl">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getRiskLevelBg(event.riskLevel)}`}>
                {event.eventType.includes('LOGIN') && <Lock className="w-5 h-5" />}
                {event.eventType.includes('PASSCODE') && <Key className="w-5 h-5" />}
                {event.eventType.includes('DEVICE') && <Smartphone className="w-5 h-5" />}
                {!event.eventType.includes('LOGIN') && !event.eventType.includes('PASSCODE') && !event.eventType.includes('DEVICE') && (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground-primary">{event.description}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-foreground-tertiary">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatEventTime(event.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{event.ipAddress}</span>
                      </div>
                      <span>{event.deviceInfo}</span>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRiskLevelBg(event.riskLevel)} ${getRiskLevelColor(event.riskLevel)}`}>
                    {event.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Recommendations */}
      {getSecurityRecommendations().length > 0 && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <h3 className="text-lg font-semibold text-foreground-primary mb-6">Security Recommendations</h3>
          
          <div className="space-y-4">
            {getSecurityRecommendations().map((recommendation, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
                <div>
                  <h4 className="text-sm font-semibold text-foreground-primary">{recommendation.title}</h4>
                  <p className="text-sm text-foreground-secondary">{recommendation.description}</p>
                </div>
                
                <Button size="sm" onClick={recommendation.action}>
                  Enable
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}