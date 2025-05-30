// app/dashboard/devices/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Shield, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Laptop
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Device {
  id: string
  deviceName: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  fingerprint: string
  ipAddress: string
  userAgent: string
  isActive: boolean
  isCurrent: boolean
  createdAt: string
  lastUsedAt: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [addingDevice, setAddingDevice] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchDevices()
    detectCurrentDevice()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/user/devices', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
      } else {
        setMessage({ type: 'error', text: 'Failed to load devices' })
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error)
      setMessage({ type: 'error', text: 'Failed to load devices' })
    } finally {
      setLoading(false)
    }
  }

  const detectCurrentDevice = () => {
    // Simple device detection based on user agent
    const userAgent = navigator.userAgent.toLowerCase()
    let deviceName = 'Unknown Device'
    
    if (userAgent.includes('iphone')) {
      deviceName = 'iPhone'
    } else if (userAgent.includes('ipad')) {
      deviceName = 'iPad'
    } else if (userAgent.includes('android')) {
      if (userAgent.includes('mobile')) {
        deviceName = 'Android Phone'
      } else {
        deviceName = 'Android Tablet'
      }
    } else if (userAgent.includes('mac')) {
      deviceName = 'Mac'
    } else if (userAgent.includes('windows')) {
      deviceName = 'Windows PC'
    } else if (userAgent.includes('linux')) {
      deviceName = 'Linux Computer'
    }
    
    setNewDeviceName(deviceName)
  }

  const addDevice = async () => {
    if (!newDeviceName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a device name' })
      return
    }

    setAddingDevice(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: newDeviceName.trim() }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: 'Device registered successfully!' })
        setShowAddDevice(false)
        setNewDeviceName('')
        await fetchDevices() // Refresh the list
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to register device' })
      }
    } catch (error) {
      console.error('Failed to add device:', error)
      setMessage({ type: 'error', text: 'Failed to register device. Please try again.' })
    } finally {
      setAddingDevice(false)
    }
  }

  const removeDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to remove "${deviceName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/user/devices?deviceId=${deviceId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Device removed successfully!' })
        await fetchDevices() // Refresh the list
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to remove device' })
      }
    } catch (error) {
      console.error('Failed to remove device:', error)
      setMessage({ type: 'error', text: 'Failed to remove device. Please try again.' })
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      case 'desktop':
        return Monitor
      default:
        return Laptop
    }
  }

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return 'text-blue-500'
      case 'tablet':
        return 'text-purple-500'
      case 'desktop':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSince = (dateString: string) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const days = Math.floor(diffInHours / 24)
    return `${days} days ago`
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
          <h1 className="text-2xl font-bold text-foreground-primary">Trusted Devices</h1>
          <p className="text-foreground-secondary">Manage devices that can access your OneStep account</p>
        </div>
        
        <Button 
          onClick={() => setShowAddDevice(true)}
          className="flex items-center space-x-2"
          disabled={devices.length >= 5}
        >
          <Plus className="w-4 h-4" />
          <span>Register Device</span>
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

      {/* Device Limit Info */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-2">Device Security</h3>
            <p className="text-foreground-secondary">
              You can register up to 5 trusted devices for enhanced security. Each device requires verification.
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground-primary">
              {devices.length}/5
            </div>
            <div className="text-sm text-foreground-secondary">Devices</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-background-tertiary rounded-full h-2">
            <div 
              className="bg-accent-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(devices.length / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
          <h3 className="text-lg font-semibold text-foreground-primary mb-4">Register New Device</h3>
          
          <div className="space-y-4">
            <Input
              label="DEVICE NAME"
              placeholder="e.g., iPhone 15, MacBook Pro, Work Laptop"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              startIcon={<Smartphone className="w-4 h-4" />}
            />
            
            <div className="flex items-center justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddDevice(false)
                  setNewDeviceName('')
                  setMessage(null)
                }}
                disabled={addingDevice}
              >
                Cancel
              </Button>
              
              <Button
                onClick={addDevice}
                loading={addingDevice}
                disabled={!newDeviceName.trim()}
              >
                Register Device
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Devices List */}
      <div className="space-y-4">
        {devices.length === 0 ? (
          <div className="bg-background-secondary rounded-2xl p-12 border border-border-primary text-center">
            <Smartphone className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground-primary mb-2">No Devices Registered</h3>
            <p className="text-foreground-secondary mb-6">
              Register your first device to get started with OneStep authentication
            </p>
            <Button onClick={() => setShowAddDevice(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Register This Device
            </Button>
          </div>
        ) : (
          devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.deviceType)
            const isCurrentDevice = device.isCurrent
            
            return (
              <div 
                key={device.id}
                className={`bg-background-secondary rounded-2xl p-6 border transition-colors ${
                  isCurrentDevice 
                    ? 'border-accent-primary bg-accent-primary/5' 
                    : 'border-border-primary hover:border-border-secondary'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Device Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCurrentDevice ? 'bg-accent-primary/20' : 'bg-background-tertiary'
                    }`}>
                      <DeviceIcon className={`w-6 h-6 ${
                        isCurrentDevice ? 'text-accent-primary' : getDeviceTypeColor(device.deviceType)
                      }`} />
                    </div>

                    {/* Device Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground-primary">
                          {device.deviceName}
                        </h3>
                        {isCurrentDevice && (
                          <span className="px-2 py-1 bg-accent-primary/20 border border-accent-primary/30 rounded-lg text-xs font-medium text-accent-primary">
                            Current Device
                          </span>
                        )}
                        {device.isActive && (
                          <CheckCircle className="w-4 h-4 text-status-success" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4 text-sm text-foreground-secondary">
                          <div className="flex items-center space-x-1">
                            <Shield className="w-4 h-4" />
                            <span className="capitalize">{device.deviceType}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{device.ipAddress}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-foreground-tertiary">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Last used: {getTimeSince(device.lastUsedAt)}</span>
                          </div>
                          <span>•</span>
                          <span>Added: {formatDate(device.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {!isCurrentDevice && (
                      <button
                        onClick={() => removeDevice(device.id, device.deviceName)}
                        className="p-2 hover:bg-background-tertiary rounded-lg transition-colors text-foreground-secondary hover:text-status-error"
                        title="Remove device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button className="p-2 hover:bg-background-tertiary rounded-lg transition-colors text-foreground-secondary">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Device Details (Collapsible) */}
                <div className="mt-4 pt-4 border-t border-border-primary">
                  <details className="group">
                    <summary className="text-sm text-foreground-secondary cursor-pointer hover:text-foreground-primary transition-colors">
                      Device Details
                    </summary>
                    <div className="mt-3 text-sm text-foreground-tertiary space-y-1">
                      <div><strong>User Agent:</strong> {device.userAgent}</div>
                      <div><strong>Fingerprint:</strong> {device.fingerprint}</div>
                      <div><strong>Status:</strong> {device.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                  </details>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-foreground-primary mb-1">Device Security</h4>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Only trusted devices can access your OneStep account. If you notice any unfamiliar devices, 
              remove them immediately and check your security settings. Each device is uniquely identified 
              and monitored for suspicious activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}