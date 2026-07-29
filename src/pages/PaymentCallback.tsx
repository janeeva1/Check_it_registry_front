import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('')

  const reference = searchParams.get('reference') || ''
  const trxref = searchParams.get('trxref') || ''
  const ref = reference || trxref

  useEffect(() => {
    if (!ref) {
      setStatus('failed')
      setMessage('No payment reference found.')
      return
    }

    const complete = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/complete-purchase`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: ref }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Verification failed')
        setStatus('success')
        setMessage(data.message || 'Purchase completed!')
      } catch (err: any) {
        setStatus('failed')
        setMessage(err.message || 'Could not verify payment')
      }
    }
    complete()
  }, [ref])

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row justify-content-center py-5">
          <div className="col-lg-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="modern-card p-5 text-center">
                {status === 'verifying' && (
                  <>
                    <Loader2 size={48} className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} />
                    <h4>Verifying Payment...</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>Please wait while we confirm your payment with Paystack.</p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'var(--success-50)' }}>
                      <CheckCircle size={32} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <h4>Payment Successful!</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your funds are held securely in escrow until you confirm delivery.</p>
                    <div className="d-flex gap-3 justify-content-center mt-3">
                      <Link to="/orders" className="btn-gradient-primary">View My Orders</Link>
                      <Link to="/marketplace" className="btn-outline-primary">Continue Shopping</Link>
                    </div>
                  </>
                )}

                {status === 'failed' && (
                  <>
                    <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'var(--danger-50)' }}>
                      <XCircle size={32} style={{ color: 'var(--danger-500)' }} />
                    </div>
                    <h4>Payment Verification Failed</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      If your card was charged, please contact support with reference: <strong>{ref}</strong>
                    </p>
                    <div className="d-flex gap-3 justify-content-center mt-3">
                      <Link to="/marketplace" className="btn-gradient-primary">Back to Marketplace</Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
