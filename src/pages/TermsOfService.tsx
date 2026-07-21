import { motion } from 'framer-motion'
import { Scale, Shield, AlertTriangle, UserCheck, CreditCard, Database, Lock, Mail, Globe, FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const lastUpdated = 'July 21, 2026'

const sections = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    content: `By accessing, browsing, or using the Check It Smart Device Registry & Recovery System ("the Platform," "the Service," "Check It," "we," "us," or "our"), including any web browser, mobile application, or API interface, you ("User," "you," or "your") acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must immediately cease all use of the Platform.

These Terms constitute a legally binding agreement between you and Check It. We reserve the right to modify these Terms at any time. Continued use of the Platform following any modifications constitutes acceptance of the revised Terms. It is your responsibility to review these Terms periodically.`
  },
  {
    icon: UserCheck,
    title: '2. Description of Service',
    content: `Check It is a device registry and recovery notification platform that enables users to:

(a) Register and maintain a digital record of device ownership (phones, computers, vehicles, electronics, and other valuables);

(b) Verify device status through our public check system before purchasing used devices;

(c) Report stolen, lost, or found devices to our centralized database;

(d) Receive notifications regarding device status changes, reports, and recovery opportunities;

(e) Transfer device ownership between registered users;

(f) List and sell devices through our peer-to-peer marketplace;

(g) Access law enforcement coordination services for device recovery;

(h) Verify identity through our KYC (Know Your Customer) system.

IMPORTANT: Check It is a notification and registry platform. We do NOT physically recover, track, or locate devices. We do NOT guarantee the recovery of any lost or stolen device. Our service facilitates information sharing and notifications only.`
  },
  {
    icon: AlertTriangle,
    title: '3. Important Disclaimers — Limitation of Liability',
    content: `3.1 NO GUARANTEE OF RECOVERY. Check It is a device registration and notification service. We do NOT guarantee that any registered device will be recovered if lost or stolen. We do NOT provide physical tracking, GPS location, or any form of active device recovery. Any recovery that occurs is incidental and not a promised outcome of our service.

3.2 NOT A LAW ENFORCEMENT AGENCY. Check It is a private technology platform. We are not a law enforcement agency, government body, or authorized investigative authority. We do NOT have the power to compel the return of any device. Any coordination with law enforcement is at the discretion of the relevant authorities.

3.3 NO RESPONSIBILITY FOR THIRD-PARTY ACTIONS. We are not responsible for the actions, omissions, or conduct of any third party, including but not limited to: law enforcement agencies, other users, marketplace participants, payment processors, or any other parties involved in device recovery or marketplace transactions.

3.4 INFORMATION PURPOSES ONLY. All device status information, reports, and notifications provided through the Platform are for informational purposes only. We do not warrant the accuracy, completeness, or timeliness of any information provided through the Service.

3.5 NO CONSEQUENTIAL DAMAGES. IN NO EVENT SHALL CHECK IT, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
   (a) YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE PLATFORM;
   (b) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM;
   (c) ANY CONTENT OBTAINED FROM THE PLATFORM;
   (d) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT;
   (e) THEFT, LOSS, OR DAMAGE TO ANY REGISTERED DEVICE;
   (f) ANY FAILED ATTEMPT AT DEVICE RECOVERY;
   (g) ANY TRANSACTION CONDUCTED THROUGH THE PLATFORM.

3.6 MAXIMUM LIABILITY. IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE AMOUNT YOU HAVE PAID TO CHECK IT IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED UNITED STATES DOLLARS ($100.00), WHICHEVER IS GREATER.

3.7 FORCE MAJEURE. We shall not be liable for any failure or delay in performing our obligations where such failure or delay results from any cause beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemic, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.`
  },
  {
    icon: Shield,
    title: '4. User Accounts & Registration',
    content: `4.1 ELIGIBILITY. You must be at least 18 years of age to create an account. By creating an account, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.

4.2 ACCOUNT ACCURACY. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. We reserve the right to suspend or terminate accounts that contain inaccurate information.

4.3 ACCOUNT SECURITY. You are solely responsible for safeguarding your password and for all activity that occurs under your account. You agree to immediately notify us of any unauthorized use of your account.

4.4 ONE ACCOUNT PER PERSON. Each user may maintain only one (1) active account. Duplicate accounts will be merged or terminated at our sole discretion.

4.5 ACCOUNT TERMINATION. We reserve the right to suspend or terminate your account at any time, with or without cause, with or without notice, and without liability. Grounds for termination include but are not limited to:
   (a) Violation of these Terms;
   (b) Fraudulent, abusive, or illegal activity;
   (c) Registration of false or misleading device information;
   (d) Abuse of the device check system;
   (e) Non-payment of applicable fees;
   (f) Conduct that exposes us to legal liability.

4.6 DATA RETENTION. Upon account termination, we may retain your data as required by law or for legitimate business purposes, including fraud prevention and legal compliance.`
  },
  {
    icon: Database,
    title: '5. Device Registration & Ownership',
    content: `5.1 OWNERSHIP REPRESENTATION. By registering a device, you represent and warrant that:
   (a) You are the lawful owner of the device;
   (b) You have the legal right to register the device;
   (c) The device is not stolen, counterfeit, or obtained through fraud;
   (d) All information provided about the device is accurate and truthful.

5.2 REGISTRATION DOES NOT CONSTITUTE LEGAL OWNERSHIP. Device registration on Check It does NOT constitute legal proof of ownership. It is a digital record maintained for notification and verification purposes. Registration does not confer any legal title, lien, or proprietary interest in the device.

5.3 VERIFICATION STATUS. A "verified" device status indicates that an administrator has reviewed the registration submission. Verification is NOT a guarantee of ownership, authenticity, or legal status. We do not independently verify ownership claims.

5.4 FALSE REGISTRATION. Registering a device you do not own, or providing false information about a device, is a violation of these Terms and may constitute fraud. We will cooperate with law enforcement in investigating false registrations.

5.5 DEVICE STATUS UPDATES. We reserve the right to update device status based on reports, law enforcement input, or administrative review. You will be notified of status changes affecting your devices.

5.6 PROOF OF OWNERSHIP. You may be required to provide proof of ownership (receipt, invoice, purchase confirmation) when registering or verifying devices. Failure to provide adequate proof may result in the device remaining in "unverified" status.`
  },
  {
    icon: AlertTriangle,
    title: '6. Reporting Stolen, Lost, and Found Devices',
    content: `6.1 REPORTING RESPONSIBILITY. When you report a device as stolen or lost, you represent that:
   (a) The device was genuinely stolen from or lost by you;
   (b) You have filed or will file a police report where required by law;
   (c) The information in the report is true and accurate;
   (d) You understand that filing a false report may constitute a criminal offense.

6.2 NOTIFICATION SERVICE ONLY. Check It serves as a notification platform. When you file a report:
   (a) The report is added to our database and made visible through our check system;
   (b) Relevant notifications may be sent to other users, administrators, and law enforcement agencies;
   (c) We do NOT physically search for, track, or recover the device;
   (d) We do NOT guarantee that the device will be found or returned.

6.3 ANONYMOUS REPORTS. Found device reports may be filed anonymously. Anonymous reporters are not required to create an account but must provide a valid contact method for coordination purposes.

6.4 REPORT MODIFICATION. We reserve the right to modify, update, or remove reports that contain false, misleading, or defamatory content. Repeated filing of false reports will result in account termination and may be reported to law enforcement.

6.5 RESOLUTION. Reporting a device as "resolved" indicates that the matter has been settled. Once marked as resolved, the report status cannot be changed by the reporter. Contact support for disputes.

6.6 LAW ENFORCEMENT COORDINATION. Reports may be automatically assigned to registered law enforcement agencies in your region. We do not control law enforcement response times, priorities, or actions. We cannot compel law enforcement to take any specific action.`
  },
  {
    icon: Globe,
    title: '7. Device Check Service',
    content: `7.1 PURPOSE. The device check service allows users to query our database to determine the status of a device (by IMEI or serial number) before purchasing it. This service is provided as-is for informational purposes.

7.2 NO WARRANTY OF ACCURACY. We do not warrant that device check results are accurate, complete, or current. A "clean" check result does NOT guarantee that:
   (a) The device is not stolen;
   (b) The device is not counterfeit;
   (c) The device is free from encumbrances or liens;
   (d) The registered owner is the legitimate owner.

7.3 FREE TIER. The first three (3) device checks per user are provided free of charge. Additional checks are subject to the fee schedule published in our pricing section.

7.4 PAID CHECKS. Payment for device checks is processed through our payment provider (Paystack). All payments are final and non-refundable once the check has been performed.

7.5 FRAUD PREVENTION. We collect device fingerprint data, IP addresses, and location information during device checks for fraud prevention purposes. Excessive or suspicious checking patterns may result in temporary or permanent restriction of access.

7.6 BUYER RESPONSIBILITY. You are solely responsible for conducting due diligence before purchasing any device. Check It results are supplementary to, not a replacement for, independent verification.`
  },
  {
    icon: CreditCard,
    title: '8. Payments, Fees, and Escrow',
    content: `8.1 FEE SCHEDULE. The following fees may apply to Platform services:
   • Device Check: ₦100 per check (after 3 free checks)
   • NIN Verification: ₦500 per verification
   • Report Verification: ₦300 per verification
   • Business Verification: ₦2,500 per verification
   • Business Onboarding: ₦5,000 per customer
   • Device Recovery Service: ₦2,000 per service
   • Marketplace Escrow Fee: 2.5% of transaction value
   All fees are subject to change with 30 days' notice.

8.2 PAYMENT PROCESSING. All payments are processed through Paystack. By making a payment, you agree to Paystack's terms of service. We do not store your payment card details.

8.3 ESCROW SERVICE. Marketplace transactions are processed through our escrow system:
   (a) Buyer's payment is held in escrow upon successful payment;
   (b) Platform fee (2.5%) is deducted from the transaction;
   (c) Funds are released to the seller upon buyer confirmation of delivery;
   (d) Buyers may file disputes within the dispute window;
   (e) Admin may intervene to resolve disputes (release to seller or refund to buyer).

8.4 REFUND POLICY. All fees paid to Check It are non-refundable except:
   (a) Escrow refunds when a dispute is resolved in buyer's favor;
   (b) Recovery service refunds: 50% refund if recovery is unsuccessful;
   (c) Duplicate charges (verified by our records).

8.5 CHARGEBACKS. Initiating a chargeback for a legitimate transaction is a violation of these Terms and may result in account suspension, blacklisting, and referral to debt collection.

8.6 CURRENCY. All fees are denominated in Nigerian Naira (NGN) unless otherwise specified. Currency conversion fees charged by your bank or payment provider are your responsibility.`
  },
  {
    icon: Scale,
    title: '9. Marketplace Terms',
    content: `9.1 BUYER AND SELLER RESPONSIBILITIES. The marketplace facilitates peer-to-peer transactions. Check It is NOT a party to any sale agreement between buyer and seller. We do NOT:
   (a) Guarantee the quality, safety, or legality of items listed;
   (b) Guarantee that buyers or sellers will complete a transaction;
   (c) Guarantee that listed items are as described;
   (d) Provide warranties for any items sold through the marketplace.

9.2 LISTING REQUIREMENTS. Sellers must:
   (a) Be the lawful owner of the listed device;
   (b) Provide accurate descriptions and images;
   (c) List only devices with "verified" status;
   (d) Not list devices that are stolen, lost, or subject to any legal dispute.

9.3 PROHIBITED ITEMS. The following cannot be listed: stolen devices, counterfeit devices, devices subject to legal dispute, devices with outstanding financial obligations, and any items that violate applicable law.

9.4 TRANSACTION FRAUD. Any attempt to defraud buyers or sellers through the marketplace, including but not limited to non-delivery, non-payment, misrepresentation, or identity fraud, will result in immediate account termination and referral to law enforcement.

9.5 DELIVERY AND DISPUTES. Buyers must confirm delivery within a reasonable time. Failure to confirm delivery or file a dispute within the designated window constitutes acceptance of the item as described. Disputes are resolved by our admin team, whose decision is final.`
  },
  {
    icon: Lock,
    title: '10. KYC & Identity Verification',
    content: `10.1 VERIFICATION PURPOSE. KYC verification is conducted to confirm your identity and enhance platform security. Verification is optional for basic use but may be required for certain features (e.g., business accounts, premium services).

10.2 VERIFICATION PROCESS. KYC verification involves:
   (a) Submission of your National Identification Number (NIN);
   (b) Capture and comparison of a selfie photograph;
   (c) Liveness detection to prevent spoofing;
   (d) Cross-referencing with government databases through our verification partners (Prembly, Dojah, VerifyNG, or SmileID).

10.3 VERIFICATION FEE. A fee of ₦500 is charged per KYC verification attempt. This fee is non-refundable regardless of the verification outcome.

10.4 DATA USE. Your NIN and biometric data are processed by our verification partners in accordance with their privacy policies. We do not permanently store your raw biometric data.

10.5 VERIFICATION RESULT. A "verified" KYC status indicates that your identity has been confirmed through our verification partners. This does not constitute a background check or character assessment.

10.6 FAILING VERIFICATION. If verification fails, you may retry with the same or an alternative provider. Repeated failed verification attempts may trigger fraud alerts.`
  },
  {
    icon: Shield,
    title: '11. User Conduct & Prohibited Activities',
    content: `You agree NOT to:
   (a) Use the Platform for any unlawful purpose or in violation of any applicable law;
   (b) Register devices you do not own or have no legal right to register;
   (c) File false, fraudulent, or misleading reports;
   (d) Attempt to circumvent device check fees or payment systems;
   (e) Use automated tools, bots, or scrapers to access the Platform;
   (f) Interfere with or disrupt the Platform's infrastructure;
   (g) Harvest or collect user information without consent;
   (h) Impersonate another person or entity;
   (i) Use the Platform to harass, threaten, or intimidate others;
   (j) Attempt to access other users' accounts without authorization;
   (k) Reverse engineer, decompile, or disassemble any part of the Platform;
   (l) Remove, alter, or obscure any proprietary notices or labels;
   (m) Use the Platform to compete with us or develop a competing product;
   (n) Engage in money laundering, fraud, or other financial crimes through the marketplace;
   (o) Manipulate device check results or interfere with the fraud detection system;
   (p) Register multiple accounts to circumvent free tier limits or other restrictions;
   (q) Share your account credentials with third parties.

Violation of these prohibitions may result in immediate account termination, forfeiture of any funds held in your account, and referral to law enforcement authorities.`
  },
  {
    icon: Database,
    title: '12. Intellectual Property',
    content: `12.1 OUR RIGHTS. The Platform, including its design, code, graphics, logos, trademarks, and documentation, is owned by Check It and protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Platform for its intended purpose.

12.2 YOUR CONTENT. By submitting content to the Platform (device information, images, reports, messages), you grant us a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, and display such content for the purpose of operating and improving the Platform.

12.3 FEEDBACK. Any feedback, suggestions, or ideas you provide about the Platform may be used by us without restriction or compensation to you.

12.4 COPYRIGHT INFRINGEMENT. We respect intellectual property rights. If you believe content on the Platform infringes your copyright, please contact us at legal@proveownership.com with the required DMCA information.`
  },
  {
    icon: Lock,
    title: '13. Privacy & Data Protection',
    content: `13.1 PRIVACY POLICY. Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection, use, and disclosure of information as described in our Privacy Policy.

13.2 DATA SECURITY. We implement industry-standard security measures to protect your data. However, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data.

13.3 DATA BREACH. In the event of a data breach affecting your personal information, we will notify you via email within 72 hours of discovering the breach, as required by applicable data protection laws.

13.4 DATA RETENTION. We retain your personal data for as long as your account is active or as needed to provide services. We may retain certain data as required by law or for legitimate business purposes after account deletion.

13.5 INTERNATIONAL TRANSFERS. Your data may be processed in countries other than your own. By using the Platform, you consent to such transfers.`
  },
  {
    icon: Scale,
    title: '14. Indemnification',
    content: `You agree to indemnify, defend, and hold harmless Check It, its directors, officers, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including but not limited to attorney's fees) arising from:

(a) Your use of the Platform;
(b) Your violation of these Terms;
(c) Your violation of any third-party rights, including intellectual property, privacy, or proprietary rights;
(d) Any content you submit, post, or transmit through the Platform;
(e) Your interaction with other users, including marketplace transactions;
(f) Any device you register, report, or list on the Platform;
(g) Any false or misleading information you provide;
(h) Any violation of applicable law or regulation;
(i) Any dispute between you and another user, law enforcement agency, or third party.

This indemnification obligation survives the termination of your account and these Terms.`
  },
  {
    icon: FileText,
    title: '15. Dispute Resolution',
    content: `15.1 GOVERNING LAW. These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.

15.2 JURISDICTION. Any disputes arising from or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts of Nigeria. You consent to the personal jurisdiction of such courts.

15.3 ARBITRATION. Any dispute, controversy, or claim arising out of or relating to these Terms that cannot be resolved through good-faith negotiation within thirty (30) days shall be submitted to binding arbitration in accordance with the Arbitration and Mediation Act of Nigeria. The arbitration shall be conducted in English in Lagos, Nigeria. The decision of the arbitrator shall be final and binding.

15.4 CLASS ACTION WAIVER. YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ON AN INDIVIDUAL BASIS AND NOT AS A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.

15.5 LIMITATION PERIOD. Any claim arising out of or relating to these Terms must be filed within one (1) year after the cause of action accrues, otherwise such claim is permanently barred.

15.6 INJUNCTIVE RELIEF. Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.`
  },
  {
    icon: AlertTriangle,
    title: '16. Modifications & Termination',
    content: `16.1 RIGHT TO MODIFY. We reserve the right to modify, suspend, or discontinue the Platform or any part thereof at any time, with or without notice. We shall not be liable for any modification, suspension, or discontinuation of the Platform.

16.2 TERMS UPDATES. We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least 30 days before they take effect. Continued use of the Platform after the effective date of any changes constitutes acceptance of the updated Terms.

16.3 UPON TERMINATION. Upon termination of your account:
   (a) Your right to use the Platform ceases immediately;
   (b) Any pending transactions will be handled according to their terms;
   (c) We may retain your data as required by law or for legitimate business purposes;
   (d) Provisions of these Terms that by their nature should survive termination will survive, including but not limited to: indemnification, limitation of liability, dispute resolution, and intellectual property provisions.`
  },
  {
    icon: Mail,
    title: '17. Contact Information',
    content: `For questions, concerns, or notices regarding these Terms of Service, please contact us at:

Check It — Smart Device Registry & Recovery System
Email: legal@proveownership.com
Support: support@proveownership.com
Website: https://dev.proveownership.com

For legal notices, formal correspondence must be sent via email to legal@proveownership.com. We will respond to legal inquiries within 30 business days.`
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
                Please read these Terms carefully before using the Check It Platform. By using our services, you agree to be bound by these Terms.
              </p>
            </div>

            {/* Important Notice */}
            <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertTriangle size={20} style={{ color: '#ca8a04', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Important Disclaimer</p>
                  <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
                    Check It is a device registry and notification platform. We do NOT physically recover, track, or locate devices. We do NOT guarantee the recovery of any lost or stolen device. Our service facilitates information sharing and notifications only. Use of this Platform does not constitute a guarantee of device recovery.
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
