import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { PaymentGate } from '../components/PaymentGate'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, Loader2, Building2, FileText, Clock, Shield, AlertTriangle, History } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

interface VerificationHistory {
  id: string
  rc_number: string
  company_name_submitted: string
  status: string
  status_reason: string | null
  provider: string
  fee_amount: number
  created_at: string
}

interface VerificationStatus {
  verificationStatus: string
  verifiedAt: string | null
  businessName: string | null
  rcNumber: string | null
  lastAttempt: { id: string; status: string; status_reason: string | null; created_at: string } | null
}

export default function BusinessVerification() {
  const { user } = useAuth()
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [bypassToken, setBypassToken] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [rcNumber, setRcNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [history, setHistory] = useState<VerificationHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const [status, hist] = await Promise.all([
        apiClient.security.getVerificationStatus().catch(() => null),
        apiClient.security.getCACHistory().catch(() => ({ history: [] })),
      ])
      if (status) setVerificationStatus(status)
      if (hist?.history) setHistory(hist.history)
      if (status?.rcNumber) setRcNumber(status.rcNumber)
      if (status?.businessName) setCompanyName(status.businessName)
    } catch (err) {
      console.error('Failed to load verification status:', err)
    } finally {
      setInitialLoading(false)
    }
  }

  const handlePaySuccess = (token: string) => {
    setBypassToken(token)
    setShowPayment(false)
    doVerify(token)
  }

  const handleVerifyClick = () => {
    if (!rcNumber.trim()) {
      showError('RC Number is required')
      return
    }
    doVerify(null)
  }

  const doVerify = async (payToken: string | null) => {
    setLoading(true)
    try {
      const res: any = await apiClient.security.verifyCAC({
        rcNumber: rcNumber.trim(),
        businessName: companyName.trim() || undefined,
        pay_by_pass: payToken || bypassToken || undefined,
      } as any)
      if (res && res.requiresPayment) {
        setShowPayment(true)
        return
      }
      setResult(res.data || res)
      if ((res.data || res).success) {
        showSuccess('Business Verified', 'Your business has been successfully verified via CAC!')
      } else {
        showError('Verification Failed', (res.data || res).statusReason || 'The data did not match CAC records. Please try again or contact support.')
      }
      loadStatus()
    } catch (e: any) {
      const msg = e.message || e.error || ''
      if (msg.includes('payment') || msg.includes('fee') || msg.includes('Payment')) {
        setShowPayment(true)
      } else {
        showError('Verification Error', msg || 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      </Layout>
    )
  }

  const isVerified = verificationStatus?.verificationStatus === 'verified'

  return (
    <Layout requireAuth>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <h1>Business Verification</h1>
            <p>Verify your business registration with the Corporate Affairs Commission (CAC)</p>
          </motion.div>

          {/* Status Banner */}
          {isVerified && (
            <motion.div variants={itemVariants} className="mb-4">
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(34,197,94,0.04))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                </div>
                <div>
                  <h5 style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>Business Verified</h5>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Your business <strong>{verificationStatus.businessName}</strong> has been verified. RC: {verificationStatus.rcNumber}
                    {verificationStatus.verifiedAt && ` — Verified on ${new Date(verificationStatus.verifiedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verification Form or Result */}
          <motion.div variants={itemVariants} className="modern-card p-4" style={{ maxWidth: 560, margin: '0 auto' }}>
            {result ? (
              <div className="text-center">
                <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {result.success
                    ? <CheckCircle size={36} style={{ color: 'var(--success)' }} />
                    : <XCircle size={36} style={{ color: '#EF4444' }} />
                  }
                </div>
                <h3 style={{ color: result.success ? 'var(--success)' : '#EF4444', marginBottom: 8 }}>
                  {result.success ? 'Verification Passed' : 'Verification Failed'}
                </h3>
                {result.statusReason && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12, marginTop: 8, textAlign: 'left' }}>
                    {result.statusReason}
                  </p>
                )}
                {result.comparison && (
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 16, marginTop: 16, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Name Match</span>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{result.comparison.nameSimilarity}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>RC Match</span>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{result.comparison.rcMatch ? 'Yes' : 'No'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Company Status</span>
                      <span style={{ fontWeight: 500, color: result.comparison.isActive ? 'var(--success)' : '#EF4444', fontSize: 13 }}>{result.comparison.companyStatus}</span>
                    </div>
                  </div>
                )}
                <button onClick={() => { setResult(null); loadStatus() }} className="btn-ghost mt-3" style={{ fontSize: 13 }}>
                  {result.success ? 'Back to Dashboard' : 'Try Again'}
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
                    Verify your business registration against CAC records. A one-time verification fee applies.
                  </p>
                </div>

                {!isVerified && (
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Why verify?</strong> Verified businesses get a trusted badge, higher visibility in marketplace, and access to bulk device registration features.
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><span style={{ color: 'red' }}>*</span> Required fields</div>

                <div className="mb-3">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    RC Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="e.g., RC 1234567"
                    value={rcNumber}
                    onChange={e => setRcNumber(e.target.value)}
                    disabled={isVerified}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    Company Name <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional — for matching)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control modern-input"
                    placeholder="Enter company name as registered with CAC"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    disabled={isVerified}
                  />
                </div>

                {bypassToken && (
                  <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                    <CheckCircle size={14} />
                    Payment confirmed. Proceeding with verification.
                  </div>
                )}

                {!isVerified && (
                  <button
                    onClick={handleVerifyClick}
                    disabled={loading || !rcNumber.trim()}
                    className="btn-gradient-primary w-100"
                    style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <FileText size={18} />}
                    {loading ? 'Verifying...' : 'Verify Business'}
                  </button>
                )}
              </>
            )}
          </motion.div>

          {/* Verification History */}
          <motion.div variants={itemVariants} className="mt-4" style={{ maxWidth: 560, margin: '40px auto 0' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: 13, height: 40 }}
            >
              <History size={16} />
              {showHistory ? 'Hide' : 'Show'} Verification History ({history.length})
            </button>

            {showHistory && history.length > 0 && (
              <div className="mt-3">
                {history.map((h) => (
                  <div key={h.id} className="d-flex align-items-center justify-content-between p-3 mb-2" style={{ background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {h.company_name_submitted || h.rc_number}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {h.rc_number} — {new Date(h.created_at).toLocaleDateString()}
                      </div>
                      {h.status_reason && (
                        <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{h.status_reason}</div>
                      )}
                    </div>
                    <span className={`status-badge ${h.status === 'passed' ? 'status-verified' : h.status === 'pending' ? 'status-pending' : 'status-stolen'}`} style={{ fontSize: 11, padding: '3px 10px' }}>
                      {h.status === 'passed' ? 'Passed' : h.status === 'pending' ? 'Pending' : h.status === 'error' ? 'Error' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {showHistory && history.length === 0 && (
              <p className="text-center mt-3" style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No verification attempts yet.</p>
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
