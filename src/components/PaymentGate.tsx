import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Shield, X, CreditCard } from 'lucide-react'
import { apiClient } from '../lib/apiClient'

interface PaymentGateProps {
  isOpen: boolean
  onClose: () => void
  feeType: string
  feeLabel: string
  description: string
  onSuccess: (bypassToken: string) => void
}

// Fee keys always end in _fee on the server ('nin_verification' -> 'nin_verification_fee')
const toFeeKey = (feeType: string) => (feeType.endsWith('_fee') ? feeType : `${feeType}_fee`)

export function PaymentGate({ isOpen, onClose, feeType, feeLabel, description, onSuccess }: PaymentGateProps) {
  const [loading, setLoading] = useState(false)
  const [fee, setFee] = useState<{ amount: number; currency: string } | null>(null)
  const [fetchingFee, setFetchingFee] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  useEffect(() => {
    if (!isOpen) return
    setReference(null)
    setPayUrl(null)
    ;(async () => {
      setFetchingFee(true)
      setError(null)
      try {
        const data = await apiClient.revenue.getFee(toFeeKey(feeType))
        setFee({ amount: Number(data.amount) || 0, currency: data.currency || 'NGN' })
      } catch {
        setError('Unable to load fee information')
      } finally {
        setFetchingFee(false)
      }
    })()
  }, [isOpen, feeType])

  // While the Paystack tab is open, check every 5 s whether the payment landed
  useEffect(() => {
    if (!isOpen || !reference) return
    let stopped = false
    const started = Date.now()
    const timer = window.setInterval(async () => {
      if (stopped || Date.now() - started > 10 * 60 * 1000) { window.clearInterval(timer); return }
      try {
        const res = await apiClient.revenue.verifyInvoice(reference)
        if (res && res.paid && !stopped) {
          stopped = true
          window.clearInterval(timer)
          onSuccessRef.current(reference)
        }
      } catch { /* keep waiting */ }
    }, 5000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [isOpen, reference])

  // Step 1: create the invoice on the server and open Paystack in a new tab
  const handlePayProceed = async () => {
    setLoading(true)
    setError(null)
    try {
      const invoice = await apiClient.revenue.createInvoice({
        fee_type: toFeeKey(feeType),
        description: `${feeLabel} - ${description}`,
      })
      if (invoice && invoice.requiresPayment === false) {
        onSuccess('')
        return
      }
      if (!invoice?.authorization_url || !invoice?.reference) {
        throw new Error('Could not start the payment. Please try again.')
      }
      setReference(invoice.reference)
      setPayUrl(invoice.authorization_url)
      window.open(invoice.authorization_url, '_blank', 'noopener')
    } catch (e: any) {
      setError(e.message || 'Failed to start payment')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: the user says they've paid; the server confirms with Paystack
  const handleCheckPaid = async () => {
    if (!reference) return
    setChecking(true)
    setError(null)
    try {
      const res = await apiClient.revenue.verifyInvoice(reference)
      if (res && res.paid) {
        onSuccess(reference)
      } else {
        setError('We have not received this payment yet. Finish paying in the Paystack tab, then try again.')
      }
    } catch (e: any) {
      setError(e.message || 'Could not check the payment')
    } finally {
      setChecking(false)
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
            style={{ maxWidth: 440, width: '90%' }}
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

              {reference && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                  Complete the payment in the Paystack tab. This window continues automatically once the payment is confirmed.
                </p>
              )}

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
              {!reference ? (
                <button
                  onClick={handlePayProceed}
                  disabled={loading || fetchingFee || !fee}
                  className="btn-gradient-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {loading ? <Loader2 size={16} className="spin" /> : <Shield size={16} />}
                  {loading ? 'Opening Paystack...' : `Pay ${fee?.currency || 'NGN'} ${(fee?.amount || 0).toLocaleString()}`}
                </button>
              ) : (
                <>
                  {payUrl && (
                    <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                      Open payment page
                    </a>
                  )}
                  <button
                    onClick={handleCheckPaid}
                    disabled={checking}
                    className="btn-gradient-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {checking ? <Loader2 size={16} className="spin" /> : <Shield size={16} />}
                    {checking ? 'Checking...' : "I've paid"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
