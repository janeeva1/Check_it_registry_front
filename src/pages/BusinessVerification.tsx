import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { PaymentGate } from '../components/PaymentGate'
import { apiClient } from '../lib/apiClient'
import { Shield, CheckCircle, AlertCircle, Loader2, Building2, FileText } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function BusinessVerification() {
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [rcNumber, setRcNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [bypassToken, setBypassToken] = useState<string | null>(null)

  const handlePaySuccess = (token: string) => {
    setBypassToken(token)
    setShowPayment(false)
  }

  const handleVerify = async () => {
    if (!rcNumber.trim()) {
      showError('RC Number is required')
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.security.verifyCAC({
        rc_number: rcNumber.trim(),
        company_name: companyName.trim() || undefined,
        bypass_payment: !!bypassToken,
      })
      setResult(res.data || res)
      showSuccess('Business Verified', 'Your business registration has been verified')
    } catch (e: any) {
      if (e.message?.includes('payment') || e.message?.includes('fee')) {
        setShowPayment(true)
      } else {
        showError(e.message || 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <h1>Business Verification</h1>
            <p>Verify your business registration with the Corporate Affairs Commission (CAC)</p>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4" style={{ maxWidth: 520, margin: '0 auto' }}>
            {result ? (
              <div className="text-center">
                <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={36} style={{ color: 'var(--success)' }} />
                </div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Business Verified</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  RC Number: {result.rc_number || rcNumber}
                </p>
                {(result.company_name || result.companyName) && (
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 16, marginTop: 12, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Company Name</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{result.company_name || result.companyName}</span>
                    </div>
                    {result.status && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Status</span>
                        <span style={{ color: 'var(--success)', fontWeight: 500 }}>{result.status}</span>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => setResult(null)} className="btn-ghost mt-3">
                  Verify Another Business
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Building2 size={28} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 style={{ color: 'var(--text-primary)' }}>CAC Business Verification</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Enter your RC number to verify your business registration
                  </p>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    RC Number
                  </label>
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="e.g., RC 1234567"
                    value={rcNumber}
                    onChange={e => setRcNumber(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    Company Name <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="Enter company name for matching"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>

                {bypassToken && (
                  <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                    <CheckCircle size={14} />
                    Payment bypassed. Proceed with verification.
                  </div>
                )}

                <button
                  onClick={handleVerify}
                  disabled={loading || !rcNumber.trim()}
                  className="btn-gradient-primary w-100"
                  style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? <Loader2 size={18} className="spin" /> : <FileText size={18} />}
                  {loading ? 'Verifying...' : 'Verify Business'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
      <PaymentGate
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        feeType="business_verification"
        feeLabel="CAC Business Verification"
        description="One-time fee for Corporate Affairs Commission business verification"
        onSuccess={handlePaySuccess}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
