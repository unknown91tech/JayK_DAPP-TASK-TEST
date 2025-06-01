# OneStep Authentication System

A comprehensive, multi-layered authentication system built with Next.js 15, featuring social login (Telegram), biometric authentication, passcode security, and SSO capabilities for dApps.

## Deployed Link:

### One Step Authentication

```

https://one-step-one.vercel.app/

``` 

### OsAA Token Dapp

```

https://test6-day6-for-me-pf6g.vercel.app/

```


## 🚀 Features

### Core Authentication Methods
- **🔐 Multi-Factor Authentication**: Combine social login, passcode, and biometric authentication
- **📱 Biometric Login**: Touch ID, Face ID, and platform authenticators via WebAuthn
- **💬 Social Login**: Telegram OAuth integration with extensible architecture
- **🔢 Secure Passcode**: 6-digit passcode with strength validation and personal data checks
- **📨 OTP Verification**: SMS/Email verification for account recovery and setup

### Advanced Security Features
- **🛡️ Auto-Verification & Validation (AVV)**: Real-time security checks and fraud prevention
- **🔍 Device Management**: Track and manage up to 5 trusted devices per user
- **📊 Security Monitoring**: Comprehensive logging and risk assessment
- **🌐 Single Sign-On (SSO)**: Universal OneStep ID for dApp integration
- **🔒 KYC/AML Compliance**: Identity verification and regulatory compliance

### Technical Highlights
- **⚡ Next.js 15**: Latest App Router with server components and streaming
- **🗄️ PostgreSQL + Prisma**: Type-safe database operations with comprehensive schema
- **🎨 Modern UI**: Dark theme with Tailwind CSS and beautiful animations
- **📱 Responsive Design**: Optimized for mobile, tablet, and desktop
- **🔧 TypeScript**: End-to-end type safety with Zod validation
- **🚦 Middleware Protection**: Route-level authentication and authorization

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  OneStep Auth   │    │   External      │
│                 │◄──►│     System      │◄──►│   Services      │
│  - Next.js UI   │    │                 │    │  - Telegram     │
│  - React Hooks  │    │  - JWT Sessions │    │  - SMS/Email    │
│  - Biometrics   │    │  - AVV System   │    │  - IP Lookup    │
└─────────────────┘    │  - Device Mgmt  │    └─────────────────┘
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database      │
                       │                 │
                       │  - User Data    │
                       │  - Security Logs│
                       │  - Device Info  │
                       └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Telegram Bot Token (for social login)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/onestep-auth.git
cd onestep-auth
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/onestep_auth"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-256-bits-long"

# Telegram OAuth
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_BOT_USERNAME="@YourBot_name"

# App URLs
NEXTAUTH_URL="http://localhost:3000"
WEBAUTHN_ORIGIN="http://localhost:3000"
WEBAUTHN_RP_ID="localhost"

# Optional: External Services
EMAIL_SERVICE_API_KEY="your-email-service-key"
SMS_SERVICE_API_KEY="your-sms-service-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your OneStep authentication system!

## 📱 Usage Guide

### For End Users

#### 1. **Account Creation**
- Visit the signup page and choose your authentication method
- Complete Telegram OAuth or phone number verification
- Set up your personal information and OneStep ID

#### 2. **Security Setup**
- Create a secure 6-digit passcode (validated by AVV system)
- Enable biometric authentication (Touch ID/Face ID)
- Register trusted devices (up to 5 devices)

#### 3. **Daily Login**
- Choose from multiple authentication methods:
  - Quick biometric login (recommended)
  - Telegram social login
  - 6-digit passcode entry
- Access your dashboard and connected dApps

### For Developers

#### 1. **dApp Integration**
```javascript
// Redirect users to OneStep for authentication
const authUrl = `https://your-onestep-domain.com/sso/authenticate?client_id=${clientId}&redirect_uri=${redirectUri}`
window.location.href = authUrl

// Handle the callback with OS-ID
const urlParams = new URLSearchParams(window.location.search)
const osId = urlParams.get('os_id')
const sessionToken = urlParams.get('token')

// Validate the session
const response = await fetch('/api/sso/validate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${sessionToken}` }
})
```

#### 2. **Custom Authentication UI**
```typescript
import { useAuth, useBiometrics } from '@/hooks'

