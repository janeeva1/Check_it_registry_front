import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Smartphone, CheckCircle, XCircle, Loader2, ArrowLeft, Key } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

type Step = 'token' | 'otp' | 'result'

export default function VerifyDevice() {
  const { user: _user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, _setSearchParams] = useSearchParams()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [step, setStep] = useState<Step>('token')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [deviceInfo, setDeviceInfo] = useState<{ id: string; brand: string; model: string } | null>(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<'success' | 'failed' | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (searchParams.get('token')) {
      setStep('otp')
      handleTokenLookup(searchParams.get('token')!)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTokenLookup = async (t: string) => {
    if (!t.trim()) { showError('Enter a verification token'); return }
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/verify/token?token=${encodeURIComponent(t)}`)
      if (!res.ok) throw new Error('Invalid or expired token')
      const data = await res.json()
      setDeviceInfo(data.data?.device || data.device)
      setExpiresAt(data.data?.expires_at || data.expires_at)
      setStep('otp')
    } catch (err: any) { showError(err.message) }
    finally { setLoading(false) }
  }

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1]
    if (!/^\d*$/.test(val)) return
    const nc = [...otp]; nc[idx] = val; setOtp(nc)
    if (val && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backward' || e.key === 'Backspace') {
      if (!otp[idx] && idx > 0) {
        const nc = [...otp]; nc[idx - 1] = ''; setOtp(nc); inputs.current[idx - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      const nc = [...otp]
      text.split('').forEach((ch, i) => { nc[i] = ch })
      setOtp(nc)
      inputs.current[5]?.focus()
    }
  }

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) { showError('Enter the 6-digit OTP code'); return }
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token, otp: fullOtp, deviceId: deviceInfo?.id }),
      })
      if (!res.ok) throw new Error('Verification failed')
      setResult('success')
      showSuccess('Device verified successfully!')
    } catch (err: any) { setResult('failed'); showError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <h1>Verify Device</h1>
                  <p>Complete ownership verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6">
            {result === 'success' && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--success-50)' }}>
                    <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
                  </div>
                  <h3>Verification Successful</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Device ownership has been verified.</p>
                  <button className="btn-gradient-primary mt-3" onClick={() => navigate(`/device-details/${deviceInfo?.id}`)}>View Device</button>
                </div>
              </motion.div>
            )}

            {result === 'failed' && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--danger-50)' }}>
                    <XCircle size={48} style={{ color: 'var(--danger-500)' }} />
                  </div>
                  <h3>Verification Failed</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>The code was invalid or expired.</p>
                  <button className="btn-gradient-primary mt-3" onClick={() => { setResult(null); setStep('token'); setOtp(['', '', '', '', '', '']) }}>Try Again</button>
                </div>
              </motion.div>
            )}

            {!result && step === 'token' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-4 p-md-5">
                  <div className="text-center mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'var(--primary-50)' }}>
                      <Key size={28} style={{ color: 'var(--primary-600)' }} />
                    </div>
                    <h4>Enter Verification Token</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Paste the token from your email or SMS</p>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
                  <div className="mb-4">
                    <label className="form-label">Verification Token <span style={{ color: 'red' }}>*</span></label>
                    <textarea className="modern-textarea" rows={2} placeholder="Paste your verification token here..." value={token} onChange={e => setToken(e.target.value)} />
                  </div>
                  <button className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading || !token.trim()} onClick={() => handleTokenLookup(token)}>
                    {loading ? <Loader2 size={20} className="spinner-border" /> : <Shield size={20} />}
                    {loading ? 'Looking up...' : 'Continue'}
                  </button>
                </div>
              </motion.div>
            )}

            {!result && step === 'otp' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {deviceInfo && (
                  <div className="modern-card p-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar" style={{ background: 'var(--primary-50)' }}><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /></div>
                      <div>
                        <p className="fw-medium mb-1">{deviceInfo.brand} {deviceInfo.model}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>ID: {deviceInfo.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="modern-card p-4 p-md-5">
                  <div className="text-center mb-4">
                    <h4>Enter OTP Code</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter the 6-digit code sent to your registered contact</p>
                  </div>

                  <form onSubmit={submitOtp}>
                    <div className="d-flex justify-content-between gap-2 mb-4" onPaste={handlePaste}>
                      {otp.map((digit, idx) => (
                        <input key={idx} ref={el => { inputs.current[idx] = el }} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleKeyDown(idx, e)}
                          className="modern-input text-center" style={{ width: 48, height: 56, fontSize: 24, fontWeight: 700 }} />
                      ))}
                    </div>

                    <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading || otp.join('').length !== 6}>
                      {loading ? <Loader2 size={20} className="spinner-border" /> : <Shield size={20} />}
                      {loading ? 'Verifying...' : 'Verify Device'}
                    </button>
                  </form>

                  {expiresAt && (
                    <p className="text-center mt-3" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      Token expires: {new Date(expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
