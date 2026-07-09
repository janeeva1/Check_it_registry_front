import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { PaymentGate } from '../components/PaymentGate'
import { supabase } from '../lib/supabase'
import { Users, Loader2, CheckCircle, ArrowLeft, Smartphone, Mail, Phone, Percent } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BusinessOnboarding() {
  const navigate = useNavigate()
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', device_brand: '', device_model: '', device_imei: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [feeInfo, setFeeInfo] = useState<{ amount: number; commissionPercent: number } | null>(null)
  const [loadingFee, setLoadingFee] = useState(true)

  useEffect(() => {
    supabase.revenue.getFee('business_onboarding_fee').then((d: any) => {
      setFeeInfo(prev => ({ amount: d?.amount ?? 5000, commissionPercent: prev?.commissionPercent ?? 30 }))
    }).catch(() => setFeeInfo({ amount: 5000, commissionPercent: 30 }))
    supabase.revenue.getFee('business_onboarding_commission_percent').then((d: any) => {
      setFeeInfo(prev => ({ amount: prev?.amount ?? 5000, commissionPercent: d?.amount ?? 30 }))
    }).catch(() => {})
    setLoadingFee(false)
  }, [])

  const handlePaySuccess = (token: string) => {
    setShowPayment(false)
    submitOnboard(token)
  }

  const submitOnboard = async (bypassToken?: string) => {
    setSubmitting(true)
    try {
      const payload: any = { ...form }
      if (bypassToken) payload.pay_by_pass = bypassToken
      const res = await supabase.business.onboard(payload)
      if (res?.requiresPayment) {
        setFeeInfo({ amount: res.amount, commissionPercent: res.commissionPercent })
        setShowPayment(true)
        return
      }
      setCompleted(true)
      showSuccess('Customer onboarded successfully')
    } catch (e: any) {
      showError(e.message || 'Failed to onboard customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitOnboard()
  }

  const resetForm = () => {
    setForm({ customer_name: '', customer_email: '', customer_phone: '', device_brand: '', device_model: '', device_imei: '' })
    setCompleted(false)
  }

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex align-items-center gap-3">
              <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#fff" />
              </div>
              <div>
                <h1>Onboard Customer</h1>
                <p>Register a new customer and earn commission</p>
              </div>
            </div>
          </motion.div>

          {completed ? (
            <motion.div variants={itemVariants} className="modern-card p-5 text-center" style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={48} style={{ color: 'var(--success)' }} />
              </div>
              <h3>Customer Onboarded</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{form.customer_name} has been registered successfully.</p>
              {feeInfo && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Commission earned: <strong style={{ color: 'var(--primary-600)' }}>₦{(feeInfo.amount * feeInfo.commissionPercent / 100).toLocaleString()}</strong>
                </p>
              )}
              <div className="d-flex gap-3 justify-content-center mt-4">
                <button onClick={resetForm} className="btn-gradient-primary">Onboard Another</button>
                <button onClick={() => navigate('/business')} className="btn-outline-primary">Dashboard</button>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  {feeInfo && !loadingFee && (
                    <div className="modern-card p-4 mb-4" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="row g-3 text-center">
                        <div className="col-6">
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Onboarding Fee</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>₦{feeInfo.amount.toLocaleString()}</div>
                        </div>
                        <div className="col-6">
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Your Commission</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-600)' }}>{feeInfo.commissionPercent}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="modern-card p-4 p-md-5 mb-4">
                      <h5 className="mb-4 d-flex align-items-center gap-2"><Users size={20} style={{ color: 'var(--primary-600)' }} /> Customer Details</h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Full Name *</label>
                          <input className="modern-input" placeholder="Customer full name" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label"><Mail size={14} /> Email</label>
                          <input type="email" className="modern-input" placeholder="customer@email.com" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label"><Phone size={14} /> Phone</label>
                          <input className="modern-input" placeholder="+234 XXX XXX XXXX" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    <div className="modern-card p-4 p-md-5 mb-4">
                      <h5 className="mb-4 d-flex align-items-center gap-2"><Smartphone size={20} style={{ color: 'var(--danger-500)' }} /> Device Information</h5>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">Brand</label>
                          <input className="modern-input" placeholder="e.g. Samsung" value={form.device_brand} onChange={e => setForm(p => ({ ...p, device_brand: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Model</label>
                          <input className="modern-input" placeholder="e.g. Galaxy S24" value={form.device_model} onChange={e => setForm(p => ({ ...p, device_model: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">IMEI</label>
                          <input className="modern-input" placeholder="15-digit IMEI" value={form.device_imei} onChange={e => setForm(p => ({ ...p, device_imei: e.target.value.replace(/\D/g, '').slice(0, 15) }))} />
                        </div>
                      </div>
                    </div>

                    <div className="modern-card p-4">
                      <div className="d-flex justify-content-between">
                        <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn-gradient-primary d-flex align-items-center gap-2" disabled={submitting || !form.customer_name}>
                          {submitting ? <Loader2 size={18} className="spinner-border" /> : <Users size={18} />}
                          {submitting ? 'Processing...' : 'Onboard Customer'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
      <PaymentGate
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        feeType="business_onboarding_fee"
        feeLabel="Customer Onboarding"
        description="Fee for onboarding a new customer"
        onSuccess={handlePaySuccess}
      />
    </Layout>
  )
}
