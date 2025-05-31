// components/ui/social-login-button.tsx
"use client";

import { useState } from 'react'
import { MessageSquare, Smartphone, Chrome, Github, Twitter, Hash } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { LoadingSpinner } from './loading-spinner'

// Available social providers
type SocialProvider = 'telegram' | 'twitter' | 'discord' | 'google' | 'github'

interface SocialLoginButtonProps {
  // The social provider
  provider: SocialProvider
  // Callback when clicked
  onLogin: (provider: SocialProvider) => Promise<void>
  // Loading state
  loading?: boolean
  // Disabled state
  disabled?: boolean
  // Size variant
  size?: 'sm' | 'md' | 'lg'
  // Show provider name
  showName?: boolean
  // Custom className
  className?: string
}

// Provider configurations
const providerConfig = {
  telegram: {
    name: 'Telegram',
    icon: MessageSquare,
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    description: 'Continue with Telegram',
    brandColor: '#0088cc'
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'from-sky-400 to-sky-500',
    hoverColor: 'hover:from-sky-500 hover:to-sky-600',
    description: 'Continue with Twitter',
    brandColor: '#1da1f2'
  },
  discord: {
    name: 'Discord',
    icon: Hash, // Using Hash as placeholder for Discord icon
    color: 'from-indigo-500 to-purple-500',
    hoverColor: 'hover:from-indigo-600 hover:to-purple-600',
    description: 'Continue with Discord',
    brandColor: '#5865f2'
  },
  google: {
    name: 'Google',
    icon: Chrome,
    color: 'from-red-500 to-orange-500',
    hoverColor: 'hover:from-red-600 hover:to-orange-600',
    description: 'Continue with Google',
    brandColor: '#db4437'
  },
  github: {
    name: 'GitHub',
    icon: Github,
    color: 'from-gray-700 to-gray-800',
    hoverColor: 'hover:from-gray-800 hover:to-gray-900',
    description: 'Continue with GitHub',
    brandColor: '#333'
  }
}

export function SocialLoginButton({
  provider,
  onLogin,
  loading = false,
  disabled = false,
  size = 'md',
  showName = false,
  className
}: SocialLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const config = providerConfig[provider]
  const Icon = config.icon

  // Size classes for different button sizes
  const sizeClasses = {
    sm: showName ? 'px-3 py-2 text-sm' : 'w-10 h-10',
    md: showName ? 'px-4 py-3 text-base' : 'w-12 h-12',
    lg: showName ? 'px-6 py-4 text-lg' : 'w-16 h-16'
  }

  // Icon sizes for different button sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior and event bubbling
    e.preventDefault()
    e.stopPropagation()
    
    // Early return if button should not be interactive
    if (disabled || loading || isLoading) return

    setIsLoading(true)
    try {
      await onLogin(provider)
    } catch (error) {
      console.error(`${provider} login failed:`, error)
      // Error handling should be done by parent component
    } finally {
      setIsLoading(false)
    }
  }

  const isButtonLoading = loading || isLoading

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isButtonLoading}
      className={cn(
        // Base styles
        "relative flex items-center justify-center rounded-xl font-medium transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary group",
        // Size
        sizeClasses[size],
        // Hover and active states
        !disabled && !isButtonLoading && "hover:scale-105 active:scale-95",
        // Normal state - OneStep themed styling
        !disabled && !isButtonLoading && 
          "bg-background-tertiary hover:bg-accent-primary hover:text-background-primary border border-border-primary hover:border-accent-primary text-foreground-primary",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed bg-background-tertiary border-border-primary text-foreground-tertiary",
        // Loading state
        isButtonLoading && "cursor-wait opacity-80",
        className
      )}
      title={config.description}
      aria-label={config.description}
    >
      {/* Background gradient overlay for brand colors (subtle) */}
      <div 
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300",
          `bg-gradient-to-r ${config.color}`
        )}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center">
        {isButtonLoading ? (
          <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
        ) : (
          <>
            <Icon className={cn(
              iconSizes[size], 
              showName && "mr-2",
              "transition-colors duration-200"
            )} />
            {showName && (
              <span className="font-medium">{config.name}</span>
            )}
          </>
        )}
      </div>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-accent-primary opacity-0 group-active:opacity-20 transition-opacity duration-150" />
      </div>
    </button>
  )
}

