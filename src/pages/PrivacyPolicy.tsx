import { motion } from 'framer-motion'
import { Shield, BookOpen, Scale, Lock, Eye, Database, Mail, ArrowLeft, Globe, UserCheck, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const lastUpdated = 'July 21, 2026'

const sections = [
  {
    icon: FileText,
    title: '1. Introduction & Scope',
    content: `This Privacy Policy describes how Check It — Smart Device Registry & Recovery System ("Check It," "we," "us," or "our") collects, uses, stores, shares, and protects your personal information when you use our website, mobile application, APIs, and related services (collectively, the "Platform").

By using the Platform, you consent to the practices described in this Privacy Policy. If you do not agree, please do not use the Platform.

This Privacy Policy applies to all users, including visitors, registered users, business accounts, law enforcement agencies, and administrators.`
  },
  {
    icon: Shield,
    title: '2. Information We Collect',
    content: `2.1 INFORMATION YOU PROVIDE DIRECTLY:
• Account Registration: name, email address, password (hashed), phone number, region/country
• Device Registration: IMEI, serial number, brand, model, color, device images, proof of ownership documents
• KYC Verification: National Identification Number (NIN), selfie photograph, face comparison data
• Reports: stolen/lost/found device reports including descriptions, locations, evidence, police report numbers
• Marketplace: listing titles, descriptions, prices, device conditions, bank account details for payouts
• Payments: payment method details (processed by Paystack — we do not store card numbers)
• Profile: profile image, business registration details, LEA agency information
• Communications: messages sent through the marketplace inbox, support inquiries
• Device Checks: IMEI/serial numbers you search, device fingerprint data, GPS location, IP address

2.2 INFORMATION COLLECTED AUTOMATICALLY:
• Log Data: IP address, browser type, operating system, referring URLs, pages visited, time spent
• Device Information: device type, screen resolution, browser plugins, platform
• Device Fingerprints: canvas fingerprint, WebGL renderer, font list, timezone, language (collected during device checks for fraud prevention)
• Cookies: session tokens, authentication tokens, preference cookies, analytics cookies (see Cookie Policy)
• Location Data: approximate location derived from IP address; precise GPS location when voluntarily provided during device checks

2.3 INFORMATION FROM THIRD PARTIES:
• Verification Providers (Prembly, Dojah, VerifyNG): NIN verification results, face match scores
• Payment Provider (Paystack): transaction confirmations, payment status
• Law Enforcement Agencies: case updates, investigation information`
  },
  {
    icon: Eye,
    title: '3. How We Use Your Information',
    content: `We use your information for the following purposes:

3.1 SERVICE PROVISION:
• Creating and managing your account
• Registering and maintaining device records
• Processing device checks and providing status results
• Facilitating device ownership transfers
• Operating the peer-to-peer marketplace
• Processing payments and escrow transactions
• Coordinating with law enforcement on device recovery cases

3.2 COMMUNICATIONS:
• Sending account verification emails (registration, password reset)
• Sending device status notifications (verified, rejected, stolen, found)
• Sending marketplace notifications (new messages, order updates, payment confirmations)
• Sending transfer request notifications (OTP codes, transfer confirmations)
• Sending system alerts and security notifications
• Responding to your support inquiries

3.3 SECURITY & FRAUD PREVENTION:
• Authenticating your identity and securing your account
• Detecting and preventing fraud, abuse, and unauthorized access
• Analyzing device check patterns to identify suspicious activity
• Maintaining audit logs of platform activity
• Generating risk scores for device checks and user behavior

3.4 LEGAL COMPLIANCE:
• Complying with applicable laws and regulations
• Responding to lawful requests from law enforcement
• Cooperating with legal proceedings and court orders
• Maintaining records as required by Nigerian law

3.5 PLATFORM IMPROVEMENT:
• Analyzing usage patterns to improve our services
• Conducting research and analytics (using anonymized/aggregated data)
• Developing new features and functionality
• Testing and debugging platform functionality`
  },
  {
    icon: Database,
    title: '4. How We Share Your Information',
    content: `We do NOT sell your personal information. We may share your information in the following circumstances:

4.1 WITH OTHER USERS:
• Your name and device status are visible when you register devices or create marketplace listings
• When you report a device, relevant information is shared with administrators and may be shared with law enforcement
• Marketplace participants can see each other's names and listing information

4.2 WITH LAW ENFORCEMENT:
• Device reports (stolen/lost/found) may be automatically shared with registered law enforcement agencies in your region
• We may share information in response to valid legal process (subpoenas, court orders, warrants)
• We may proactively share information to assist in criminal investigations involving stolen devices

4.3 WITH SERVICE PROVIDERS:
• Paystack: payment processing (transaction data only)
• Prembly/Dojah/VerifyNG: identity verification (NIN and selfie data)
• Resend: email delivery (email address, email content)
• Twilio: SMS delivery (phone number, message content)
• Hosting providers: data storage and platform infrastructure

All service providers are contractually obligated to protect your information and use it only for the services they provide to us.

4.4 FOR BUSINESS TRANSFERS:
In the event of a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any change in ownership or use of your personal information.

4.5 WITH YOUR CONSENT:
We may share information for purposes not described in this policy with your explicit consent.`
  },
  {
    icon: Lock,
    title: '5. Data Security',
    content: `5.1 SECURITY MEASURES:
We implement industry-standard security measures to protect your information:
• Data encryption in transit (TLS/SSL) and at rest (AES-256)
• Secure password hashing (bcrypt)
• JWT-based authentication with configurable session expiry
• Role-based access control (user, business, admin, LEA)
• Rate limiting and brute-force protection on authentication endpoints
• Input validation and sanitization on all API endpoints
• Regular security audits and vulnerability assessments
• Audit logging of all administrative and sensitive actions

5.2 DATA STORAGE:
Your data is stored on secure cloud servers with:
• Automated daily backups
• Redundant storage across multiple availability zones
• Firewall protection and intrusion detection systems
• Physical security controls at data center facilities

5.3 LIMITATIONS:
While we implement strong security measures, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data. You are responsible for maintaining the confidentiality of your account credentials.

5.4 BREACH NOTIFICATION:
In the event of a data breach that affects your personal information, we will notify you via email within 72 hours of discovering the breach, as required by applicable data protection laws.`
  },
  {
    icon: Scale,
    title: '6. Your Rights',
    content: `You have the following rights regarding your personal information:

6.1 ACCESS: You can request a copy of all personal information we hold about you. We will provide this within 30 days of your request.

6.2 RECTIFICATION: You can update or correct your personal information through your account settings or by contacting us.

6.3 DELETION: You can request deletion of your account and personal information. We will process deletion requests within 30 days, except where retention is required by law.

6.4 DATA PORTABILITY: You can request your data in a structured, commonly used, machine-readable format (JSON/CSV).

6.5 RESTRICTION: You can request that we restrict processing of your personal information in certain circumstances.

6.6 OBJECTION: You can object to processing of your personal information for direct marketing purposes.

6.7 WITHDRAW CONSENT: Where processing is based on your consent, you can withdraw consent at any time without affecting the lawfulness of prior processing.

TO EXERCISE THESE RIGHTS:
Email: privacy@proveownership.com
Include: Your full name, email address, and specific request.
We will respond within 30 business days.

Note: Some information may be retained after account deletion as required by law (e.g., financial records for tax compliance, audit logs for security).`
  },
  {
    icon: Globe,
    title: '7. International Data Transfers',
    content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

When we transfer data internationally, we ensure appropriate safeguards are in place, including:
• Standard contractual clauses with service providers
• Adequacy decisions by relevant data protection authorities
• Your explicit consent where required

Our primary data processing occurs in Nigeria and the United States. By using the Platform, you consent to the transfer of your information to these locations.`
  },
  {
    icon: Database,
    title: '8. Data Retention',
    content: `We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy:

• Active accounts: Data retained while account is active
• Device records: Retained for the lifetime of the platform for device history
• Transaction records: Retained for 7 years (financial compliance)
• Audit logs: Retained for 5 years (security and compliance)
• Device check logs: Retained for 1 year (fraud prevention)
• Notification records: Retained for 90 days
• KYC data: Raw biometric data deleted after verification; verification result retained for account lifetime
• Support communications: Retained for 3 years

After the applicable retention period, data is securely deleted or anonymized so that it can no longer be associated with you.`
  },
  {
    icon: UserCheck,
    title: '9. Children\'s Privacy',
    content: `The Platform is not intended for use by children under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information promptly.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@proveownership.com.`
  },
  {
    icon: Lock,
    title: '10. Cookie Policy',
    content: `We use cookies and similar technologies as described in our Cookie Policy. In summary:

• Essential cookies: Required for the Platform to function (authentication, security, session management)
• Functional cookies: Remember your preferences (theme, language, notification settings)
• Analytics cookies: Help us understand usage patterns (Google Analytics — anonymized)
• Device fingerprints: Collected during device checks for fraud prevention

You can manage cookie preferences through your browser settings or our in-app cookie settings. See our full Cookie Policy for details.

Note: Device fingerprint data collected during device checks is used exclusively for fraud prevention and is not linked to your account data.`
  },
  {
    icon: Scale,
    title: '11. Legal Basis for Processing (GDPR)',
    content: `For users in jurisdictions covered by the General Data Protection Regulation (GDPR), we process your personal data based on the following legal grounds:

• Consent: When you create an account, register devices, or use optional features (KYC, marketplace)
• Contract: When processing is necessary for the performance of our Terms of Service
• Legal Obligation: When we must retain data for tax, financial, or regulatory compliance
• Legitimate Interest: For fraud prevention, security monitoring, and platform improvement

You may withdraw consent at any time where consent is the basis for processing. Withdrawal does not affect the lawfulness of processing prior to withdrawal.`
  },
  {
    icon: Mail,
    title: '12. Contact Us',
    content: `For questions, concerns, or requests regarding this Privacy Policy or your personal data:

Data Controller: Check It — Smart Device Registry & Recovery System
Email: privacy@proveownership.com
Legal: legal@proveownership.com
Support: support@proveownership.com
Website: https://dev.proveownership.com

For data protection inquiries, please include "Privacy Request" in your email subject line.

We will respond to privacy-related inquiries within 30 business days.

If you are not satisfied with our response, you have the right to lodge a complaint with the relevant data protection authority in your jurisdiction.`
  },
]

export default function PrivacyPolicy() {
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
                <Shield size={32} color="white" />
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Privacy Policy
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Effective Date: {lastUpdated} | Last Updated: {lastUpdated}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 8, maxWidth: 600, margin: '8px auto 0' }}>
                Your privacy is important to us. This policy explains what information we collect, how we use it, and your rights.
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
                By using Check It, you agree to our Terms of Service, Privacy Policy, and Cookie Policy.
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
