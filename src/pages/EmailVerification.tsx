import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, XCircle, Mail } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function EmailVerification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Verification failed')
        }
        setVerified(true)
        showSuccess('Email verified successfully!')
        setTimeout(() => navigate(user ? '/settings' : '/login'), 1500)
      } catch (err: any) {
        setVerifyError(err.message)
        showError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Success
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
                  <p style={{ color: 'var(--text-secondary)' }}>{user?.email || ''}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Redirecting...</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Verifying token
  if (token && loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row justify-content-center py-5">
            <div className="col-md-6 col-lg-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <Loader2 size={48} className="spinner-border" style={{ color: 'var(--primary-500)' }} />
                  <h3 className="mt-3">Verifying your email...</h3>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Token expired or invalid
  if (verifyError) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row justify-content-center py-5">
            <div className="col-md-6 col-lg-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--danger-50)' }}>
                    <XCircle size={48} style={{ color: 'var(--danger-500)' }} />
                  </div>
                  <h3>Verification Failed</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{verifyError}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Try logging in again to receive a fresh verification link.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Show initializing spinner briefly while token is present but not yet processing
  if (token && !loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row justify-content-center py-5">
            <div className="col-md-6 col-lg-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <Loader2 size={48} className="spinner-border" style={{ color: 'var(--primary-500)' }} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // No token in URL — user probably typed the URL manually
  return (
    <Layout>
      <div className="container-fluid">
        <div className="row justify-content-center py-5">
          <div className="col-md-6 col-lg-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="modern-card p-5 text-center">
                <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--primary-50)' }}>
                  <Mail size={48} style={{ color: 'var(--primary-500)' }} />
                </div>
                <h3>Check Your Email</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  We sent a verification link to <strong>{user?.email || 'your email'}</strong>.
                  Click the link to verify your account.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Didn't receive it? Try logging in to trigger a fresh link.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
