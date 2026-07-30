import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Mail, ArrowLeft,
  AlertCircle, CheckCircle, Lock, Send,
  Smartphone, RefreshCw
} from 'lucide-react'
import { useToast } from '../components/Toast'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

const floatingShapes = [
  { size: 240, x: '10%', y: '15%', delay: 0, duration: 8, blur: '120px', color: 'rgba(74, 222, 128, 0.15)' },
  { size: 320, x: '70%', y: '20%', delay: 1, duration: 10, blur: '160px', color: 'rgba(99, 102, 241, 0.12)' },
  { size: 200, x: '50%', y: '70%', delay: 2, duration: 7, blur: '100px', color: 'rgba(34, 197, 94, 0.1)' },
  { size: 280, x: '20%', y: '75%', delay: 0.5, duration: 9, blur: '140px', color: 'rgba(16, 185, 129, 0.12)' },
  { size: 180, x: '80%', y: '60%', delay: 1.5, duration: 6, blur: '90px', color: 'rgba(52, 211, 153, 0.1)' },
]

const features = [
  { icon: Shield, text: 'Secure password recovery via email' },
  { icon: Smartphone, text: 'Instant OTP verification' },
  { icon: RefreshCw, text: 'Regain access in minutes' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const { toasts: _toasts, removeToast: _removeToast, showSuccess, showError } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset')
      }

      setSent(true)
      showSuccess('Reset Code Sent!', 'If an account with this email exists, a password reset code has been sent.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request password reset'
      setError(errorMessage)
      showError('Request Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Left - Illustration Panel */}
      <div className="d-none d-lg-flex" style={{ flex: '1 1 50%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #14532d 0%, #15803d 30%, #16a34a 60%, #22c55e 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {floatingShapes.map((shape, i) => (
            <motion.div
              key={i}
              animate={{
                x: [0, 30, -20, 15, 0],
                y: [0, -40, 20, -15, 0],
                scale: [1, 1.1, 0.95, 1.05, 1],
              }}
              transition={{
                duration: shape.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: shape.delay,
              }}
              style={{
                position: 'absolute',
                left: shape.x,
                top: shape.y,
                width: shape.size,
                height: shape.size,
                borderRadius: '50%',
                background: shape.color,
                filter: `blur(${shape.blur})`,
                pointerEvents: 'none',
              }}
            />
          ))}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px', width: '100%' }}>
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={28} color="white" />
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white', letterSpacing: '-0.03em' }}>Prove Ownership</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Forgot Your<br />Password?
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 420, lineHeight: 1.7 }}>
              No worries. Enter your email and we'll send you a verification code to reset your password securely.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {features.map((feature, i) => (
              <motion.div key={i} variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <feature.icon size={18} color="rgba(255,255,255,0.9)" />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right - Form Panel */}
      <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 24px', position: 'relative', overflow: 'auto' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(34,197,94,0.04) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(99,102,241,0.03) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', top: 24, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <div className="d-lg-none" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="var(--primary-500)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Prove Ownership</span>
          </div>
        </motion.div>

        <div style={{ width: '100%', maxWidth: 440, marginTop: 40 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <div className="glass-card" style={{ padding: '40px 36px' }}>
              {/* Success State */}
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <CheckCircle size={36} color="var(--success-500)" />
                    </motion.div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.03em' }}>Check Your Email</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                      We've sent a password reset code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Please check your inbox and follow the instructions.
                    </p>
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-tertiary)', marginBottom: 24, textAlign: 'left' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Didn't receive the email?</strong><br />
                        Check your spam folder or make sure you entered the correct email address.
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button type="button" onClick={() => setSent(false)} className="btn-gradient-primary" style={{ height: 48, fontSize: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Send size={18} />
                          Resend Code
                        </div>
                      </button>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Link to="/reset-password" className="btn-ghost"
                          style={{ flex: 1, height: 44, fontSize: 14, fontWeight: 600, border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                          <Lock size={16} />
                          Enter Code
                        </Link>
                      </div>
                    </div>
                    <div style={{ marginTop: 20 }}>
                      <Link to="/login" style={{ fontSize: 14, color: 'var(--primary-600)', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} />
                        Back to Sign In
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                        <Lock size={28} color="white" />
                      </motion.div>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.03em' }}>Reset Password</h2>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        Enter the email address associated with your account and we'll send you a reset code.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
                      {/* Email */}
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ marginBottom: 24 }}>
                        <label htmlFor="email" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={14} /> Email Address <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="email"
                            type="email"
                            className={`modern-input${error && !email.trim() ? ' error' : ''}`}
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError('') }}
                            required
                            style={{ paddingLeft: 44 }}
                          />
                          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        </div>
                      </motion.div>

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#e11d48', fontSize: 13, fontWeight: 500 }}>
                              <AlertCircle size={15} style={{ flexShrink: 0 }} />
                              {error}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginBottom: 20 }}>
                        <button type="submit" disabled={loading} className="btn-gradient-primary" style={{ width: '100%', height: 48, fontSize: 15 }}>
                          {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                              Sending Code...
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <Send size={18} />
                              Send Reset Code
                            </div>
                          )}
                        </button>
                      </motion.div>
                    </form>

                    {/* Back to Login */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ textAlign: 'center' }}>
                      <Link to="/login" style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} />
                        Back to Sign In
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