function CustomLoginForm() {
  const { login } = useAuth()
  const { authenticate, supported } = useBiometrics()
  
  const handleBiometricLogin = async () => {
    const success = await authenticate()
    if (success) {
      // User is now authenticated
    }
  }
  
  return (
    <div>
      {supported && (
        <button onClick={handleBiometricLogin}>
          Login with Biometrics
        </button>
      )}
    </div>
  )
}
```

## 🔧 Configuration

### Authentication Methods
Enable/disable authentication methods in `lib/utils/constants.ts`:

```typescript
export const FEATURE_FLAGS = {
  enableBiometrics: true,        // WebAuthn biometric auth
  enableSocialLogin: true,       // Telegram OAuth
  enablePasscodeLogin: true,     // 6-digit passcode
  enableDeviceManagement: true,  // Device trust system
  // ... other features
}
```

### Security Settings
Adjust security parameters in `lib/utils/constants.ts`:

```typescript
export const AUTH_LIMITS = {
  maxDevicesPerUser: 5,          // Maximum trusted devices
  passcodeMinStrength: 60,       // Minimum AVV score (0-100)
  maxLoginAttemptsPerHour: 10,   // Rate limiting
  sessionDurationDays: 7,        // JWT expiry
  // ... other limits
}
```

### AVV System Tuning
Customize fraud detection thresholds:

```typescript
export const SECURITY_CONFIG = {
  minPasscodeScore: 60,          // Minimum passcode strength
  minDeviceTrustScore: 50,       // Device trust threshold
  riskThresholds: {
    low: 0,    medium: 40,       // Risk level boundaries
    high: 70,  critical: 90
  }
}
```

## 🎨 UI Customization

### Theme Colors
Update colors in `tailwind.config.js`:

```javascript
colors: {
  'accent-primary': 'rgb(212, 175, 55)',     // OneStep gold
  'background-primary': 'rgb(10, 10, 10)',   // Dark background
  'foreground-primary': 'rgb(255, 255, 255)', // Text color
  // ... customize your brand colors
}
```

### Component Styling
Modify component styles in `app/globals.css`:

```css
.btn-primary {
  @apply bg-accent-primary hover:bg-accent-primary/90 
         text-background-primary font-semibold py-3 px-6 
         rounded-xl transition-all duration-200;
}
```

## 🔒 Security Best Practices

### Production Checklist
- [ ] Use HTTPS in production (`NEXTAUTH_URL=https://...`)
- [ ] Generate strong JWT secrets (256-bit minimum)
- [ ] Configure proper CORS headers
- [ ] Enable rate limiting on API endpoints
- [ ] Set up security monitoring and alerting
- [ ] Regular security audits and dependency updates

### Data Protection
- [ ] Encrypt sensitive data at rest
- [ ] Use httpOnly cookies for session tokens
- [ ] Implement proper session invalidation
- [ ] Regular backup and disaster recovery testing
- [ ] GDPR/CCPA compliance for user data

### Monitoring & Alerts
```typescript
// Set up security event monitoring
await logSecurityEvent({
  eventType: 'SUSPICIOUS_ACTIVITY',
  description: 'Multiple failed login attempts',
  riskLevel: 'HIGH',
  metadata: { attempts: 5, timeWindow: '5 minutes' }
})
```

## 📊 Analytics & Monitoring

### Built-in Security Dashboard
- Real-time authentication metrics
- Device trust scores and anomaly detection
- Geographic login patterns and IP reputation
- Failed authentication attempt analysis

### Custom Event Tracking
```typescript
import { useSecurityMonitoring } from '@/hooks'

function MyComponent() {
  const { logSecurityEvent } = useSecurityMonitoring()
  
  const handleSensitiveAction = async () => {
    await logSecurityEvent({
      eventType: 'SENSITIVE_DATA_ACCESS',
      description: 'User accessed financial data',
      riskLevel: 'MEDIUM'
    })
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# DATABASE_URL, JWT_SECRET, etc.
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```bash
# Production settings
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
JWT_SECRET=your-production-jwt-secret-256-bits

# Database (use connection pooling)
DATABASE_URL=postgresql://user:pass@db-host:5432/prod_db?connection_limit=20

# External services
TELEGRAM_BOT_TOKEN=your-production-bot-token
EMAIL_SERVICE_API_KEY=your-production-email-key
SMS_SERVICE_API_KEY=your-production-sms-key
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run linting and type checking (`npm run lint`)
6. Submit a pull request

### Code Standards
- Use TypeScript with strict mode enabled
- Follow the existing code style and patterns
- Add JSDoc comments for complex functions
- Include error handling and user-friendly messages
- Write comprehensive tests for new features

## 📄 API Reference

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout  
POST /api/auth/signup         # Account creation
POST /api/auth/verify-otp     # OTP verification
POST /api/auth/refresh        # Session refresh
```

### User Management
```
GET  /api/user/profile        # Get user profile
PUT  /api/user/profile        # Update profile
GET  /api/user/devices        # List devices
POST /api/user/devices        # Register device
DELETE /api/user/devices      # Remove device
```

### Security & Biometrics
```
POST /api/security/avv        # AVV validation
GET  /api/security/events     # Security events
POST /api/auth/biometrics/register    # Register biometric
POST /api/auth/biometrics/authenticate # Biometric auth
```

