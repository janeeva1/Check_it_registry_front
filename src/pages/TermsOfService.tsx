import { motion } from 'framer-motion'
import { Scale, Shield, AlertTriangle, UserCheck, CreditCard, Database, Lock, Mail, Globe, FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const lastUpdated = 'October 23, 2026'

// Plain-language Terms. Fees are set by Prove Ownership's administrators and
// always shown before you pay; the amounts below are therefore not fixed here.
const sections = [
  {
    icon: FileText,
    title: '1. Who we are and these Terms',
    content: `Prove Ownership ("Prove Ownership", "we", "us") is a device and property registry operated by AI-Con Digitals Nigeria Limited, B96, Along Law School Road, Opp. JAMB Office, Bwari, Abuja, Nigeria.

These Terms are a binding agreement between you and us. They apply whenever you use the Prove Ownership website, app or API ("the Platform"). By creating an account or using the Platform you accept them. If you do not accept them, do not use the Platform.

We may update these Terms. We will show the new date at the top of this page and, for important changes, tell you by email or in the app before they take effect. If you keep using the Platform after that, you accept the updated Terms.`
  },
  {
    icon: UserCheck,
    title: '2. What Prove Ownership does',
    content: `With a Prove Ownership account you can:

(a) register your phones, computers, vehicles, jewellery and other valuables, and prove that you own them;
(b) check an item before you buy it, to see whether it is registered, reported stolen or lost, claimed by someone else or held by Prove Ownership;
(c) see who has checked your own items (your check history and tracker);
(d) report an item stolen, lost or found, and have it held by Prove Ownership while it is missing;
(e) transfer an item to a new owner;
(f) buy and sell verified items on the Prove Ownership marketplace;
(g) work with the police on reported items.

Checks are only for registered, signed-in users. There is no public check.

Prove Ownership is a registry and notification service. We do not physically track, find or seize items, and we do not guarantee that a missing item will be recovered.`
  },
  {
    icon: Shield,
    title: '3. Your account',
    content: `3.1 You must be at least 18 and able to enter into a contract.

3.2 Use your real name, exactly as it appears on your National Identification Number (NIN) record. Your identity is checked against it (section 6).

3.3 One person, one account. A NIN or business registration number can be linked to one account only.

3.4 Keep your password and sign-in codes private. You are responsible for everything done with your account. Tell us at once if you think someone else has used it.

3.5 "Remember this device" keeps a browser signed in and skips the emailed code for a while (30 days, or 7 days for administrator and police accounts). Do not use it on a shared computer.

3.6 We may suspend or close an account that breaks these Terms, gives false information, makes false reports or claims, abuses checks, or puts others at risk. Where the law allows, we will tell you why.`
  },
  {
    icon: Database,
    title: '4. Registering items and proving ownership',
    content: `4.1 You may only register items you own. Each item has an identifying number (for example IMEI, serial number, VIN or certificate number). The details you give must be true.

4.2 An item may show as "Registered" or as "Verified owner". "Verified owner" means our team has reviewed and accepted your proof of ownership, such as a receipt, vehicle papers or a photo of the item's serial label.

4.3 If an item is already registered to someone else, you can claim it by sending proof. Our team reviews both sides and decides. Knowingly making a false claim is fraud. We may close your account and give the evidence to the police.

4.4 Registration or verification is a record that helps prove ownership. It is not a legal title, and it does not replace any document required by law (for example vehicle registration).`
  },
  {
    icon: AlertTriangle,
    title: '5. Reporting an item stolen or lost',
    content: `5.1 You can report an item you own that is registered and confirmed on your account.

5.2 Every report has a report fee. The fee is set by Prove Ownership's administrators and shown to you before you pay. It applies to every report, including second and later ones, and even if you have reported, paid and confirmed your identity before.

5.3 Every report also needs your identity confirmed (section 6). Your payment is only used when your report is actually filed. If your identity cannot be confirmed, the payment is kept for you to try again. One payment covers one report.

5.4 Making a false report is an offence. We may close your account, keep any fees paid and share the details with the police.

5.5 When you report an item stolen or lost, it is held by Prove Ownership (section 7) and the police for your area are told.`
  },
  {
    icon: UserCheck,
    title: '6. Identity checks',
    content: `6.1 Each time you file a report you enter your NIN. Business accounts may instead enter their business registration (RC/BN) number. You can also confirm your identity at any time on the "Your identity" page, at no charge.

6.2 We confirm the number with our identity partner, Prembly, which checks it against the National Identity Management Commission (NIMC) record, or the Corporate Affairs Commission (CAC) record for businesses. We save the details returned, encrypted, so the same number does not need to be looked up again. Later checks compare the number you enter, and the saved details, with the name on your account.

6.3 Your name must match your NIN record. Once your identity is confirmed, the name on your account is locked; contact support if it needs correcting.

6.4 After 3 unsuccessful attempts in a day, identity checks pause until the next day. Repeated mismatches are reviewed by our team.

6.5 Business verification: a business pays the business verification fee once, shown before payment. Its CAC registration must be active and its name must match the business details on its account. The account holder must be one of the company's directors, or must first confirm their own NIN. A failed attempt keeps the payment for the next try. Once verified, the business name and registration number are locked.`
  },
  {
    icon: Lock,
    title: '7. Items held by Prove Ownership and the release fee',
    content: `7.1 From the moment an item is reported stolen or lost, Prove Ownership becomes its temporary holder ("custodian") on the registry. You remain the owner on record. While it is held:
   (a) it cannot be transferred, sold, listed on the marketplace, released or registered by anyone else;
   (b) anyone who checks it is told it is held by Prove Ownership and must not be bought;
   (c) the police and Prove Ownership may act on it to help return it to you.

7.2 When the item is found (by the police, by a finder through "Report Found", or by our team), we tell you. To have it released back to you, you pay the release fee. The fee is set by the administrators and shown before you pay. If you get the item back yourself, you can mark it as back with you and pay the release fee to end the hold.

7.3 After the release fee is paid, the police or our team hand the item back to you, and you may be asked for an ID matching your account. The item then returns to your account as normal and the report is closed.

7.4 If a report is dismissed (for example, made in error), the hold ends without a release fee. Administrators may waive the release fee in individual cases.

7.5 Being held by Prove Ownership is a registry status. We do not take physical possession of items unless we agree to in writing, and we are not responsible for an item's condition.`
  },
  {
    icon: Globe,
    title: '8. Checking items',
    content: `8.1 Checks are for signed-in users. A number of free checks may be included; after that, each check has a check fee, shown before you pay.

8.2 For safety and fraud prevention, a check records who checked and roughly where (your device location, which your browser asks your permission to share), plus technical details of your device. The item's owner can see who checked their item and when, and the police can see check history for reported items.

8.3 A check shows the item's status in our registry at that moment. It is not a guarantee about the item's history or condition. Always inspect an item and its documents before you buy.`
  },
  {
    icon: CreditCard,
    title: '9. Fees, payments and refunds',
    content: `9.1 Fees may include: report fee, release fee, check fee, business verification fee, and marketplace commission (taken from the seller). Each fee is set by our administrators and shown in naira (₦) before you pay. We may change fees, but a change never affects a payment you have already made.

9.2 Payments are processed by Paystack. We do not see or store your card details.

9.3 A payment covers the single action it was made for: one report, one release, one check or one business verification. It is used when that action is completed. Until then it stays available to you; for example, after a failed identity check you can try again without paying twice.

9.4 Refunds: if you are charged and the action can never be completed (for example, a duplicate payment, or a report we cannot accept), contact support within 30 days with your payment reference and we will refund it. Fees for actions that were completed are not refundable, except where the law requires.`
  },
  {
    icon: Scale,
    title: '10. Marketplace',
    content: `10.1 Only verified owners can list items, and items that are reported, held, disputed or being transferred cannot be listed.

10.2 When you buy, your payment is held until you confirm you received the item. The seller is then paid, minus the marketplace commission, and the item moves to your name.

10.3 Sellers must describe items honestly. We may remove listings and suspend sellers who break these rules. Prove Ownership is not the seller of items on the marketplace.`
  },
  {
    icon: AlertTriangle,
    title: '11. What you must not do',
    content: `You must not:
(a) register, report, claim or list items you do not own, or give false information or documents;
(b) use someone else's NIN, business number or account;
(c) use checks or our data to harass anyone, or to collect information about people;
(d) try to get around fees, identity checks, holds or security measures;
(e) copy, scrape or resell data from the Platform;
(f) interfere with or attack the Platform.

We may report illegal activity to the police and cooperate with lawful requests from authorities.`
  },
  {
    icon: FileText,
    title: '12. Our responsibility to you',
    content: `12.1 We provide the Platform with reasonable care and skill. We do not promise that it will always be available or error-free, or that a missing item will be recovered.

12.2 We are not responsible for what other users, buyers, sellers, finders or the police do, or for losses we could not reasonably foresee.

12.3 Where the law allows, our total liability to you for any claim is limited to the fees you paid us in the 12 months before the claim.

12.4 Nothing in these Terms limits liability that cannot be limited by law, or your rights under the Federal Competition and Consumer Protection Act 2018.`
  },
  {
    icon: Database,
    title: '13. Your data',
    content: `How we collect and use personal data, including NIN and business identity data, location on checks and the check history shared with item owners, is explained in our Privacy Policy. How we use cookies and browser storage is explained in our Cookie Policy. We handle personal data in line with the Nigeria Data Protection Act 2023.`
  },
  {
    icon: Scale,
    title: '14. Disputes and governing law',
    content: `14.1 These Terms are governed by the laws of the Federal Republic of Nigeria.

14.2 If you have a complaint, contact support first; we aim to reply within 5 working days. If we cannot resolve it within 30 days, either side may refer it to mediation, and if that fails, to the courts of the Federal Capital Territory, Abuja, unless the law gives you the right to go to another court.

14.3 Ownership disputes between users are decided by our team on the evidence provided. Either party may still go to the police or the courts.`
  },
  {
    icon: Mail,
    title: '15. Contact us',
    content: `AI-Con Digitals Nigeria Limited (Prove Ownership)
B96, Along Law School Road, Opp. JAMB Office, Bwari, Abuja, Nigeria
Email: support@proveownership.com
Phone: 08034875647, 08120212639`
  },
]

export default function TermsOfService() {
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
                <Scale size={32} color="white" />
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Terms of Service
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Effective Date: {lastUpdated} | Last Updated: {lastUpdated}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 8, maxWidth: 600, margin: '8px auto 0' }}>
                Please read these Terms carefully before using the Prove Ownership Platform. By using our services, you agree to be bound by these Terms.
              </p>
            </div>

            {/* Important Notice */}
            <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertTriangle size={20} style={{ color: '#ca8a04', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Important Disclaimer</p>
                  <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
                    Prove Ownership is a device registry and notification platform. We do NOT physically recover, track, or locate devices. We do NOT guarantee the recovery of any lost or stolen device. Our service facilitates information sharing and notifications only. Use of this Platform does not constitute a guarantee of device recovery.
                  </p>
                </div>
              </div>
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
