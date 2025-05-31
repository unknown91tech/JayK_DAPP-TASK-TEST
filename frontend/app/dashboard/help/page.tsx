// app/dashboard/help/page.tsx - Completed Help & Support Page
"use client";
import { useState, useEffect } from 'react'
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Mail, 
  ExternalLink, 
  Search,
  ChevronRight,
  ChevronDown,
  Shield,
  Key,
  Smartphone,
  User,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Video,
  FileText,
  Send,
  Star,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Download,
  Globe,
  Zap,
  LifeBuoy,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  helpful: number
  notHelpful: number
  tags: string[]
  lastUpdated: string
}

interface HelpCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  articleCount: number
}

interface SupportTicket {
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  attachments: File[]
}

interface ContactOption {
  id: string
  name: string
  description: string
  icon: any
  available: boolean
  responseTime: string
  action: () => void
}

export default function HelpSupportPage() {
  // State management for the help system
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'guides' | 'status'>('faq')
  
  // Support ticket state
  const [supportTicket, setSupportTicket] = useState<SupportTicket>({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
    attachments: []
  })
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [formErrors, setFormErrors] = useState<{ subject?: string; message?: string }>({})
  
  // Feedback state
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'helpful' | 'not-helpful'>>({})

  // Help categories with realistic article counts
  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Setup your OneStep account and learn the basics',
      icon: User,
      color: 'text-blue-500',
      articleCount: 12
    },
    {
      id: 'security',
      name: 'Security & Privacy',
      description: 'Protect your account with advanced security features',
      icon: Shield,
      color: 'text-green-500',
      articleCount: 18
    },
    {
      id: 'authentication',
      name: 'Authentication',
      description: 'Passcodes, biometrics, and login methods',
      icon: Key,
      color: 'text-purple-500',
      articleCount: 15
    },
    {
      id: 'devices',
      name: 'Device Management',
      description: 'Managing your trusted devices and connections',
      icon: Smartphone,
      color: 'text-orange-500',
      articleCount: 8
    },
    {
      id: 'verification',
      name: 'Identity Verification',
      description: 'KYC process and document requirements',
      icon: CreditCard,
      color: 'text-red-500',
      articleCount: 10
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Solutions to common issues and error messages',
      icon: AlertTriangle,
      color: 'text-yellow-500',
      articleCount: 22
    },
    {
      id: 'account',
      name: 'Account Settings',
      description: 'Profile management and preferences',
      icon: Settings,
      color: 'text-indigo-500',
      articleCount: 14
    },
    {
      id: 'integration',
      name: 'dApp Integration',
      description: 'Using OneStep with external applications',
      icon: Globe,
      color: 'text-cyan-500',
      articleCount: 9
    }
  ]

  // Comprehensive FAQ database
  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'getting-started',
      question: 'How do I create my first OneStep account?',
      answer: 'Creating a OneStep account is simple and secure. Start by visiting our signup page and clicking "Sign Up". You\'ll connect via Telegram for identity verification, then set up your username, personal details, and choose your security preferences including passcode and biometric authentication. The entire process takes about 5-10 minutes.',
      helpful: 142,
      notHelpful: 8,
      tags: ['signup', 'account creation', 'getting started'],
      lastUpdated: '2024-11-15'
    },
    {
      id: '2',
      category: 'security',
      question: 'What security measures does OneStep use to protect my account?',
      answer: 'OneStep employs military-grade security including: end-to-end encryption for all data, multi-factor authentication via Telegram, biometric authentication (Touch/Face ID), device fingerprinting, real-time fraud detection, encrypted data storage, and continuous security monitoring. Your account data is protected both in transit and at rest using AES-256 encryption.',
      helpful: 89,
      notHelpful: 3,
      tags: ['security', 'encryption', 'protection'],
      lastUpdated: '2024-11-20'
    },
    {
      id: '3',
      category: 'authentication',
      question: 'How do I set up biometric authentication?',
      answer: 'To enable biometric authentication: 1) Go to Dashboard > Security, 2) Toggle on "Biometric Authentication", 3) Choose Touch ID or Face ID, 4) Follow the setup prompts on your device, 5) Test the authentication to ensure it works. Biometric data is stored locally on your device and never transmitted to our servers.',
      helpful: 256,
      notHelpful: 12,
      tags: ['biometrics', 'touch id', 'face id', 'setup'],
      lastUpdated: '2024-11-18'
    },
    {
      id: '4',
      category: 'authentication',
      question: 'Can I change my OneStep passcode?',
      answer: 'Yes! You can change your passcode anytime: 1) Navigate to Dashboard > Security, 2) Click "Change" next to OneStep Passcode, 3) Enter your new 6-digit passcode, 4) Confirm the change. Your new passcode must not be related to your date of birth and should be unique and memorable to you.',
      helpful: 198,
      notHelpful: 15,
      tags: ['passcode', 'change password', 'security'],
      lastUpdated: '2024-11-19'
    },
    {
      id: '5',
      category: 'devices',
      question: 'How many devices can I register with OneStep?',
      answer: 'You can register up to 5 trusted devices with your OneStep account. This includes smartphones, tablets, and computers. Each device is uniquely identified and monitored for security. You can manage your devices in Dashboard > Devices, where you can view, rename, or remove devices as needed.',
      helpful: 167,
      notHelpful: 7,
      tags: ['devices', 'device limit', 'trusted devices'],
      lastUpdated: '2024-11-17'
    },
    {
      id: '6',
      category: 'verification',
      question: 'What documents do I need for KYC verification?',
      answer: 'For identity verification, you need: 1) A valid government-issued photo ID (passport, national ID, or driver\'s license), 2) A clear selfie holding your ID document, 3) Proof of address (optional for some regions). Ensure all documents are current, clearly visible, and match your profile information. Processing typically takes 1-3 business days.',
      helpful: 324,
      notHelpful: 28,
      tags: ['kyc', 'verification', 'documents', 'identity'],
      lastUpdated: '2024-11-21'
    },
    {
      id: '7',
      category: 'troubleshooting',
      question: 'I\'m not receiving Telegram OTP codes. What should I do?',
      answer: 'If you\'re not receiving OTP codes: 1) Ensure you\'ve started a conversation with @OneStepTest6_BOT, 2) Check that Telegram notifications are enabled, 3) Verify your internet connection, 4) Try requesting a new code, 5) Check spam/archived chats in Telegram, 6) Restart the Telegram app. If problems persist, contact support immediately.',
      helpful: 445,
      notHelpful: 32,
      tags: ['telegram', 'otp', 'verification codes', 'troubleshooting'],
      lastUpdated: '2024-11-22'
    },
    {
      id: '8',
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'To update your profile: 1) Go to Dashboard > Profile, 2) Click "Edit Profile", 3) Modify the fields you want to change, 4) Click "Save Changes". Note that some changes (like email or phone) may require additional verification for security. Your OneStep ID and username cannot be changed once set.',
      helpful: 213,
      notHelpful: 9,
      tags: ['profile', 'update information', 'account management'],
      lastUpdated: '2024-11-16'
    },
    {
      id: '9',
      category: 'troubleshooting',
      question: 'Why is my account temporarily locked?',
      answer: 'Accounts may be temporarily locked for security reasons: multiple failed login attempts, suspicious activity detection, or security policy violations. Wait 30 minutes and try again, ensure you\'re using the correct credentials, check for any security alerts, or contact support if the issue persists. We prioritize account security over convenience.',
      helpful: 178,
      notHelpful: 45,
      tags: ['locked account', 'security', 'failed login'],
      lastUpdated: '2024-11-20'
    },
    {
      id: '10',
      category: 'integration',
      question: 'How do I connect OneStep to external dApps?',
      answer: 'To connect to dApps: 1) Visit the dApp website, 2) Look for "Connect with OneStep" or similar button, 3) Enter your OneStep ID when prompted, 4) Review the permissions requested, 5) Approve the connection. Your OneStep ID works across all supported platforms, providing seamless single sign-on authentication.',
      helpful: 267,
      notHelpful: 18,
      tags: ['dapps', 'integration', 'sso', 'connection'],
      lastUpdated: '2024-11-19'
    }
  ]

  // Contact options with different support channels
  const contactOptions: ContactOption[] = [
    {
      id: 'ticket',
      name: 'Support Ticket',
      description: 'Get detailed help from our support team',
      icon: MessageSquare,
      available: true,
      responseTime: 'Within 24 hours',
      action: () => setShowTicketForm(true)
    },
    {
      id: 'email',
      name: 'Email Support',
      description: 'Send us an email for non-urgent matters',
      icon: Mail,
      available: true,
      responseTime: '24-48 hours',
      action: () => window.open('mailto:support@onestep.com?subject=OneStep Support Request')
    },
    {
      id: 'live-chat',
      name: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: MessageSquare,
      available: false,
      responseTime: 'Immediate',
      action: () => console.log('Live chat coming soon')
    },
    {
      id: 'video-call',
      name: 'Video Support',
      description: 'Schedule a video call for complex issues',
      icon: Video,
      available: false,
      responseTime: 'Scheduled',
      action: () => console.log('Video support coming soon')
    }
  ]

  // Filter FAQs based on search and category
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  // Handle FAQ feedback
  const handleFeedback = (faqId: string, type: 'helpful' | 'not-helpful') => {
    setFeedbackGiven(prev => ({ ...prev, [faqId]: type }))
    // In a real app, this would send feedback to the server
    console.log(`FAQ ${faqId} marked as ${type}`)
  }

  // Handle support ticket submission
  const handleTicketSubmit = async () => {
    const errors: { subject?: string; message?: string } = {}
    if (!supportTicket.subject.trim()) {
      errors.subject = 'Subject is required'
    }
    if (!supportTicket.message.trim()) {
      errors.message = 'Message is required'
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSubmitting(true)
    
    try {
      // Simulate API call to submit support ticket
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form and show success
      setSupportTicket({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
        attachments: []
      })
      setShowTicketForm(false)
      setTicketSubmitted(true)
      
      // Hide success message after 5 seconds
      setTimeout(() => setTicketSubmitted(false), 5000)
      
    } catch (error) {
      console.error('Failed to submit ticket:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle file attachment for support tickets
  const handleFileAttachment = (files: FileList | null) => {
    if (!files) return
    
    const newAttachments = Array.from(files).filter(file => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      return true
    })
    
    setSupportTicket(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments].slice(0, 5) // Max 5 files
    }))
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setSupportTicket(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header with Search */}
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground-primary">Help & Support</h1>
          <p className="text-foreground-secondary max-w-2xl mx-auto">
            Get help with your OneStep account, learn about security features, and find answers to common questions.
          </p>
        </div>
        
        {/* Global Search */}
        <div className="max-w-lg mx-auto">
          <Input
            placeholder="Search help articles, guides, and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
            className="text-center"
          />
        </div>

        {/* Success message for ticket submission */}
        {ticketSubmitted && (
          <div className="max-w-md mx-auto p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
            <div className="flex items-center space-x-2 text-status-success">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Support ticket submitted successfully! We'll respond within 24 hours.</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-background-secondary rounded-2xl p-2 border border-border-primary">
        <div className="flex space-x-2">
          {[
            { id: 'faq', label: 'FAQ & Guides', icon: HelpCircle },
            { id: 'contact', label: 'Contact Support', icon: MessageSquare },
            { id: 'guides', label: 'Video Tutorials', icon: Video },
            { id: 'status', label: 'System Status', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-background-primary'
                  : 'text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ & Guides Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                  <LifeBuoy className="w-6 h-6 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground-primary">Quick Start Guide</h3>
                  <p className="text-sm text-foreground-secondary">Get up and running in 5 minutes</p>
                </div>
              </div>
              <Button variant="secondary" className="w-full">
                <Book className="w-4 h-4 mr-2" />
                Start Tutorial
              </Button>
            </div>

            <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground-primary">Security Center</h3>
                  <p className="text-sm text-foreground-secondary">Learn about account protection</p>
                </div>
              </div>
              <Link href="/dashboard/security">
                <Button variant="secondary" className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Settings
                </Button>
              </Link>
            </div>

            <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary hover:border-accent-primary/50 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground-primary">API Documentation</h3>
                  <p className="text-sm text-foreground-secondary">Developer resources and guides</p>
                </div>
              </div>
              <Button variant="secondary" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Docs
              </Button>
            </div>
          </div>

          {/* Help Categories */}
          <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
            <h3 className="text-lg font-semibold text-foreground-primary mb-6">Browse by Category</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-4 rounded-xl border transition-colors text-left ${
                  selectedCategory === 'all'
                    ? 'border-accent-primary bg-accent-primary/5'
                    : 'border-border-primary hover:border-border-secondary'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5 text-accent-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground-primary">All Topics</div>
                    <div className="text-xs text-foreground-tertiary">{faqs.length} articles</div>
                  </div>
                </div>
              </button>

              {helpCategories.slice(0, 7).map((category) => {
                const Icon = category.icon
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-xl border transition-colors text-left ${
                      selectedCategory === category.id
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border-primary hover:border-border-secondary'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${category.color}`} />
                      <div>
                        <div className="text-sm font-medium text-foreground-primary">{category.name}</div>
                        <div className="text-xs text-foreground-tertiary">{category.articleCount} articles</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* FAQ List */}
          <div className="bg-background-secondary rounded-2xl border border-border-primary overflow-hidden">
            <div className="p-6 border-b border-border-primary">
              <h3 className="text-lg font-semibold text-foreground-primary">
                Frequently Asked Questions ({filteredFAQs.length})
              </h3>
              {selectedCategory !== 'all' && (
                <p className="text-sm text-foreground-secondary mt-1">
                  Showing results for {helpCategories.find(c => c.id === selectedCategory)?.name}
                </p>
              )}
            </div>

            <div className="divide-y divide-border-primary">
              {filteredFAQs.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground-primary mb-2">No Results Found</h3>
                  <p className="text-foreground-secondary mb-4">
                    We couldn't find any articles matching your search. Try different keywords or browse by category.
                  </p>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredFAQs.map((faq) => (
                  <div key={faq.id} className="p-6">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <h4 className="text-sm font-semibold text-foreground-primary pr-4 group-hover:text-accent-primary transition-colors">
                        {faq.question}
                      </h4>
                      {expandedFAQ === faq.id ? (
                        <ChevronDown className="w-5 h-5 text-foreground-secondary flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-foreground-secondary flex-shrink-0 group-hover:text-accent-primary transition-colors" />
                      )}
                    </button>

                    {expandedFAQ === faq.id && (
                      <div className="mt-4 space-y-4">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm text-foreground-secondary leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {faq.tags.map(tag => (
                            <span 
                              key={tag}
                              className="px-2 py-1 bg-background-tertiary rounded-lg text-xs text-foreground-tertiary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Feedback and Metadata */}
                        <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                          <div className="flex items-center space-x-4">
                            <span className="text-xs text-foreground-tertiary">Was this helpful?</span>
                            
                            {feedbackGiven[faq.id] ? (
                              <span className="text-xs text-status-success">Thanks for your feedback!</span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleFeedback(faq.id, 'helpful')}
                                  className="flex items-center space-x-1 text-xs text-foreground-tertiary hover:text-accent-primary transition-colors"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>Yes ({faq.helpful})</span>
                                </button>
                                <button
                                  onClick={() => handleFeedback(faq.id, 'not-helpful')}
                                  className="flex items-center space-x-1 text-xs text-foreground-tertiary hover:text-status-error transition-colors"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                  <span>No ({faq.notHelpful})</span>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-foreground-tertiary">
                            Updated {new Date(faq.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactOptions.map(option => (
              <div 
                key={option.id}
                className={`bg-background-secondary rounded-2xl p-6 border transition-colors ${
                  option.available 
                    ? 'border-border-primary hover:border-accent-primary/50 cursor-pointer' 
                    : 'border-border-primary opacity-60'
                }`}
                onClick={option.available ? option.action : undefined}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    option.available ? 'bg-accent-primary/10' : 'bg-background-tertiary'
                  }`}>
                    <option.icon className={`w-6 h-6 ${
                      option.available ? 'text-accent-primary' : 'text-foreground-tertiary'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground-primary">{option.name}</h3>
                    <p className="text-sm text-foreground-secondary">{option.description}</p>
                  </div>
                  {!option.available && (
                    <span className="px-2 py-1 bg-background-tertiary rounded-lg text-xs text-foreground-tertiary">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-foreground-tertiary" />
                    <span className="text-sm text-foreground-secondary">{option.responseTime}</span>
                  </div>
                  {option.available && (
                    <ChevronRight className="w-5 h-5 text-foreground-tertiary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Support Ticket Form */}
          {showTicketForm && (
            <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground-primary">Submit a Support Ticket</h3>
                <Button variant="ghost" onClick={() => setShowTicketForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleTicketSubmit(); }}>
                {/* Subject */}
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Subject</div>
                  <Input
                    id="subject"
                    value={supportTicket.subject}
                    onChange={(e) => setSupportTicket(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Briefly describe your issue"
                    className={`mt-1 ${formErrors.subject ? 'border-status-error' : ''}`}
                  />
                  {formErrors.subject && <p className="text-sm text-status-error mt-1">{formErrors.subject}</p>}
                </div>

                {/* Category */}
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Category</div>
                  <div
                    // value={supportTicket.category}
                    // onValueChange={(value) => setSupportTicket(prev => ({ ...prev, category: value }))}
                  >
                    <div id="category" className="mt-1">
                      <Input placeholder="Select a category" />
                    </div>
                    <div>
                      <div >General Inquiry</div>
                      <div >Technical Issue</div>
                      <div >Account Problem</div>
                      <div >Security Concern</div>
                      <div >Billing Question</div>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Priority</div>
                  <div
                    // value={supportTicket.priority}
                    // onValueChange={(value) => setSupportTicket(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'urgent' }))}
                  >
                    <div id="priority" className="mt-1">
                      <Input placeholder="Select priority" />
                    </div>
                    <div>
                      <div >Low</div>
                      <div >Medium</div>
                      <div >High</div>
                      <div >Urgent</div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div  className="text-sm font-medium text-foreground-primary">Message</div>
                  <Input
                    id="message"
                    value={supportTicket.message}
                    onChange={(e) => setSupportTicket(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue in detail"
                    // rows={6}
                    className={`mt-1 ${formErrors.message ? 'border-status-error' : ''}`}
                  />
                  {formErrors.message && <p className="text-sm text-status-error mt-1">{formErrors.message}</p>}
                </div>

                {/* Attachments */}
                <div>
                  <div className="text-sm font-medium text-foreground-primary">Attachments (optional)</div>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => handleFileAttachment(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button variant="secondary">
                      Upload Files
                    </Button>
                    <span className="text-sm text-foreground-secondary">Max 5 files, 10MB each</span>
                  </div>
                  {supportTicket.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {supportTicket.attachments.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-foreground-secondary">
                          <FileText className="w-4 h-4" />
                          <span>{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Video Tutorials Tab */}
      {activeTab === 'guides' && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary text-center">
          <Video className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground-primary mb-2">Video Tutorials Coming Soon</h3>
          <p className="text-foreground-secondary">We're working on creating comprehensive video guides to help you get the most out of OneStep.</p>
        </div>
      )}

      {/* System Status Tab */}
      {activeTab === 'status' && (
        <div className="bg-background-secondary rounded-2xl p-6 border border-border-primary text-center">
          <Zap className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground-primary mb-2">System Status</h3>
          <p className="text-foreground-secondary">All systems are operational. Check back for real-time status updates.</p>
        </div>
      )}
    </div>
  )
}