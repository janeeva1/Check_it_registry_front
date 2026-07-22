import { useEffect, useMemo, useState, useCallback } from 'react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { motion } from 'framer-motion'
import {
  Receipt, Filter, Smartphone, Search, RefreshCw, Truck,
  CheckCircle, DollarSign, Clock, Package, User, AlertCircle
} from 'lucide-react'
import { apiClient } from '../lib/apiClient'

type SellerOrder = {
  id: string
  product: string
  buyer: string
  buyer_email?: string
  buyer_avatar?: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'sold'
  date: string
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [status, setStatus] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'sold'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.marketplace.getSellerOrders()
      const mapped = data.map((o: any) => ({
        id: o.id,
        product: `${o.brand} ${o.model}`,
        buyer: o.buyer_name || 'Unknown',
        buyer_email: o.buyer_email,
        amount: Number(o.price),
        currency: o.currency,
        status: o.status,
        date: new Date(o.sold_at || o.updated_at).toLocaleDateString(),
      }))
      setOrders(mapped)
    } catch {
      showError('Error', 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filtered = useMemo(
    () =>
      orders
        .filter(o => status === 'all' || o.status === status)
        .filter(
          o =>
            searchQuery === '' ||
            o.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.buyer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [orders, status, searchQuery]
  )

  const currency = (n: number, c = '₦') => `${c}${n.toLocaleString()}`

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      if (!window.confirm(`Mark this order as "${newStatus}"?`)) return
      await apiClient.marketplace.update(id, { status: newStatus })
      showSuccess(`Order updated to ${newStatus}`)
      fetchOrders()
    } catch (err: any) {
      showError('Failed', err.message)
    }
  }

  const stats = {
    sold: orders.filter(o => o.status === 'sold').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((a, o) => a + o.amount, 0),
  }

  const getStatusBadge = (s: string) => {
    const map: Record<string, { className: string; label: string }> = {
      sold: { className: 'status-verified', label: 'New Order' },
      shipped: { className: 'status-pending', label: 'Shipped' },
      completed: { className: 'status-recovered', label: 'Completed' },
      pending: { className: 'status-pending', label: 'Pending' },
      paid: { className: 'status-verified', label: 'Paid' },
      cancelled: { className: 'status-stolen', label: 'Cancelled' },
    }
    const s2 = map[s] || { className: 'status-inactive', label: s }
    return <span className={`status-badge ${s2.className}`}>{s2.label}</span>
  }

  const LoadingSkeleton = () => (
    <div className="modern-card">
      <div className="table-responsive">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Buyer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(i => (
              <tr key={i}>
                <td><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 90 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 90 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <Layout requireAuth allowedRoles={['business']}>
      <div className="container-fluid py-4">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h1>Seller Orders</h1>
            <p>Manage incoming orders from buyers</p>
          </div>
          <button className="btn-ghost" onClick={fetchOrders}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="row g-3 mb-4">
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#10b981' }}>
                <Package size={22} />
              </div>
              <div className="stat-value">{stats.sold}</div>
              <div className="stat-label">New Orders</div>
            </div>
          </motion.div>
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Truck size={22} />
              </div>
              <div className="stat-value">{stats.shipped}</div>
              <div className="stat-label">In Transit</div>
            </div>
          </motion.div>
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <CheckCircle size={22} />
              </div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </motion.div>
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <DollarSign size={22} />
              </div>
              <div className="stat-value">{currency(stats.totalRevenue)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </motion.div>
        </div>

        <div className="toolbar">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="position-relative">
              <Search size={16} className="position-absolute" style={{ left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="modern-input"
                style={{ paddingLeft: 40, width: 260 }}
                placeholder="Search orders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="modern-select"
              style={{ width: 160 }}
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="sold">New Orders</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="toolbar-actions">
            <span className="text-secondary" style={{ fontSize: 13 }}>
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="modern-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Receipt size={32} />
                </div>
                <h3>No orders found</h3>
                <p>
                  {searchQuery || status !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You have no incoming orders yet. Orders appear here when a buyer purchases your listing.'}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="modern-card p-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="avatar avatar-sm"
                            style={{
                              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                              borderRadius: 10,
                            }}
                          >
                            <Smartphone size={14} />
                          </div>
                          <strong>{order.product}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="avatar avatar-sm"
                            style={{ background: 'var(--primary-500)' }}
                          >
                            <User size={14} />
                          </div>
                          <div>
                            <div>{order.buyer}</div>
                            {order.buyer_email && (
                              <small className="text-secondary">{order.buyer_email}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold">{currency(order.amount, order.currency)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="text-secondary">
                        <small>{order.date}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {order.status === 'sold' && (
                            <button
                              className="btn-ghost"
                              style={{ padding: '6px 12px', fontSize: 13, color: 'var(--primary-600)' }}
                              onClick={() => updateStatus(order.id, 'shipped')}
                            >
                              <Truck size={14} />
                              Ship
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button
                              className="btn-ghost"
                              style={{ padding: '6px 12px', fontSize: 13, color: 'var(--success-500)' }}
                              onClick={() => updateStatus(order.id, 'completed')}
                            >
                              <CheckCircle size={14} />
                              Complete
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <span className="text-secondary" style={{ fontSize: 13 }}>
                              <CheckCircle size={14} className="me-1" />
                              Done
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
