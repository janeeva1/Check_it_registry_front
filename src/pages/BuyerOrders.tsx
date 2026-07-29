import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Shield, CheckCircle, XCircle, AlertTriangle, Loader2, ThumbsUp } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

type Order = {
  escrow_id: string
  listing_id: string
  listing_title: string
  listing_price: number
  amount: number
  escrow_status: 'held' | 'released' | 'refunded' | 'disputed'
  delivery_status: 'pending' | 'confirmed' | 'disputed' | null
  platform_fee_percent: number
  seller_amount: number
  seller_name: string
  device_brand: string
  device_model: string
  images: string[]
  created_at: string
  released_at: string | null
  confirmed_at: string | null
  disputed_at: string | null
  dispute_reason: string | null
}

export default function BuyerOrders() {
  const { user: _user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'held' | 'released' | 'disputed'>('all')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/escrow/buyer-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load orders')
      const data = await res.json()
      setOrders(data.data || [])
    } catch {
      setOrders([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [])

  const confirmDelivery = async (escrowId: string) => {
    if (!confirm('Confirm that you have received the item and are satisfied with it?\n\nOnce confirmed, funds will be released to the seller.')) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/escrow/${escrowId}/confirm-delivery`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to confirm')
      showSuccess('Delivery confirmed! Funds have been released to the seller.')
      fetchOrders()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const disputeDelivery = async (escrowId: string) => {
    const reason = prompt('Please describe the issue with your order:')
    if (!reason) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/escrow/${escrowId}/dispute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to dispute')
      showSuccess('Dispute filed. An admin will review your case.')
      fetchOrders()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.escrow_status === filter)

  const statusBadge = (o: Order) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      held: { label: 'Awaiting Delivery', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
      released: { label: 'Completed', color: 'var(--success-500)', bg: 'var(--success-50)' },
      refunded: { label: 'Refunded', color: 'var(--danger-500)', bg: 'var(--danger-50)' },
      disputed: { label: 'Disputed', color: 'var(--danger-600)', bg: 'var(--danger-50)' },
    }
    const s = map[o.escrow_status] || { label: o.escrow_status, color: 'var(--text-secondary)', bg: 'var(--gray-100)' }
    return <span className="badge" style={{ background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="container-fluid p-4 text-center"><Loader2 size={32} className="spinner-border" /></div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1" style={{ fontWeight: 600 }}>My Orders</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track purchases and confirm delivery</p>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchOrders}>Refresh</button>
        </div>

        <div className="d-flex gap-2 mb-4">
          {(['all', 'held', 'released', 'disputed'] as const).map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-gradient-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {filter === f && <span className="ms-1">({orders.filter(o => f === 'all' || o.escrow_status === f).length})</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="modern-card p-5 text-center">
            <Package size={48} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
            <h5 className="mt-3">No Orders Yet</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Items you purchase will appear here</p>
            <Link to="/marketplace/browse" className="btn-gradient-primary mt-2">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map(o => (
              <motion.div key={o.escrow_id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-3">
                  <div className="d-flex gap-3">
                    <div className="flex-shrink-0" style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: 'var(--gray-100)' }}>
                      {o.images?.[0] ? (
                        <img src={o.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100"><Package size={28} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} /></div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h6 className="mb-1" style={{ fontWeight: 600 }}>{o.listing_title}</h6>
                          <p className="mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {o.device_brand} {o.device_model} · Seller: {o.seller_name}
                          </p>
                          <p className="mb-0" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-600)' }}>
                            ₦{Number(o.amount).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-end">
                          <div>{statusBadge(o)}</div>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Escrow info */}
                      <div className="mt-2 d-flex align-items-center gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Shield size={12} />
                        <span>Escrow protected · {o.platform_fee_percent}% platform fee</span>
                      </div>

                      {/* Actions */}
                      {o.escrow_status === 'held' && (
                        <div className="d-flex gap-2 mt-2">
                          <button className="btn btn-sm btn-success" onClick={() => confirmDelivery(o.escrow_id)}>
                            <ThumbsUp size={14} className="me-1" /> Confirm Delivery
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => disputeDelivery(o.escrow_id)}>
                            <AlertTriangle size={14} className="me-1" /> Report Issue
                          </button>
                        </div>
                      )}

                      {o.escrow_status === 'disputed' && (
                        <div className="mt-2 p-2 rounded" style={{ background: 'var(--danger-50)', fontSize: 12 }}>
                          <strong style={{ color: 'var(--danger-600)' }}>Dispute filed:</strong>
                          <span className="ms-1" style={{ color: 'var(--text-secondary)' }}>{o.dispute_reason}</span>
                          <p className="mb-0 mt-1" style={{ color: 'var(--text-secondary)' }}>An admin is reviewing your case.</p>
                        </div>
                      )}

                      {o.escrow_status === 'released' && (
                        <div className="mt-2 p-2 rounded" style={{ background: 'var(--success-50)', fontSize: 12 }}>
                          <CheckCircle size={12} className="me-1" style={{ color: 'var(--success-500)' }} />
                          <span style={{ color: 'var(--success-700)' }}>
                            Delivered and confirmed on {o.confirmed_at ? new Date(o.confirmed_at).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      )}

                      {o.escrow_status === 'refunded' && (
                        <div className="mt-2 p-2 rounded" style={{ background: 'var(--danger-50)', fontSize: 12 }}>
                          <XCircle size={12} className="me-1" style={{ color: 'var(--danger-500)' }} />
                          <span style={{ color: 'var(--danger-700)' }}>Refunded — ₦{Number(o.amount).toLocaleString()} returned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
