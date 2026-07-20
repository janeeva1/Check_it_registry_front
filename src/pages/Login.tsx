import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, LogIn, UserPlus,
  AlertCircle, CheckCircle, Shield, Smartphone,
  Search, RefreshCw, Github, Chrome, ArrowLeft
} from 'lucide-react'
import { useToast } from '../components/Toast'
import OTPVerification from '../components/OTPVerification'

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
  { icon: Shield, text: 'Real-time device monitoring & protection' },
  { icon: Search, text: 'Instant IMEI & serial number verification' },
  { icon: RefreshCw, text: 'Cross-border stolen device tracking' },
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

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpData, setOtpData] = useState<{
    userId: string;
    deviceFingerprint: string;
    userEmail: string;
  } | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember_device: rememberMe,
        }),
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        throw new Error('Server returned an invalid response. Please try again later.')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.requires_device_verification) {
        setOtpData({
          userId: data.user_id,
          deviceFingerprint: data.device_fingerprint,
          userEmail: email.trim()
        })
        setShowOTPModal(true)
        showSuccess('Verification Required', 'Please check your email for a verification code.')
      } else {
        login(data.token, data.user)
        showSuccess('Login Successful', `Welcome back, ${data.user.name || 'User'}!`)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Unable to connect to server. Please check your connection and try again.')
      } else {
        setError(errorMessage)
      }
      showError('Login Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (otp: string, rememberDevice: boolean) => {
    if (!otpData) return
    setOtpLoading(true)
    setOtpError('')

    try {
      const response = await fetch(`${API_URL}/auth/verify-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: otpData.userId,
          otp_code: otp,
          device_fingerprint: otpData.deviceFingerprint,
          remember_device: rememberDevice,
        }),
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        throw new Error('Server returned an invalid response. Please try again later.')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      login(data.token, data.user)
      setShowOTPModal(false)
      showSuccess('Login Successful', `Welcome back, ${data.user.name || 'User'}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.'
      setOtpError(errorMessage)
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!otpData) return
    try {
      const response = await fetch(`${API_URL}/auth/resend-device-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: otpData.userId,
          device_fingerprint: otpData.deviceFingerprint,
        }),
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        throw new Error('Server returned an invalid response.')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code')
      }

      showSuccess('Code Sent', 'A new verification code has been sent to your email.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code'
      showError('Resend Failed', errorMessage)
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
          {/* Grid overlay */}
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
                <img src="/logo1.png" alt="Check It Logo" style={{ height: '28px', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white', letterSpacing: '-0.03em' }}>Check It</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Protect What<br />Matters Most
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 420, lineHeight: 1.7 }}>
              The all-in-one platform for device registration, verification, and recovery. Keep your devices safe across borders.
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
        {/* Subtle background pattern */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(34,197,94,0.04) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(99,102,241,0.03) 0%, transparent 50%)', pointerEvents: 'none' }} />

        {/* Inline Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', top: 24, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <div className="d-lg-none" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo1.png" alt="Check It Logo" style={{ height: '24px', objectFit: 'contain' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Check It</span>
          </div>
        </motion.div>

        {/* Form Container */}
        <div style={{ width: '100%', maxWidth: 440, marginTop: 40 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <div className="glass-card" style={{ padding: '40px 36px' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }} style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                  <LogIn size={28} color="white" />
                </motion.div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.03em' }}>Welcome Back</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Sign in to access your account</p>
              </div>

              <form onSubmit={handleLogin}>
                {/* Email */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ marginBottom: 20 }}>
                  <label htmlFor="email" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} /> Email Address
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

                {/* Password */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} style={{ marginBottom: 16 }}>
                  <label htmlFor="password" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={14} /> Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`modern-input${error && !password.trim() ? ' error' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      required
                      style={{ paddingLeft: 44 }}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>

                {/* Remember Me & Forgot Password */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--primary-500)', cursor: 'pointer' }} />
                    Remember me
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: 14, color: 'var(--primary-600)', fontWeight: 500, textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ marginBottom: 20 }}>
                  <button type="submit" disabled={loading} className="btn-gradient-primary" style={{ width: '100%', height: 48, fontSize: 15 }}>
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        Signing in...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <LogIn size={18} />
                        Sign In
                      </div>
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Social Login */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <div className="divider-text" style={{ marginBottom: 20, fontSize: 12 }}>
                  or continue with
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1, height: 44, fontSize: 14, fontWeight: 600, border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Chrome size={18} />
                    Google
                  </button>
                  <button type="button" className="btn-ghost" style={{ flex: 1, height: 44, fontSize: 14, fontWeight: 600, border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Github size={18} />
                    GitHub
                  </button>
                </div>
              </motion.div>

              {/* Register Link */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ textAlign: 'center', marginTop: 24 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
                    Create one
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerification
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false)
          setOtpData(null)
          setOtpError('')
        }}
        onVerify={handleOTPVerify}
        onResendOTP={handleResendOTP}
        userEmail={otpData?.userEmail}
        deviceInfo={{
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop'
        }}
        loading={otpLoading}
        error={otpError}
      />
    </div>
  )
}
