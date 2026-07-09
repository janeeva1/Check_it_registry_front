import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Shield, X, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface PaymentGateProps {
  isOpen: boolean
  onClose: () => void
  feeType: string
  feeLabel: string
  description: string
  onSuccess: (bypassToken: string) => void
}

export function PaymentGate({ isOpen, onClose, feeType, feeLabel, description, onSuccess }: PaymentGateProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fee, setFee] = useState<{ amount: number; currency: string } | null>(null)
  const [fetchingFee, setFetchingFee] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      setFetchingFee(true)
      setError(null)
      try {
        const data = await supabase.revenue.getFee(feeType)
        setFee({ amount: data.amount, currency: data.currency || 'NGN' })
      } catch {
        setError('Unable to load fee information')
      } finally {
        setFetchingFee(false)
      }
    })()
  }, [isOpen, feeType])

  const handlePayProceed = async () => {
    setLoading(true)
    setError(null)
    try {
      const invoice = await supabase.revenue.createInvoice({
        fee_type: feeType,
        amount: fee?.amount || 0,
        currency: fee?.currency || 'NGN',
        description: `${feeLabel} - ${description}`,
      })
      onSuccess(invoice.invoice_id || invoice.reference || 'bypass')
    } catch (e: any) {
      setError(e.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            style={{ maxWidth: 440 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="modal-header">
              <h3>Payment Required</h3>
              <button onClick={onClose} className="btn-ghost p-1">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body text-center">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CreditCard size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h4 style={{ marginBottom: 8, fontSize: 18 }}>{feeLabel}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>{description}</p>

              {fetchingFee ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <Loader2 size={24} className="spin" />
                </div>
              ) : fee ? (
                <div
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    marginBottom: 16,
                    display: 'inline-block',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>Fee</span>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fee.currency} {fee.amount.toLocaleString()}
                  </span>
                </div>
              ) : null}

              {error && (
                <div
                  className="alert-banner alert-banner-danger"
                  style={{ marginBottom: 12, fontSize: 13 }}
                >
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handlePayProceed}
                disabled={loading || fetchingFee || !fee}
                className="btn-gradient-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <Shield size={16} />}
                {loading ? 'Processing...' : `Pay ${fee?.currency || 'NGN'} ${(fee?.amount || 0).toLocaleString()}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
