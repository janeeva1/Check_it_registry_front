import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Shield, CheckCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate } from 'react-router-dom'

export default function EmailVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [email, setEmail] = useState(user?.email || '')
  const [sending, setSending] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [timer, setTimer] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user])

  useEffect(() => {
    if (timer > 0) {
      const id = setTimeout(() => setTimer(t => t - 1), 1000)
      return () => clearTimeout(id)
    } else setResendDisabled(false)
  }, [timer])

  const handleCodeChange = (idx: number, val: string) => {
    if (val.length > 1) { val = val[val.length - 1] }
    if (!/^\d*$/.test(val)) return
    const newCode = [...code]
    newCode[idx] = val
    setCode(newCode)
    if (val && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backward' || e.key === 'Backspace') {
      if (!code[idx] && idx > 0) {
        const newCode = [...code]
        newCode[idx - 1] = ''
        setCode(newCode)
        inputs.current[idx - 1]?.focus()
      }
    }
  }

  const sendCode = async () => {
    try {
      setSending(true); setResendDisabled(true); setTimer(60)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to send code')
      showSuccess('Verification code sent!')
    } catch (err: any) { showError(err.message); setResendDisabled(false); setTimer(0) }
    finally { setSending(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (email) sendCode() }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) { showError('Please enter the 6-digit code'); return }
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: fullCode, email }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Verification failed') }
      setVerified(true)
      showSuccess('Email verified successfully!')
      setTimeout(() => navigate('/settings'), 1500)
    } catch (err: any) { showError(err.message) }
    finally { setLoading(false) }
  }

  if (verified) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row justify-content-center py-5">
            <div className="col-md-6 col-lg-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--success-50)' }}>
                    <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
                  </div>
                  <h3>Email Verified!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{email}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Redirecting to settings...</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row justify-content-center py-5">
          <div className="col-md-6 col-lg-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button className="btn-ghost d-inline-flex align-items-center gap-2 mb-4" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
              </button>

              <div className="modern-card p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                    <Mail size={28} className="text-white" />
                  </div>
                  <h3>Verify Your Email</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerify}>
                  <div className="d-flex justify-content-between gap-2 mb-4">
                    {code.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { inputs.current[idx] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleCodeChange(idx, e.target.value)}
                        onKeyDown={e => handleKeyDown(idx, e)}
                        className="modern-input text-center"
                        style={{ width: 48, height: 56, fontSize: 24, fontWeight: 700 }}
                      />
                    ))}
                  </div>

                  <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading || code.join('').length !== 6}>
                    {loading ? <Loader2 size={20} className="spinner-border" /> : <Shield size={20} />}
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <button className="btn-ghost d-inline-flex align-items-center gap-2" disabled={sending || resendDisabled} onClick={sendCode}>
                    <RefreshCw size={16} />
                    {sending ? 'Sending...' : resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
