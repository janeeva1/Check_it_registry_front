import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Plus, Shield, Loader2, ArrowLeft, Building2, Calendar, Lock } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate } from 'react-router-dom'

export default function PaymentAddMethod() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [form, setForm] = useState({ cardNumber: '', cardHolder: '', expiry: '', cvv: '', billingZip: '', isDefault: false })
  const [submitting, setSubmitting] = useState(false)

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2)
    return d
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.cardNumber.replace(/\s/g, '').length < 13) { showError('Enter a valid card number'); return }
    if (form.expiry.length < 5) { showError('Enter a valid expiry date'); return }
    if (form.cvv.length < 3) { showError('Enter a valid CVV'); return }
    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payment/methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, cardNumber: form.cardNumber.replace(/\s/g, ''), userId: user?.id }),
      })
      if (!res.ok) throw new Error('Failed to add payment method')
      showSuccess('Payment method added!')
      setTimeout(() => navigate('/payment-methods'), 1200)
    } catch (err: any) { showError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <CreditCard size={24} className="text-white" />
                </div>
                <div>
                  <h1>Add Payment Method</h1>
                  <p>Securely add a credit or debit card</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <form onSubmit={handleSubmit}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><span style={{ color: 'red' }}>*</span> Required fields</div>
                <div className="modern-card p-4 p-md-5 mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-4 p-3 rounded-3" style={{ backgroundColor: 'var(--primary-50)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <Shield size={20} style={{ color: 'var(--primary-600)' }} />
                      <span style={{ fontSize: 13, color: 'var(--primary-700)' }}>Your information is encrypted</span>
                    </div>
                    <Lock size={18} style={{ color: 'var(--primary-600)' }} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Card Number <span style={{ color: 'red' }}>*</span></label>
                    <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                      <CreditCard size={18} style={{ color: 'var(--text-secondary)' }} />
                      <input className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', fontFamily: 'monospace' }} placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={e => setForm(p => ({ ...p, cardNumber: formatCard(e.target.value) }))} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Cardholder Name <span style={{ color: 'red' }}>*</span></label>
                    <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                      <Building2 size={18} style={{ color: 'var(--text-secondary)' }} />
                      <input className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0' }} placeholder="John Doe" value={form.cardHolder} onChange={e => setForm(p => ({ ...p, cardHolder: e.target.value }))} required />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Expiry Date <span style={{ color: 'red' }}>*</span></label>
                      <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                        <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
                        <input className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', fontFamily: 'monospace' }} placeholder="MM/YY" value={form.expiry} onChange={e => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">CVV <span style={{ color: 'red' }}>*</span></label>
                      <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                        <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
                        <input type="password" className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', fontFamily: 'monospace' }} placeholder="***" maxLength={4} value={form.cvv} onChange={e => setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))} required />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Billing ZIP Code <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span></label>
                    <input className="modern-input" placeholder="Enter ZIP" value={form.billingZip} onChange={e => setForm(p => ({ ...p, billingZip: e.target.value }))} />
                  </div>

                  <label className="d-flex align-items-center gap-2 mb-4" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                    <span style={{ fontSize: 14 }}>Set as default payment method</span>
                  </label>

                  <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={submitting}>
                    {submitting ? <Loader2 size={20} className="spinner-border" /> : <Plus size={20} />}
                    {submitting ? 'Adding...' : 'Add Payment Method'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
