import { motion } from 'framer-motion'
import { Shield, Scale, Lock, Eye, Database, Mail, ArrowLeft, Globe, UserCheck, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const lastUpdated = 'October 23, 2026'

// Plain-language privacy notice under the Nigeria Data Protection Act 2023.
const sections = [
  {
    icon: FileText,
    title: '1. Who is responsible for your data',
    content: `AI-Con Digitals Nigeria Limited, B96, Along Law School Road, Opp. JAMB Office, Bwari, Abuja, operates Prove Ownership and is the data controller for the personal data described here. We process personal data in line with the Nigeria Data Protection Act 2023 (NDPA) and the rules of the Nigeria Data Protection Commission (NDPC).

Questions or requests: support@proveownership.com (subject "Data protection").`
  },
  {
    icon: Database,
    title: '2. What we collect',
    content: `Account: your name, email, phone number, region, password (stored only as a secure hash) and account type.

Identity: your National Identification Number (NIN) and, when we look it up, the details our identity partner returns from your NIMC record: names, date of birth, gender, photo and address. For businesses: the registration (RC/BN) number and the CAC details returned, including company name, status, address and directors. Your NIN is stored encrypted, together with a one-way fingerprint so we can recognise it again without decrypting it. The returned details are also stored encrypted. We never show your NIN back to you or to anyone else.

Your items: descriptions and identifying numbers (IMEI, serial, VIN, certificate numbers), proof-of-ownership documents and photos, reports, claims, transfers and listings.

Checks: when you check an item we record who checked, when, your approximate location (your browser asks your permission to share it) and technical details of your device and connection (browser, device identifiers, IP address), to prevent fraud.

Payments: amount, purpose, payment reference and status. Card details are handled by Paystack; we never see or store them.

Security: sign-in history, the device id your browser keeps for "remember this device", and security events.`
  },
  {
    icon: Eye,
    title: '3. Why we use it, and our legal basis',
    content: `(a) To run your account and provide the Platform: registering items, checks, reports, holds, releases, transfers and the marketplace. Basis: contract.

(b) To confirm your identity on reports, claims and business verification, and to stop one NIN or business being used on several accounts. Basis: contract, and our legitimate interest in preventing fraud.

(c) To show item owners who checked their items and when, and to help the police with reported items. Basis: legitimate interest in preventing theft and the trade in stolen items, and legal obligation where the police make a lawful request.

(d) To take payments and keep financial records. Basis: contract and legal obligation (tax and accounting).

(e) To keep the Platform secure, investigate abuse and enforce our Terms. Basis: legitimate interest.

(f) To send service messages, for example sign-in codes, report updates and "your item has been found". Basis: contract. We send marketing only if you agree, and you can stop it at any time.

We do not sell your personal data, and we do not use it for automated decisions with legal effects without a person able to review them. Identity mismatches and ownership disputes are reviewed by our team.`
  },
  {
    icon: Globe,
    title: '4. Who we share it with',
    content: `• Prembly (identity verification): your NIN or business number, to look up your NIMC or CAC record. This happens only the first time a number is checked.
• Paystack (payments).
• Our email and SMS providers, to send you messages.
• The police and law enforcement agencies: details of reported items, holds, finds, owners and check history needed for a case, and anything we are lawfully required to provide.
• Owners of items you check: your name and the time and approximate place of the check.
• Buyers and sellers on the marketplace: the details needed to complete a sale.
• Our hosting and technical providers, under contracts that require them to protect your data.
• A buyer or successor of our business, under the same protections.`
  },
  {
    icon: Lock,
    title: '5. How we protect it',
    content: `NINs and identity details are encrypted at rest. Data is sent over encrypted connections, access is limited to staff who need it, and administrator and police accounts use two-step sign-in. Proof documents are private and can only be opened by you and our reviewers. No system is perfectly secure. If a breach is likely to put you at risk, we will tell you and the NDPC as the law requires.`
  },
  {
    icon: Database,
    title: '6. How long we keep it',
    content: `• Account and item records: while your account is open, then for up to 2 years so ownership history and disputes can still be resolved.
• Identity records (NIN or CAC details): while your account is open, then 2 years, so the same number cannot be used to create new accounts straight away.
• Reports, holds, releases and check history: 6 years, as they may be needed by the police or the courts.
• Payment records: 6 years, as required for tax and accounting.
• Security logs: up to 12 months.
After these periods data is deleted or anonymised.`
  },
  {
    icon: Scale,
    title: '7. Your rights',
    content: `Under the NDPA you can ask us to:
• give you a copy of your personal data;
• correct inaccurate data (a locked name can be corrected by support with proof);
• delete your data, where we no longer need to keep it;
• restrict or object to certain uses;
• give you your data in a portable format;
• withdraw consent, where we rely on it.

Email support@proveownership.com and we will respond within 30 days. Some data, such as reports and payment records, may have to be kept for the periods above even after a request. You can also complain to the Nigeria Data Protection Commission (ndpc.gov.ng).`
  },
  {
    icon: Globe,
    title: '8. Transfers outside Nigeria',
    content: `Some of our providers may store or process data outside Nigeria. When they do, we make sure there is adequate protection as the NDPA requires, for example contractual safeguards.`
  },
  {
    icon: UserCheck,
    title: '9. Children',
    content: `Prove Ownership is for people aged 18 and over. We do not knowingly collect data from children. If you think a child has an account, contact us and we will delete it.`
  },
  {
    icon: Shield,
    title: '10. Cookies and browser storage',
    content: `We use only what is needed to run the Platform, such as keeping you signed in, remembering your browser and your cart. We do not use advertising or tracking cookies. Details are in our Cookie Policy.`
  },
  {
    icon: Mail,
    title: '11. Changes and contact',
    content: `We will post any changes here with a new date and tell you about important ones.

AI-Con Digitals Nigeria Limited (Prove Ownership)
B96, Along Law School Road, Opp. JAMB Office, Bwari, Abuja, Nigeria
Email: support@proveownership.com · Phone: 08034875647, 08120212639`
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
