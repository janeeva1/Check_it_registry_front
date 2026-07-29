import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { PaymentGate } from '../components/PaymentGate'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { Shield, CheckCircle, Loader2, IdCard, Eye, EyeOff } from 'lucide-react'

interface VerificationStatus {
  nin_verified: boolean
  nin_data?: { first_name: string; last_name: string; date_of_birth: string; phone?: string }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function IdentityVerification() {
  const { user: _user } = useAuth()
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [nin, setNin] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [bypassToken, setBypassToken] = useState<string | null>(null)
  const [showNin, setShowNin] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiClient.security.getVerificationStatus()
        setStatus(data)
      } catch { /* not verified yet */ }
      setCheckingStatus(false)
    })()
  }, [])

  const handlePaySuccess = (token: string) => {
    setBypassToken(token)
    setShowPayment(false)
  }

  const handleVerify = async () => {
    const cleaned = nin.replace(/\s/g, '')
    if (cleaned.length !== 11) {
      showError('NIN must be 11 digits')
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.security.verifyNIN({
        nin: cleaned,
        bypass_payment: !!bypassToken,
      })
      setStatus({ nin_verified: true, nin_data: res.data })
      showSuccess('NIN Verified Successfully', 'Your identity has been verified')
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

  if (checkingStatus) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <Loader2 size={32} className="spin" />
        </div>
      </Layout>
    )
  }

  if (status?.nin_verified) {
    return (
      <Layout requireAuth>
        <div className="container-fluid px-0">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="page-header">
              <h1>Identity Verification</h1>
              <p>Your identity verification status</p>
            </motion.div>
            <motion.div variants={itemVariants} className="modern-card p-4 text-center" style={{ maxWidth: 480, margin: '0 auto' }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={36} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>NIN Verified</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Your National Identification Number has been verified
              </p>
              {status.nin_data && (
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 16, marginTop: 12, textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Name</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{status.nin_data.first_name} {status.nin_data.last_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Date of Birth</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{status.nin_data.date_of_birth}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <h1>Identity Verification</h1>
            <p>Verify your National Identification Number (NIN) to access security features</p>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4" style={{ maxWidth: 480, margin: '0 auto' }}>
            <div className="text-center mb-4">
              <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IdCard size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ color: 'var(--text-primary)' }}>Verify Your NIN</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Enter your 11-digit NIN to verify your identity
              </p>
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                NIN (National Identification Number)
              </label>
              <div className="position-relative">
                <input
                  type={showNin ? 'text' : 'password'}
                  className="form-control modern-input"
                  placeholder="Enter your 11-digit NIN"
                  value={nin}
                  onChange={e => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  style={{ paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowNin(!showNin)}
                  className="btn position-absolute end-0 top-50 translate-middle-y border-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showNin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small style={{ color: 'var(--text-tertiary)' }}>
                Your NIN is encrypted and used only for identity verification
              </small>
            </div>

            {status && !status.nin_verified && bypassToken && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                <CheckCircle size={14} />
                Payment bypassed. Proceed with verification.
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || nin.replace(/\s/g, '').length !== 11}
              className="btn-gradient-primary w-100"
              style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <Shield size={18} />}
              {loading ? 'Verifying...' : 'Verify NIN'}
            </button>
          </motion.div>
        </motion.div>
      </div>
      <PaymentGate
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        feeType="nin_verification"
        feeLabel="NIN Verification"
        description="One-time fee for National Identification Number verification"
        onSuccess={handlePaySuccess}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
