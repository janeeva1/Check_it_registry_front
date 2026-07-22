import { motion } from 'framer-motion'
import { Cookie, Shield, Eye, Settings, BarChart3, AlertTriangle, ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const lastUpdated = 'July 21, 2026'

const sections = [
  {
    icon: Cookie,
    title: 'What Are Cookies',
    content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners. Cookies help us understand how you use our Platform and improve your experience.

This Cookie Policy explains what cookies we use, why we use them, and how you can manage your cookie preferences.`
  },
  {
    icon: Shield,
    title: 'Essential Cookies (Strictly Necessary)',
    content: `These cookies are necessary for the Platform to function and cannot be switched off. They are set in response to your actions such as logging in, setting privacy preferences, or filling in forms.

Cookie: session_token
Purpose: Maintains your authenticated session
Duration: Until browser is closed or session expires (60 minutes of inactivity)
Required: Yes — Platform will not function without this cookie

Cookie: csrf_token
Purpose: Protects against Cross-Site Request Forgery attacks
Duration: Session
Required: Yes — Essential security measure

Cookie: auth_token
Purpose: Stores your JWT authentication token for persistent login
Duration: 30 days (or until logout)
Required: Yes — Enables "Remember Me" functionality

Cookie: cart_session
Purpose: Maintains your shopping cart state across pages
Duration: 7 days
Required: Yes — Essential for marketplace functionality

Cookie: device_fingerprint
Purpose: Used for fraud prevention during device checks
Duration: 30 days
Required: Yes — Helps prevent abuse of the device check system`
  },
  {
    icon: Eye,
    title: 'Functional Cookies',
    content: `These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.

Cookie: theme_preference
Purpose: Stores your display preference (light/dark/auto mode)
Duration: 365 days
Required: No — You can disable this cookie

Cookie: language
Purpose: Stores your language preference
Duration: 365 days
Required: No — You can disable this cookie

Cookie: sidebar_state
Purpose: Remembers whether the sidebar is open or collapsed
Duration: 30 days
Required: No — You can disable this cookie

Cookie: notification_settings
Purpose: Stores your notification preference settings
Duration: 30 days
Required: No — You can disable this cookie`
  },
  {
    icon: BarChart3,
    title: 'Analytics Cookies',
    content: `These cookies help us understand how visitors interact with our Platform by collecting and reporting information anonymously. We use this data to improve our services and user experience.

Cookie: _ga (Google Analytics)
Purpose: Distinguishes unique users and tracks page views
Duration: 2 years
Required: No — You can disable this cookie

Cookie: _gid (Google Analytics)
Purpose: Distinguishes unique users for 24-hour period
Duration: 24 hours
Required: No — You can disable this cookie

Cookie: analytics_session
Purpose: Tracks session behavior for performance analysis
Duration: Session
Required: No — You can disable this cookie

Note: We do not use Google Analytics or any third-party analytics on pages where sensitive data is entered (login, registration, payment, KYC verification).`
  },
  {
    icon: Settings,
    title: 'Device Fingerprinting for Fraud Prevention',
    content: `During device checks and certain security-sensitive operations, we collect device fingerprint data. This is NOT a traditional cookie but rather a JavaScript-based identification technique used for fraud prevention.

Data collected:
• Canvas fingerprint (unique rendering characteristics of your browser)
• WebGL renderer information
• Browser plugin list
• Screen resolution and color depth
• Timezone and language settings
• Font list
• Platform and user agent information

Purpose:
This data is used exclusively to:
• Prevent automated abuse of the device check system
• Detect and block fraudulent activity
• Protect against bot attacks
• Ensure fair usage of free tier services

Retention: Device fingerprint data is retained for 30 days and is stored separately from your personal account data. It is used only for fraud detection and is not shared with third parties.

You may disable JavaScript to prevent fingerprint collection, but this will prevent the device check service from functioning properly.`
  },
  {
    icon: AlertTriangle,
    title: 'Third-Party Cookies',
    content: `Some cookies are set by third-party services that appear on our pages. We do not control these third-party cookies. The following third-party services may set cookies:

Paystack (Payment Processor):
• Purpose: Payment processing and fraud prevention
• Cookies: _paystack_* (set during checkout)
• Privacy Policy: https://paystack.com/privacy

Google (Analytics):
• Purpose: Website analytics and performance monitoring
• Cookies: _ga, _gid, _gat
• Privacy Policy: https://policies.google.com/privacy

Resend (Email Service):
• Purpose: Email delivery tracking (open rates, click rates)
• Cookies: None (uses pixel tracking in emails)

We do not sell your data to third parties. Third-party cookies are used solely for the purposes described above and are governed by the respective third parties' privacy policies.`
  },
  {
    icon: Shield,
    title: 'Managing Your Cookie Preferences',
    content: `You can control and manage cookies in several ways:

1. BROWSER SETTINGS
Most web browsers allow you to control cookies through their settings. You can typically:
• View what cookies are set
• Delete existing cookies
• Block all cookies
• Block cookies from specific sites
• Accept all cookies

Note: Blocking essential cookies may prevent the Platform from functioning correctly. You may not be able to log in, use the marketplace, or perform device checks.

2. IN-APP SETTINGS
You can manage some cookie preferences through the Platform's Settings page:
• Theme preference (functional cookie)
• Language preference (functional cookie)
• Notification settings (functional cookie)

3. OPT-OUT LINKS
For analytics cookies, you can opt out at:
• Google Analytics Opt-out: https://tools.google.com/dlpage/gaoptout

4. COOKIE BANNER
When you first visit the Platform, you will be presented with a cookie consent banner allowing you to accept or decline non-essential cookies. You can change your preferences at any time by clicking the "Cookie Settings" link in the footer.`
  },
  {
    icon: Eye,
    title: 'Do Not Track (DNT)',
    content: `Some browsers offer a "Do Not Track" (DNT) setting. There is currently no universally accepted standard for how websites should respond to DNT signals. At this time, our Platform does not respond to DNT signals. However, you can manage tracking through the cookie controls described in this policy.

For users in jurisdictions that require explicit consent for non-essential cookies, our cookie consent banner provides granular control over which cookie categories you allow.`
  },
  {
    icon: Cookie,
    title: 'Changes to This Cookie Policy',
    content: `We may update this Cookie Policy from time to time to reflect changes in our practices, technologies, legal requirements, or for other operational reasons. When we make material changes, we will update the "Last Updated" date at the top of this policy and, where appropriate, notify you via email or through a banner on the Platform.

We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.`
  },
  {
    icon: Mail,
    title: 'Contact Us',
    content: `If you have any questions about our use of cookies or this Cookie Policy, please contact us at:

Email: privacy@proveownership.com
Website: https://dev.proveownership.com
Support: support@proveownership.com

We will respond to cookie-related inquiries within 30 business days.`
  },
]

export default function CookiePolicy() {
  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: 900, padding: '40px 20px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Back Link */}
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none', marginBottom: 24, fontWeight: 500 }}>
              <ArrowLeft size={16} /> Back to Home
            </Link>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                <Cookie size={32} color="white" />
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Cookie Policy
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Effective Date: {lastUpdated} | Last Updated: {lastUpdated}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 8, maxWidth: 600, margin: '8px auto 0' }}>
                This policy explains how Prove Ownership uses cookies and similar technologies when you visit our platform.
              </p>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {sections.map((section, i) => {
                const Icon = section.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '28px 32px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} style={{ color: 'var(--primary-600)' }} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{section.title}</h3>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                      {section.content}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Footer Links */}
            <div style={{ marginTop: 48, padding: '24px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                By using Prove Ownership, you agree to our Terms of Service, Privacy Policy, and Cookie Policy.
              </p>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/terms" style={{ color: 'var(--primary-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Terms of Service</Link>
                <Link to="/privacy" style={{ color: 'var(--primary-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</Link>
                <Link to="/cookies" style={{ color: 'var(--primary-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Cookie Policy</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
