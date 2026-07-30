import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Mail, Lock, Eye, EyeOff, UserPlus,
  User, Phone, MapPin, AlertCircle, CheckCircle,
  Building, ArrowRight, ArrowLeft, Github, Chrome,
  Search, RefreshCw
} from 'lucide-react'
import { apiClient } from '../lib/apiClient'
import { useToast } from '../components/Toast'

const floatingShapes = [
  { size: 240, x: '10%', y: '15%', delay: 0, duration: 8, blur: '120px', color: 'rgba(74, 222, 128, 0.15)' },
  { size: 320, x: '70%', y: '20%', delay: 1, duration: 10, blur: '160px', color: 'rgba(99, 102, 241, 0.12)' },
  { size: 200, x: '50%', y: '70%', delay: 2, duration: 7, blur: '100px', color: 'rgba(34, 197, 94, 0.1)' },
  { size: 280, x: '20%', y: '75%', delay: 0.5, duration: 9, blur: '140px', color: 'rgba(16, 185, 129, 0.12)' },
  { size: 180, x: '80%', y: '60%', delay: 1.5, duration: 6, blur: '90px', color: 'rgba(52, 211, 153, 0.1)' },
]

const features = [
  { icon: Shield, text: 'Military-grade encryption for your data' },
  { icon: Search, text: 'Global device recovery network' },
  { icon: RefreshCw, text: 'Real-time alerts & monitoring' },
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

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    region: '',
    accountType: 'user'
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { toasts: _toasts, removeToast: _removeToast, showSuccess, showError } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await apiClient.auth.signUp({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        region: formData.region.trim() || undefined,
      })

      if (signUpError) {
        throw signUpError
      }

      if (data?.user) {
        showSuccess('Registration Successful', 'Welcome to Prove Ownership! You can now start protecting your devices.')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(errorMessage)
      showError('Registration Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 2) return 'var(--danger-500)'
    if (strength < 4) return 'var(--warning-500)'
    return 'var(--success-500)'
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 2) return 'Weak'
    if (strength < 4) return 'Medium'
    return 'Strong'
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const stepLabels = ['Account', 'Security', 'Details']

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
                <img src="/logo1.png" alt="Prove Ownership Logo" style={{ height: '28px', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white', letterSpacing: '-0.03em' }}>Prove Ownership</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Join the<br />Protection Network
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 420, lineHeight: 1.7 }}>
              Create your free account and start securing your devices with our advanced tracking and recovery platform.
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

        <div style={{ width: '100%', maxWidth: 480, marginTop: 40 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <div className="glass-card" style={{ padding: '40px 36px' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }} style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                  <UserPlus size={28} color="white" />
                </motion.div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.03em' }}>Create Account</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Fill in your details to get started</p>
              </div>

              {/* Progress Steps */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600,
                      background: step >= stepNum ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-tertiary)',
                      color: step >= stepNum ? 'white' : 'var(--text-tertiary)',
                      boxShadow: step >= stepNum ? '0 4px 12px rgba(22,163,74,0.3)' : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div style={{
                        width: 48, height: 2,
                        background: step > stepNum ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--border-color)',
                        transition: 'background 0.3s ease',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -20, marginBottom: 24, padding: '0 4px' }}>
                {stepLabels.map((label, i) => (
                  <span key={label} style={{ fontSize: 11, fontWeight: 600, color: step === i + 1 ? 'var(--primary-600)' : 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'color 0.3s ease' }}>
                    {label}
                  </span>
                ))}
              </div>

              <form onSubmit={step === 3 ? handleRegister : (e) => { e.preventDefault(); handleNextStep() }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
                <AnimatePresence mode="wait">
                  {/* Step 1: Basic Information */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                      <div style={{ marginBottom: 20 }}>
                        <label htmlFor="name" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={14} /> Full Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input id="name" name="name" type="text" className="modern-input" placeholder="John Doe"
                            value={formData.name} onChange={handleInputChange} required
                            style={{ paddingLeft: 44 }} />
                          <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label htmlFor="email" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={14} /> Email Address <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input id="email" name="email" type="email" className="modern-input" placeholder="name@example.com"
                            value={formData.email} onChange={handleInputChange} required
                            style={{ paddingLeft: 44 }} />
                          <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: 4 }}>
                        <label htmlFor="accountType" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building size={14} /> Account Type <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <select id="accountType" name="accountType" className="modern-select"
                          value={formData.accountType} onChange={handleInputChange} style={{ paddingLeft: 44 }}>
                          <option value="user">Personal Account</option>
                          <option value="business">Business Account</option>
                        </select>
                        <Building size={16} style={{ position: 'absolute', marginTop: -32, marginLeft: 14, color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Security */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                      <div style={{ marginBottom: 20 }}>
                        <label htmlFor="password" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Lock size={14} /> Password <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="modern-input" placeholder="Create a strong password"
                            value={formData.password} onChange={handleInputChange} required
                            style={{ paddingLeft: 44 }} />
                          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formData.password && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Password strength</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: getPasswordStrengthColor(passwordStrength) }}>
                                {getPasswordStrengthText(passwordStrength)}
                              </span>
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                                transition={{ duration: 0.4 }}
                                style={{ height: '100%', borderRadius: 2, backgroundColor: getPasswordStrengthColor(passwordStrength) }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                              {[
                                { label: '8+ chars', check: formData.password.length >= 8 },
                                { label: 'Uppercase', check: /[A-Z]/.test(formData.password) },
                                { label: 'Number', check: /[0-9]/.test(formData.password) },
                                { label: 'Symbol', check: /[^A-Za-z0-9]/.test(formData.password) },
                              ].map((req) => (
                                <span key={req.label} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: req.check ? 'var(--success-500)' : 'var(--text-tertiary)', fontWeight: 500 }}>
                                  {req.check ? <CheckCircle size={10} /> : <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--text-tertiary)' }} />}
                                  {req.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: 4 }}>
                        <label htmlFor="confirmPassword" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Lock size={14} /> Confirm Password <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className={`modern-input${formData.confirmPassword && formData.password !== formData.confirmPassword ? ' error' : ''}`} placeholder="Confirm your password"
                            value={formData.confirmPassword} onChange={handleInputChange} required
                            style={{ paddingLeft: 44 }} />
                          <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <span style={{ fontSize: 12, color: 'var(--danger-500)', marginTop: 4, display: 'block' }}>Passwords do not match</span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Additional Information */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                      <div style={{ marginBottom: 20 }}>
                        <label htmlFor="phone" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={14} /> Phone Number <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input id="phone" name="phone" type="tel" className="modern-input" placeholder="+1 (555) 000-0000"
                            value={formData.phone} onChange={handleInputChange}
                            style={{ paddingLeft: 44 }} />
                          <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>Optional, used for recovery alerts</span>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label htmlFor="region" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} /> Region / Country <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input id="region" name="region" type="text" className="modern-input" placeholder="e.g. United States"
                            value={formData.region} onChange={handleInputChange}
                            style={{ paddingLeft: 44 }} />
                          <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      {/* Terms */}
                      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 16, marginBottom: 4 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: 'var(--primary-500)', marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            I have read and agree to the{' '}
                            <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link>
                            {', '}
                            <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
                            {', and '}
                            <Link to="/cookies" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>Cookie Policy</Link>
                            . I understand that Prove Ownership is a device registry and notification platform and does NOT guarantee device recovery.
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: step === 3 ? 16 : 16, marginBottom: step === 3 ? 0 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#e11d48', fontSize: 13, fontWeight: 500 }}>
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  {step > 1 && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => setStep(step - 1)} className="btn-ghost"
                      style={{ flex: 1, height: 48, fontSize: 14, fontWeight: 600, border: '1px solid var(--border-color)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <ArrowLeft size={16} />
                      Back
                    </motion.button>
                  )}
                  <button type="submit" disabled={loading || (step === 3 && !acceptTerms)}
                    className="btn-gradient-primary" style={{ flex: 1, height: 48, fontSize: 15, minWidth: step === 1 || step === 2 ? undefined : 0, opacity: step === 3 && !acceptTerms ? 0.5 : 1 }}>
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        Creating Account...
                      </div>
                    ) : step === 3 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <CheckCircle size={18} />
                        Create Account
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        Next Step
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {/* Social Register */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 20 }}>
                  <div className="divider-text" style={{ marginBottom: 16, fontSize: 12 }}>
                    or sign up with
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
              )}

              {/* Login Link */}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
