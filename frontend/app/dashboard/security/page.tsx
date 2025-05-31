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
  Download,
  Trash2,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from '@/components/ui/passcode-input'

interface BiometricCredential {
  id: string
  credentialId: string
  deviceName: string
  deviceType: string
  createdAt: string
  lastUsedAt: string | null
  isActive: boolean
  daysSinceCreated: number
  daysSinceLastUse: number | null
  status: 'used' | 'registered'
}

interface BiometricData {
  user: {
    osId: string
    username: string
    isSetupComplete: boolean
  }
  biometrics: BiometricCredential[]
  summary: {
    totalActive: number
    maxAllowed: number
    canAddMore: boolean
    hasAnyBiometrics: boolean
    mostRecentlyUsed: string | null
  }
}

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
  
  const [biometricData, setBiometricData] = useState<BiometricData | null>(null)
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasscodeChange, setShowPasscodeChange] = useState(false)
  const [changingPasscode, setChangingPasscode] = useState(false)
  const [deletingBiometric, setDeletingBiometric] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      // Debug: Check what's in localStorage
      console.log('🔍 Checking localStorage for user data...')
      const username = localStorage.getItem('username')
      const osId = localStorage.getItem('osId')
      const userId = localStorage.getItem('userId')
      
      console.log('📦 localStorage contents:', {
        username,
        osId,
        userId,
        allKeys: Object.keys(localStorage)
      })
      
      // If no username, try to get it from user profile API first
      if (!username) {
        console.log('⚠️ No username in localStorage, trying to fetch from profile...')
        try {
          const profileResponse = await fetch('/api/user/profile', {
            credentials: 'include'
          })
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            console.log('👤 Profile data received:', profileData)
            
            // Store the username for future use
            if (profileData.user?.username) {
              localStorage.setItem('username', profileData.user.username)
              console.log('💾 Stored username in localStorage:', profileData.user.username)
            }
            if (profileData.user?.osId) {
              localStorage.setItem('osId', profileData.user.osId)
              console.log('💾 Stored osId in localStorage:', profileData.user.osId)
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch profile:', error)
        }
      }
      
      // Get updated values after potential profile fetch
      const finalUsername = localStorage.getItem('username')
      const finalOsId = localStorage.getItem('osId')
      
      // Build query parameters for user identification
      const queryParams = new URLSearchParams()
      if (finalUsername) queryParams.append('username', finalUsername)
      if (finalOsId) queryParams.append('osId', finalOsId)
      
      console.log('🔗 Making biometrics request with params:', queryParams.toString())
      
      // Fetch biometric data with user identifier
      const biometricsResponse = await fetch(`/api/user/biometrics?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Also send as headers as backup
          ...(finalUsername && { 'X-Username': finalUsername }),
          ...(finalOsId && { 'X-OS-ID': finalOsId })
        }
      })
      
      if (biometricsResponse.ok) {
        const biometricsData = await biometricsResponse.json()
        setBiometricData(biometricsData)
        
        // Update security settings based on actual biometric data
        setSecuritySettings(prev => ({
          ...prev,
          biometricsEnabled: biometricsData.summary.hasAnyBiometrics
        }))
        
        console.log('📱 Loaded biometric data:', biometricsData)
      } else {
        console.error('Failed to fetch biometric data:', biometricsResponse.statusText)
        setMessage({ type: 'error', text: 'Failed to load biometric information' })
      }
      
      // Mock recent events (in real app, this would be an API call)
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          eventType: 'LOGIN_SUCCESS',
          description: 'Successful login via biometrics',
          timestamp: new Date().toISOString(),
          ipAddress: '103.120.45.123',
          deviceInfo: 'Chrome on MacOS',
          riskLevel: 'LOW'
        },
        {
          id: '2',
          eventType: 'BIOMETRIC_REGISTERED',
          description: 'New Touch ID credential registered',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ipAddress: '103.120.45.123',
          deviceInfo: 'Chrome on MacOS',
          riskLevel: 'LOW'
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
        await fetchSecurityData()
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

      const handleDeleteBiometric = async (biometricId: string) => {
    if (!confirm('Are you sure you want to remove this biometric credential? This action cannot be undone.')) {
      return
    }

    setDeletingBiometric(biometricId)
    setMessage(null)

    try {
      // Get username for the request
      const username = localStorage.getItem('username')
      const osId = localStorage.getItem('osId')
      
      const queryParams = new URLSearchParams()
      queryParams.append('id', biometricId)
      if (username) queryParams.append('username', username)
      if (osId) queryParams.append('osId', osId)

      const response = await fetch(`/api/user/biometrics?${queryParams.toString()}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Biometric credential removed successfully!' })
        await fetchSecurityData() // Refresh the data
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to remove biometric credential' })
      }
    } catch (error) {
      console.error('Failed to delete biometric:', error)
      setMessage({ type: 'error', text: 'Failed to remove biometric credential. Please try again.' })
    } finally {
      setDeletingBiometric(null)
    }
  }

  const handleAddBiometric = async () => {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      setMessage({ type: 'error', text: 'Biometric authentication is not supported on this device' })
      return
    }

    try {
      setMessage(null)
      
      // Get username from localStorage for the registration
      const username = localStorage.getItem('username')
      if (!username) {
        setMessage({ type: 'error', text: 'Username not found. Please log in again.' })
        return
      }

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // In real app, get this from server
          rp: {
            name: "OneStep",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(username),
            name: username,
            displayName: username,
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      }) as PublicKeyCredential

      if (credential) {
        // Send to your registration endpoint
        const registrationData = {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          response: {
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON))),
            attestationObject: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)))
          },
          type: credential.type,
          username: username
        }

        const response = await fetch('/api/auth/webauthn/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData),
          credentials: 'include'
        })

        if (response.ok) {
          setMessage({ type: 'success', text: 'Biometric credential added successfully!' })
          await fetchSecurityData()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.error || 'Failed to register biometric credential' })
        }
      }
    } catch (error) {
      console.error('Biometric registration failed:', error)
      setMessage({ type: 'error', text: 'Biometric registration failed. Please try again.' })
    }
  }

  const toggleSetting = async (setting: keyof SecuritySettings) => {
    const newValue = !securitySettings[setting]
    
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: newValue
    }))

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

  const getDeviceTypeIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'face': return <Eye className="w-5 h-5" />
      case 'touch': 
      case 'fingerprint': return <Fingerprint className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
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

      {/* User Information (if available) */}
      {biometricData && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-foreground-secondary">OneStep ID</div>
              <div className="font-mono text-foreground-primary">{biometricData.user.osId}</div>
            </div>
            <div>
              <div className="text-sm text-foreground-secondary">Username</div>
              <div className="text-foreground-primary">{biometricData.user.username}</div>
            </div>
            <div>
              <div className="text-sm text-foreground-secondary">Setup Status</div>
              <div className={`text-sm ${biometricData.user.isSetupComplete ? 'text-status-success' : 'text-status-warning'}`}>
                {biometricData.user.isSetupComplete ? 'Complete' : 'In Progress'}
              </div>
            </div>
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

      {/* Biometric Credentials Management */}
      {biometricData && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground-primary">Biometric Credentials</h3>
              <p className="text-foreground-secondary">
                Manage your registered biometric authentication methods
              </p>
            </div>
            
            {biometricData.summary.canAddMore && (
              <Button onClick={handleAddBiometric} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Biometric</span>
              </Button>
            )}
          </div>

          {biometricData.summary.hasAnyBiometrics ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background-tertiary/50 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground-primary">{biometricData.summary.totalActive}</div>
                  <div className="text-sm text-foreground-secondary">Active Credentials</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground-primary">{biometricData.summary.maxAllowed}</div>
                  <div className="text-sm text-foreground-secondary">Maximum Allowed</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${biometricData.summary.canAddMore ? 'text-status-success' : 'text-status-warning'}`}>
                    {biometricData.summary.canAddMore ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-foreground-secondary">Can Add More</div>
                </div>
              </div>

              {/* Biometric List */}
              <div className="space-y-3">
                {biometricData.biometrics.map((biometric) => (
                  <div key={biometric.id} className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl border border-border-primary">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                        {getDeviceTypeIcon(biometric.deviceType)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-primary">{biometric.deviceName}</h4>
                        <div className="flex items-center space-x-4 text-xs text-foreground-secondary">
                          <span>Added {biometric.daysSinceCreated} days ago</span>
                          {biometric.lastUsedAt ? (
                            <span>Last used {biometric.daysSinceLastUse} days ago</span>
                          ) : (
                            <span className="text-status-warning">Never used</span>
                          )}
                          <span className={`px-2 py-1 rounded-full ${
                            biometric.status === 'used' ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                          }`}>
                            {biometric.status === 'used' ? 'Active' : 'Registered'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteBiometric(biometric.id)}
                      disabled={deletingBiometric === biometric.id}
                      className="text-status-error hover:text-status-error hover:bg-status-error/10"
                    >
                      {deletingBiometric === biometric.id ? (
                        <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-8 h-8 text-accent-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground-primary mb-2">No Biometric Credentials</h4>
              <p className="text-foreground-secondary mb-6">
                Add Touch ID, Face ID, or fingerprint authentication for faster and more secure access
              </p>
              <Button onClick={handleAddBiometric} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Your First Biometric</span>
              </Button>
            </div>
          )}
        </div>
      )}

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
                <p className="text-sm text-foreground-secondary">
                  {biometricData?.summary.hasAnyBiometrics 
                    ? `${biometricData.summary.totalActive} credential(s) registered`
                    : 'Touch ID, Face ID, or fingerprint login'
                  }
                </p>
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
        <h3 className="text-lg font-semibold text-foreground-primary mb-6">Recent Security Events</h3>
        
        <div className="space-y-4">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  event.riskLevel === 'LOW' ? 'bg-status-success/10' :
                  event.riskLevel === 'MEDIUM' ? 'bg-status-warning/10' :
                  'bg-status-error/10'
                }`}>
                  <Activity className={`w-5 h-5 ${getRiskLevelColor(event.riskLevel)}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground-primary">{event.description}</h4>
                  <div className="flex items-center space-x-4 text-xs text-foreground-secondary">
                    <span>{formatEventTime(event.timestamp)}</span>
                    <span>{event.ipAddress}</span>
                    <span>{event.deviceInfo}</span>
                  </div>
                </div>
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full ${
                event.riskLevel === 'LOW' ? 'bg-status-success/10 text-status-success' :
                event.riskLevel === 'MEDIUM' ? 'bg-status-warning/10 text-status-warning' :
                'bg-status-error/10 text-status-error'
              }`}>
                {event.riskLevel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}