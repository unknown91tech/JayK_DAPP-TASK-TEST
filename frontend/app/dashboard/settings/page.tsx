// app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  Lock, 
  Trash2, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Mail,
  MessageSquare,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserSettings {
  notifications: {
    loginAlerts: boolean
    deviceRegistration: boolean
    securityUpdates: boolean
    marketingEmails: boolean
    telegramNotifications: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    activityLogging: boolean
    dataSharing: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    sessionTimeout: number
  }
  security: {
    requireEmailVerification: boolean
    autoLogout: boolean
    allowMultipleSessions: boolean
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      loginAlerts: true,
      deviceRegistration: true,
      securityUpdates: true,
      marketingEmails: false,
      telegramNotifications: true
    },
    privacy: {
      profileVisibility: 'private',
      activityLogging: true,
      dataSharing: false
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'Asia/Kolkata',
      sessionTimeout: 7
    },
    security: {
      requireEmailVerification: true,
      autoLogout: true,
      allowMultipleSessions: false
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateSetting = async (category: keyof UserSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    }
    
    setSettings(newSettings)
    
    // In a real app, you'd save to the server here
    setMessage({ type: 'success', text: 'Settings updated successfully' })
    setTimeout(() => setMessage(null), 3000)
  }

  const exportData = async () => {
    setLoading(true)
    
    try {
      // In a real app, this would trigger a data export process
      const response = await fetch('/api/user/export', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Data export initiated. You will receive an email when ready.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to initiate data export' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' })
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Redirect to goodbye page or login
        window.location.href = '/account-deleted'
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' })
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
        enabled ? 'bg-accent-primary' : 'bg-background-tertiary'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground-primary">Settings</h1>
        <p className="text-foreground-secondary">Manage your account preferences and privacy settings</p>
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

      {/* Notification Settings */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary">Notifications</h3>
            <p className="text-sm text-foreground-secondary">Control how you receive updates</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Login Alerts</div>
                <div className="text-xs text-foreground-tertiary">Get notified of new login attempts</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.notifications.loginAlerts}
              onToggle={() => updateSetting('notifications', 'loginAlerts', !settings.notifications.loginAlerts)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Device Registration</div>
                <div className="text-xs text-foreground-tertiary">Alerts when new devices are added</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.notifications.deviceRegistration}
              onToggle={() => updateSetting('notifications', 'deviceRegistration', !settings.notifications.deviceRegistration)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Security Updates</div>
                <div className="text-xs text-foreground-tertiary">Important security notifications</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.notifications.securityUpdates}
              onToggle={() => updateSetting('notifications', 'securityUpdates', !settings.notifications.securityUpdates)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Telegram Notifications</div>
                <div className="text-xs text-foreground-tertiary">Receive notifications via Telegram</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.notifications.telegramNotifications}
              onToggle={() => updateSetting('notifications', 'telegramNotifications', !settings.notifications.telegramNotifications)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Marketing Emails</div>
                <div className="text-xs text-foreground-tertiary">Product updates and newsletters</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.notifications.marketingEmails}
              onToggle={() => updateSetting('notifications', 'marketingEmails', !settings.notifications.marketingEmails)}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
            <Eye className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary">Privacy & Data</h3>
            <p className="text-sm text-foreground-secondary">Control your data and privacy preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Profile Visibility</div>
                <div className="text-xs text-foreground-tertiary">Who can see your profile information</div>
              </div>
            </div>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
              className="px-3 py-2 bg-background-tertiary border border-border-primary rounded-lg text-sm text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Activity Logging</div>
                <div className="text-xs text-foreground-tertiary">Track account activity for security</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.privacy.activityLogging}
              onToggle={() => updateSetting('privacy', 'activityLogging', !settings.privacy.activityLogging)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Data Sharing</div>
                <div className="text-xs text-foreground-tertiary">Share anonymized usage data</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.privacy.dataSharing}
              onToggle={() => updateSetting('privacy', 'dataSharing', !settings.privacy.dataSharing)}
            />
          </div>
        </div>
      </div>

      {/* Appearance & Preferences */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary">Preferences</h3>
            <p className="text-sm text-foreground-secondary">Customize your experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Theme
            </label>
            <select
              value={settings.preferences.theme}
              onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
              className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Language
            </label>
            <select
              value={settings.preferences.language}
              onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
              className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Timezone
            </label>
            <select
              value={settings.preferences.timezone}
              onChange={(e) => updateSetting('preferences', 'timezone', e.target.value)}
              className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Session Timeout (days)
            </label>
            <select
              value={settings.preferences.sessionTimeout}
              onChange={(e) => updateSetting('preferences', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-background-tertiary border border-border-primary rounded-xl text-foreground-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Preferences */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary">Security Preferences</h3>
            <p className="text-sm text-foreground-secondary">Additional security options</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Email Verification Required</div>
                <div className="text-xs text-foreground-tertiary">Require email verification for sensitive actions</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.security.requireEmailVerification}
              onToggle={() => updateSetting('security', 'requireEmailVerification', !settings.security.requireEmailVerification)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Auto Logout</div>
                <div className="text-xs text-foreground-tertiary">Automatically logout after inactivity</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.security.autoLogout}
              onToggle={() => updateSetting('security', 'autoLogout', !settings.security.autoLogout)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-foreground-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground-primary">Multiple Sessions</div>
                <div className="text-xs text-foreground-tertiary">Allow login from multiple devices</div>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.security.allowMultipleSessions}
              onToggle={() => updateSetting('security', 'allowMultipleSessions', !settings.security.allowMultipleSessions)}
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary">Data Management</h3>
            <p className="text-sm text-foreground-secondary">Export or delete your data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background-tertiary/50 rounded-xl">
            <div>
              <div className="text-sm font-medium text-foreground-primary">Export Your Data</div>
              <div className="text-xs text-foreground-tertiary">Download a copy of all your account data</div>
            </div>
            <Button
              variant="secondary"
              onClick={exportData}
              loading={loading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-status-error/5 border border-status-error/20 rounded-xl">
            <div>
              <div className="text-sm font-medium text-status-error">Delete Account</div>
              <div className="text-xs text-foreground-tertiary">Permanently delete your account and all data</div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background-secondary rounded-2xl p-6 max-w-md w-full border border-border-primary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-status-error/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-status-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground-primary">Delete Account</h3>
                <p className="text-sm text-foreground-secondary">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                Are you sure you want to permanently delete your OneStep account? This will:
              </p>
              
              <ul className="text-sm text-foreground-secondary space-y-1 ml-4">
                <li>• Delete all your personal data</li>
                <li>• Remove access to all connected dApps</li>
                <li>• Deregister all your devices</li>
                <li>• Cancel any active sessions</li>
              </ul>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={deleteAccount}
                  loading={loading}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}