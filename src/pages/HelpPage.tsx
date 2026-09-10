import { motion } from 'framer-motion'
import { Shield, Smartphone, MapPin, UserX, Link2, Mail, Phone, HelpCircle } from 'lucide-react'
import Navbar from '../components/Navbar'

const faqs = [
  {
    icon: Smartphone,
    title: 'How do I register my device?',
    content: 'Log in, go to "Register Device", enter your device details (brand, model, IMEI/serial), and upload proof of purchase. Your device is then added to the national Prove Ownership registry and protected against theft.'
  },
  {
    icon: UserX,
    title: 'What should I do if my device is stolen?',
    content: 'Report it immediately from the "Report Incident" page. Provide the incident details, location, and any evidence. The report is reviewed and assigned to law enforcement in your region, who can act on it.'
  },
  {
    icon: MapPin,
    title: 'How do I check a device before buying?',
    content: 'Use the "Check Device" tool to run the public device check with the IMEI or serial number. You will see whether the device has an active stolen or lost report before you complete your purchase.'
  },
  {
    icon: Link2,
    title: 'How do I transfer ownership?',
    content: 'Log in, open the device you own, and select "Transfer". Enter the new owner email or phone. The transfer requires verification and is recorded on the permanent ownership history of the device.'
  },
  {
    icon: Shield,
    title: 'What is device verification?',
    content: 'Verification confirms that the person claiming ownership of a device is genuine. You may be asked to complete identity verification (NIN/BVN) and provide proof of purchase. Verified devices carry a verified badge.'
  },
  {
    icon: HelpCircle,
    title: 'I have a business. How do I list devices?',
    content: 'Complete Business Verification from your account, then use the Marketplace dashboard to create listings for your devices. Payments and escrow are handled securely on the platform.'
  }
]

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <div className="container py-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={24} color="white" />
            </div>
            <div>
              <h1>Help & Support</h1>
              <p>Answers to common questions about Prove Ownership</p>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {faqs.map(f => (
              <div className="col-md-6" key={f.title}>
                <div className="modern-card p-4 h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <f.icon size={20} />
                    <h3 className="h6 m-0">{f.title}</h3>
                  </div>
                  <p className="text-secondary small mb-0">{f.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="modern-card p-4">
            <h3 className="h6 mb-3">Still need help?</h3>
            <p className="text-secondary small mb-3">
              If you cannot find an answer here, contact our support team and we will get back to you as soon as possible.
            </p>
            <div className="d-flex gap-3 flex-wrap">
              <a href="mailto:support@proveownership.com" className="btn-ghost">
                <Mail size={16} /> support@proveownership.com
              </a>
              <a href="tel:+2340000000000" className="btn-ghost">
                <Phone size={16} /> Support Hotline
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}