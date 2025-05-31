// app/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  Shield,
  CheckCircle,
  AlertTriangle,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Form validation schema
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number').optional().or(z.literal(''))
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.profile)
        // Reset form with current user data
        reset({
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          email: data.profile.email || '',
          phoneNumber: data.profile.phoneNumber || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.profile)
        setIsEditing(false)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        // Reset form with updated data
        reset(data)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form to original values
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || ''
    })
    setMessage(null)
  }

  const getVerificationStatus = (field: string) => {
    if (field === 'email') {
      return user?.email ? 'verified' : 'unverified'
    }
    if (field === 'phone') {
      return user?.phoneNumber ? 'verified' : 'unverified'
    }
    return 'verified'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-primary">Profile Settings</h1>
          <p className="text-foreground-secondary">Manage your personal information and account details</p>
        </div>
        
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </Button>
        )}
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

      {/* Profile Card */}
      <div className="bg-background-secondary rounded-2xl border border-border-primary overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 border-b border-border-primary">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-accent-primary rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-background-primary">
                  {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </span>
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-background-secondary border-2 border-border-primary rounded-full flex items-center justify-center hover:bg-background-tertiary transition-colors">
                  <Camera className="w-4 h-4 text-foreground-secondary" />
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground-primary">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-foreground-secondary">@{user?.username}</p>
              
              {/* Verification Status */}
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-status-success" />
                  <span className="text-sm text-status-success">Verified Account</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-accent-primary" />
                  <span className="text-sm text-foreground-secondary">OneStep ID: {user?.osId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <Input
                  label="FIRST NAME"
                  placeholder="Enter your first name"
                  startIcon={<User className="w-4 h-4" />}
                  error={errors.firstName?.message}
                  disabled={!isEditing}
                  {...register('firstName')}
                />
              </div>

              {/* Last Name */}
              <div>
                <Input
                  label="LAST NAME"
                  placeholder="Enter your last name"
                  startIcon={<User className="w-4 h-4" />}
                  error={errors.lastName?.message}
                  disabled={!isEditing}
                  {...register('lastName')}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-4">Contact Information</h3>
            
            <div className="space-y-6">
              {/* Email */}
              <div>
                <Input
                  label="EMAIL ADDRESS"
                  type="email"
                  placeholder="Enter your email address"
                  startIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  disabled={!isEditing}
                  {...register('email')}
                />
                {user?.email && (
                  <div className="mt-2 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-status-success" />
                    <span className="text-sm text-status-success">Email verified</span>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <Input
                  label="PHONE NUMBER"
                  type="tel"
                  placeholder="Enter your phone number"
                  startIcon={<Phone className="w-4 h-4" />}
                  error={errors.phoneNumber?.message}
                  disabled={!isEditing}
                  {...register('phoneNumber')}
                />
                {user?.phoneNumber && (
                  <div className="mt-2 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-status-success" />
                    <span className="text-sm text-status-success">Phone verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Read-only Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-4">Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date of Birth */}
              <div className="flex items-center space-x-3 p-4 bg-background-tertiary/50 rounded-xl">
                <Calendar className="w-5 h-5 text-foreground-secondary" />
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Date of Birth</div>
                  <div className="text-sm text-foreground-secondary">
                    {formatDate(user?.dateOfBirth)}
                  </div>
                </div>
              </div>

              {/* Account Created */}
              <div className="flex items-center space-x-3 p-4 bg-background-tertiary/50 rounded-xl">
                <Shield className="w-5 h-5 text-foreground-secondary" />
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Account Created</div>
                  <div className="text-sm text-foreground-secondary">
                    {formatDate(user?.createdAt)}
                  </div>
                </div>
              </div>

              {/* Last Login */}
              <div className="flex items-center space-x-3 p-4 bg-background-tertiary/50 rounded-xl">
                <MapPin className="w-5 h-5 text-foreground-secondary" />
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Last Login</div>
                  <div className="text-sm text-foreground-secondary">
                    {formatDate(user?.lastLoginAt) || 'Never'}
                  </div>
                </div>
              </div>

              {/* KYC Status */}
              <div className="flex items-center space-x-3 p-4 bg-background-tertiary/50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-foreground-secondary" />
                <div>
                  <div className="text-sm font-medium text-foreground-primary">KYC Status</div>
                  <div className={`text-sm ${
                    user?.kycStatus === 'APPROVED' ? 'text-status-success' :
                    user?.kycStatus === 'IN_PROGRESS' ? 'text-status-warning' :
                    user?.kycStatus === 'REJECTED' ? 'text-status-error' :
                    'text-foreground-secondary'
                  }`}>
                    {user?.kycStatus?.replace('_', ' ') || 'Not Started'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border-primary">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={!isDirty || saving}
                loading={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Security Notice */}
      <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-foreground-primary mb-1">Security Notice</h4>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Your personal information is encrypted and stored securely. Changes to sensitive information like email 
              or phone number may require additional verification steps for your security.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}