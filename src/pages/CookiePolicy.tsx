import { motion } from 'framer-motion'
import { Cookie, Shield, Eye, Settings, BarChart3, AlertTriangle, ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const lastUpdated = 'October 23, 2026'

// Lists exactly what the app stores in the browser (checked against the code).
const sections = [
  {
    icon: Cookie,
    title: 'Cookies and browser storage',
    content: `Cookies are small files a website saves in your browser. Prove Ownership mostly uses your browser's own storage (local storage and session storage), which works in a similar way. This page lists everything we store and why.

We do not use advertising, analytics or tracking cookies, and we do not let advertisers track you on our site.`
  },
  {
    icon: Shield,
    title: 'Strictly necessary (always on)',
    content: `These are needed for the Platform to work. You cannot switch them off in our app, though your browser can delete them; you will then be signed out.

• auth_token (local storage): keeps you signed in. Removed when you sign out. A sign-in lasts 1 day, or 30 days with "Remember me" (7 days for administrator and police accounts).
• user_data (local storage): your name and account type, so pages load quickly. Removed when you sign out.
• po_device_id (local storage): a random id for this browser, used for "remember this device" and to protect your account. It contains nothing about you. Kept until you clear your browser storage.
• post_login_redirect (session storage): returns you to the page you were on after you sign in. Cleared when you close the tab.
• po_report_payment and po_business_payment (session storage): keep a payment you have made available while you finish the report or verification it is for, so you are not charged twice. Cleared when the action is completed or the tab is closed.`
  },
  {
    icon: Settings,
    title: 'Preferences',
    content: `• theme (local storage): remembers whether you chose light or dark mode.
• proveownership_cart (local storage): the items in your marketplace cart.
• landing_content_cache (local storage): a copy of the home page's team and testimonial content for up to an hour, so it loads faster.
• last_ui_error / last_runtime_error (local storage): a short note of the last error the app hit, to help support fix problems. It contains no personal data.`
  },
  {
    icon: AlertTriangle,
    title: 'Security and fraud prevention',
    content: `When you sign in or check an item, the app sends technical details of your device and connection, for example browser, screen, time zone and IP address, and for checks your approximate location if you allow it. These are used to protect accounts, prevent fraud and record checks as explained in our Privacy Policy. They are sent to our server and are not stored as cookies.`
  },
  {
    icon: Eye,
    title: 'Other companies',
    content: `• Google Fonts: our pages load fonts from Google's servers, which receive your IP address and browser details when the fonts download. Google does not set tracking cookies for this.
• Paystack: when you pay, you are taken to Paystack's secure page, which uses its own cookies for security and to process the payment. See Paystack's privacy and cookie policies.`
  },
  {
    icon: Settings,
    title: 'Managing storage',
    content: `You can clear cookies and site data at any time in your browser's settings (usually under Privacy → Clear browsing data, or Site settings). Clearing Prove Ownership's data signs you out and forgets this browser, so you will be asked for a sign-in code next time.`
  },
  {
    icon: Mail,
    title: 'Changes and contact',
    content: `If we start using anything new, we will update this page and, where the law requires, ask for your consent first.

Questions: support@proveownership.com`
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
