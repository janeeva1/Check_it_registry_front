import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Plus, Check, Trash2, Star, Loader2, ArrowLeft } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate, Link } from 'react-router-dom'

type PaymentMethod = {
  id: string
  cardLast4: string
  cardBrand: string
  cardHolder: string
  expiry: string
  isDefault: boolean
}

export default function PaymentMethodSelection() {
  const { user: _user } = useAuth()
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payment/methods`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setMethods(data.data || [])
      } catch { setMethods([]) }
      finally { setLoading(false) }
    }
    fetchMethods()
  }, [])

  const setDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payment/methods/${id}/default`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
      setMethods(p => p.map(m => ({ ...m, isDefault: m.id === id })))
      showSuccess('Default payment method updated')
    } catch { showError('Failed to update default') }
  }

  const deleteMethod = async (id: string) => {
    try {
      setDeleting(id)
      const token = localStorage.getItem('auth_token')
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payment/methods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setMethods(p => p.filter(m => m.id !== id))
      showSuccess('Payment method removed')
    } catch { showError('Failed to remove') }
    finally { setDeleting(null) }
  }

  const brandIcon = (brand: string) => {
    const colors: Record<string, string> = { visa: '#1A1F71', mastercard: '#EB001B', amex: '#2E77BC', discover: '#FF6000' }
    return { color: colors[brand.toLowerCase()] || 'var(--text-secondary)', label: brand || 'Card' }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <CreditCard size={24} className="text-white" />
                </div>
                <div>
                  <h1>Payment Methods</h1>
                  <p>Manage your saved cards</p>
                </div>
                <div className="ms-md-auto">
                  <Link to="/payment/add" className="btn-gradient-primary d-inline-flex align-items-center gap-2">
                    <Plus size={18} /> Add Method
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
        ) : methods.length === 0 ? (
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="modern-card p-5 text-center">
                <div className="empty-state">
                  <div className="empty-state-icon"><CreditCard size={48} /></div>
                  <h3>No Payment Methods</h3>
                  <p>Add a credit or debit card to get started</p>
                  <Link to="/payment/add" className="btn-gradient-primary mt-3 d-inline-flex align-items-center gap-2"><Plus size={18} /> Add Method</Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="row g-3">
                <AnimatePresence>
                  {methods.map((m, _i) => {
                    const bi = brandIcon(m.cardBrand)
                    return (
                      <motion.div key={m.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} layout>
                        <div className={`modern-card p-3 ${selectedId === m.id ? 'border-primary' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(m.id)}>
                          <div className="row g-3 align-items-center">
                            <div className="col-auto">
                              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 56, height: 40, background: bi.color, color: '#fff', fontSize: 10, fontWeight: 700 }}>
                                {bi.label}
                              </div>
                            </div>
                            <div className="col">
                              <p className="fw-medium mb-1">&bull;&bull;&bull;&bull; {m.cardLast4}</p>
                              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{m.cardHolder} &middot; Expires {m.expiry}</p>
                            </div>
                            <div className="col-auto d-flex flex-wrap gap-2 align-items-center">
                              {m.isDefault && <span className="status-badge status-verified d-flex align-items-center gap-1"><Star size={12} /> Default</span>}
                              {!m.isDefault && (
                                <button className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setDefault(m.id) }}>
                                  <Star size={14} /> Set Default
                                </button>
                              )}
                              <button className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--danger-500)' }} onClick={(e) => { e.stopPropagation(); deleteMethod(m.id) }} disabled={deleting === m.id}>
                                {deleting === m.id ? <Loader2 size={14} className="spinner-border" /> : <Trash2 size={14} />}
                              </button>
                              <div className={`d-flex align-items-center justify-content-center rounded-circle border ${selectedId === m.id ? 'border-primary' : ''}`} style={{ width: 24, height: 24 }}>
                                {selectedId === m.id && <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--primary-600)' }} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {selectedId && (
                <div className="modern-card p-4 mt-3 text-center">
                  <button className="btn-gradient-primary d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}>
                    <Check size={18} /> Use Selected Card
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