// Convenience component for multiple social login options
interface SocialLoginGroupProps {
  // Available providers
  providers: SocialProvider[]
  // Callback when a provider is selected
  onLogin: (provider: SocialProvider) => Promise<void>
  // Loading state for specific provider
  loadingProvider?: SocialProvider
  // Disabled providers
  disabledProviders?: SocialProvider[]
  // Layout orientation
  orientation?: 'horizontal' | 'vertical'
  // Size of buttons
  size?: 'sm' | 'md' | 'lg'
  // Show provider names
  showNames?: boolean
  // Title above the group
  title?: string
  // Custom className
  className?: string
}

export function SocialLoginGroup({
  providers,
  onLogin,
  loadingProvider,
  disabledProviders = [],
  orientation = 'horizontal',
  size = 'md',
  showNames = false,
  title,
  className
}: SocialLoginGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Title */}
      {title && (
        <div className="text-center">
          <p className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">
            {title}
          </p>
        </div>
      )}

      {/* Social login buttons */}
      <div className={cn(
        "flex gap-3",
        orientation === 'vertical' ? "flex-col" : "flex-row justify-center items-center",
        orientation === 'horizontal' && showNames && "flex-wrap"
      )}>
        {providers.map((provider) => (
          <SocialLoginButton
            key={provider}
            provider={provider}
            onLogin={onLogin}
            loading={loadingProvider === provider}
            disabled={disabledProviders.includes(provider)}
            size={size}
            showName={showNames}
          />
        ))}
      </div>

      {/* Help text for social login */}
      <div className="text-center">
        <p className="text-xs text-foreground-tertiary">
          Choose your preferred authentication method
        </p>
      </div>
    </div>
  )
}

// Enhanced social login with provider-specific features
interface EnhancedSocialLoginProps {
  // Primary provider (shown prominently)
  primaryProvider: SocialProvider
  // Secondary providers (shown smaller)
  secondaryProviders?: SocialProvider[]
  // Callback when a provider is selected
  onLogin: (provider: SocialProvider) => Promise<void>
  // Loading state
  loading?: boolean
  // Show "or continue with" text
  showDivider?: boolean
  // Custom title
  title?: string
  // Error message
  error?: string
}

export function EnhancedSocialLogin({
  primaryProvider,
  secondaryProviders = [],
  onLogin,
  loading = false,
  showDivider = true,
  title,
  error
}: EnhancedSocialLoginProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)

  const handleProviderLogin = async (provider: SocialProvider) => {
    setLoadingProvider(provider)
    try {
      await onLogin(provider)
    } catch (err) {
      console.error(`${provider} login failed:`, err)
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Custom title */}
      {title && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground-primary">
            {title}
          </h3>
        </div>
      )}

      {/* Primary provider - large button */}
      <div className="space-y-3">
        <SocialLoginButton
          provider={primaryProvider}
          onLogin={handleProviderLogin}
          loading={loadingProvider === primaryProvider || loading}
          size="lg"
          showName={true}
          className="w-full"
        />
        
        {/* Provider-specific benefits */}
        <div className="text-center">
          <p className="text-xs text-foreground-tertiary">
            {primaryProvider === 'telegram' && '🔒 Secure messaging platform authentication'}
            {primaryProvider === 'google' && '🌐 Access with your Google account'}
            {primaryProvider === 'github' && '👨‍💻 Developer-friendly authentication'}
            {primaryProvider === 'discord' && '🎮 Gaming community trusted login'}
            {primaryProvider === 'twitter' && '🐦 Social media platform authentication'}
          </p>
        </div>
      </div>

      {/* Divider */}
      {showDivider && secondaryProviders.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-primary" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background-primary text-foreground-tertiary">
              or continue with
            </span>
          </div>
        </div>
      )}

      {/* Secondary providers - smaller buttons */}
      {secondaryProviders.length > 0 && (
        <SocialLoginGroup
          providers={secondaryProviders}
          onLogin={handleProviderLogin}
          loadingProvider={loadingProvider || undefined}
          size="md"
          showNames={false}
          orientation="horizontal"
        />
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
          <p className="text-status-error text-sm text-center">{error}</p>
        </div>
      )}

      {/* Additional security note */}
      <div className="text-center pt-2">
        <p className="text-xs text-foreground-tertiary leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Your account will be secured with OneStep's multi-layer authentication.
        </p>
      </div>
    </div>
  )
}