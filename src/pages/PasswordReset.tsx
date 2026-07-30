import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Shield, CheckCircle, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useToast, ToastContainer } from '../components/Toast'
import Navbar from '../components/Navbar'

type Step = 'email' | 'code' | 'reset' | 'success'

export default function PasswordReset() {
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { showError('Enter your email address'); return }
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to send reset code')
      showSuccess('Reset code sent to your email')
      setStep('code')
    } catch (err: any) { showError(err.message) }
    finally { setLoading(false) }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) { showError('Enter the 6-digit code'); return }
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      })
      if (!res.ok) throw new Error('Invalid or expired code')
      setStep('reset')
    } catch (err: any) { showError(err.message) }
    finally { setLoading(false) }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { showError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { showError('Passwords do not match'); return }
    try {
      setLoading(true)
      const fullCode = code.join('')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode, password }),
      })
      if (!res.ok) throw new Error('Failed to reset password')
      setStep('success')
      showSuccess('Password reset successfully!')
    } catch (err: any) { showError(err.message) }
    finally { setLoading(false) }
  }

  const steps = [
    { key: 'email', label: 'Email', number: 1 },
    { key: 'code', label: 'Code', number: 2 },
    { key: 'reset', label: 'Reset', number: 3 },
  ]
  const stepIndex = steps.findIndex(s => s.key === step)

  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row justify-content-center py-5" style={{ minHeight: '80vh' }}>
          <div className="col-md-6 col-lg-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => step === 'email' ? navigate('/login') : setStep(steps[stepIndex - 1]?.key as Step)}>
                  <ArrowLeft size={18} /> Back
                </button>
              </div>

              <div className="d-flex justify-content-between mb-5">
                {steps.map((s, i) => (
                  <div key={s.key} className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                      width: 32, height: 32,
                      background: i <= stepIndex ? 'var(--primary-600)' : 'var(--gray-200)',
                      color: i <= stepIndex ? '#fff' : 'var(--text-secondary)',
                      fontSize: 14, fontWeight: 600,
                    }}>{s.number}</div>
                    <span style={{ color: i <= stepIndex ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: i <= stepIndex ? 600 : 400, fontSize: 14 }}>{s.label}</span>
                    {i < 2 && <div style={{ flex: 1, height: 2, background: i < stepIndex ? 'var(--primary-600)' : 'var(--gray-200)', marginLeft: 8 }} />}
                  </div>
                ))}
              </div>

              <div className="modern-card p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                    <Lock size={28} className="text-white" />
                  </div>
                  <h4>{step === 'email' ? 'Reset Password' : step === 'code' ? 'Enter Reset Code' : step === 'reset' ? 'New Password' : 'Success!'}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                    {step === 'email' && 'Enter your email to receive a reset code'}
                    {step === 'code' && `Enter the 6-digit code sent to ${email}`}
                    {step === 'reset' && 'Choose a new password for your account'}
                  </p>
                </div>

                {step === 'email' && (
                  <form onSubmit={handleSendCode}>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
                    <div className="mb-4">
                      <label className="form-label">Email Address <span style={{ color: 'red' }}>*</span></label>
                      <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                        <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                        <input type="email" className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0' }} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading}>
                      {loading ? <Loader2 size={20} className="spinner-border" /> : <Mail size={20} />}
                      {loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                    <div className="text-center mt-3">
                      <Link to="/login" style={{ color: 'var(--primary-600)', fontSize: 13 }}>Back to login</Link>
                    </div>
                  </form>
                )}

                {step === 'code' && (
                  <form onSubmit={handleVerifyCode}>
                    <div className="d-flex justify-content-between gap-2 mb-4">
                      {code.map((digit, idx) => (
                        <input key={idx} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '').slice(-1)
                            const nc = [...code]; nc[idx] = v; setCode(nc)
                            if (v && idx < 5) (document.querySelectorAll('input[inputmode="numeric"]')[idx + 1] as HTMLInputElement)?.focus()
                          }}
                          onKeyDown={e => { if ((e.key === 'Backspace' || e.key === 'Backward') && !code[idx] && idx > 0) { const nc = [...code]; nc[idx - 1] = ''; setCode(nc); (document.querySelectorAll('input[inputmode="numeric"]')[idx - 1] as HTMLInputElement)?.focus() } }}
                          className="modern-input text-center" style={{ width: 48, height: 56, fontSize: 24, fontWeight: 700 }} />
                      ))}
                    </div>
                    <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading || code.join('').length !== 6}>
                      {loading ? <Loader2 size={20} className="spinner-border" /> : <Shield size={20} />}
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <p className="text-center mt-3" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Didn't receive it? Check your spam folder or <button type="button" className="btn btn-link p-0" onClick={handleSendCode} style={{ fontSize: 12 }}>resend</button>
                    </p>
                  </form>
                )}

                {step === 'reset' && (
                  <form onSubmit={handleReset}>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
                    <div className="mb-3">
                      <label className="form-label">New Password <span style={{ color: 'red' }}>*</span></label>
                      <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                        <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
                        <input type={showPassword ? 'text' : 'password'} className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0' }} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                        <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => setShowPassword(v => !v)} style={{ color: 'var(--text-secondary)' }}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label">Confirm Password <span style={{ color: 'red' }}>*</span></label>
                      <input type="password" className="modern-input" placeholder="Repeat your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                    </div>
                    <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading || !password || !confirmPassword}>
                      {loading ? <Loader2 size={20} className="spinner-border" /> : <Lock size={20} />}
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                )}

                {step === 'success' && (
                  <div className="text-center">
                    <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'var(--success-50)' }}>
                      <CheckCircle size={32} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Your password has been updated.</p>
                    <Link to="/login" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3 mt-3">
                      <Shield size={20} /> Sign In
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
