import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { motion } from 'framer-motion'
import {
  CreditCard, Wallet, Search, RefreshCw,
  Banknote, ArrowUpRight, CheckCircle, Clock, AlertCircle, Landmark
} from 'lucide-react'
import { apiClient } from '../lib/apiClient'

type Payout = {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: string
  method?: string
  listingTitle?: string
  reference?: string
}

export default function BusinessPayouts() {
  const [balance, setBalance] = useState(0)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [method, setMethod] = useState('Bank Transfer')
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [status, setStatus] = useState<'all' | 'pending' | 'processing' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const bal: any = await apiClient.payments.getBalance()
      if (bal && typeof bal.balance === 'number') setBalance(bal.balance)
      if (bal && typeof bal.pending === 'number') setPendingBalance(bal.pending)

      const payoutData: any = await apiClient.payments.getPayouts({ page: 1, limit: 50 })
      const rows = Array.isArray(payoutData?.data) ? payoutData.data : Array.isArray(payoutData) ? payoutData : []
      setPayouts(rows.map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        currency: r.currency || 'NGN',
        status: r.status,
        requestedAt: r.requestedAt || r.created_at,
        method: r.method || 'Bank Transfer',
        listingTitle: r.listingTitle || null,
        reference: r.reference || null,
      })))
    } catch {
      showError('Error', 'Failed to load payout data')
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async () => {
    if (balance <= 0) {
      showError('Insufficient balance', 'Your available balance is too low to request a payout.')
      return
    }
    setRequesting(true)
    try {
      await fetchData()
      showSuccess('Payout requested successfully')
    } catch {
      showError('Failed', 'Could not process payout request')
    } finally {
      setRequesting(false)
    }
  }

  const currency = (n: number, c = 'NGN') => `${c === 'NGN' ? '₦' : c}${n.toLocaleString()}`

  const filtered = payouts
    .filter(p => status === 'all' || p.status === status)
    .filter(p => searchQuery === '' || p.id.toLowerCase().includes(searchQuery.toLowerCase()) || (p.listingTitle || '').toLowerCase().includes(searchQuery.toLowerCase()))

  const getStatusBadge = (s: string) => {
    const map: Record<string, { className: string; label: string }> = {
      completed: { className: 'status-verified', label: 'Paid' },
      paid: { className: 'status-verified', label: 'Paid' },
      processing: { className: 'status-pending', label: 'Processing' },
      pending: { className: 'status-pending', label: 'Pending' },
      failed: { className: 'status-inactive', label: 'Failed' },
    }
    const s2 = map[s] || { className: 'status-inactive', label: s }
    return <span className={`status-badge ${s2.className}`}>{s2.label}</span>
  }

  const getStatusIcon = (s: string) => {
    if (s === 'completed' || s === 'paid') return <CheckCircle size={16} style={{ color: 'var(--success-500)' }} />
    if (s === 'processing') return <Clock size={16} style={{ color: '#f59e0b' }} />
    return <AlertCircle size={16} style={{ color: 'var(--text-tertiary)' }} />
  }

  const LoadingSkeleton = () => (
    <div className="modern-card">
      <div className="table-responsive">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Payout ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Requested</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(i => (
              <tr key={i}>
                <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
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
            <h1>Business Payouts</h1>
            <p>Manage your earnings and payment withdrawals</p>
          </div>
          <button className="btn-ghost" onClick={fetchData}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="row g-3 mb-4">
          <motion.div
            className="col-12 col-md-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="modern-card p-4 h-100">
              <div className="d-flex align-items-start justify-content-between mb-2">
                <div>
                  <div className="stat-label mb-1">Available Balance</div>
                  <div className="stat-value">{loading ? '...' : currency(balance)}</div>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#10b981',
                  }}
                >
                  <Wallet size={24} />
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${balance > 0 ? Math.min(100, (balance / (balance + pendingBalance || 1)) * 100) : 0}%`,
                      height: '100%',
                      background: 'var(--success-500)',
                      borderRadius: 2,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <span className="text-secondary" style={{ fontSize: 12 }}>
                  {currency(pendingBalance)} pending
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="col-12 col-md-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="modern-card p-4 h-100">
              <div className="d-flex align-items-start justify-content-between mb-2">
                <div>
                  <div className="stat-label mb-1">Payout Method</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <Landmark size={18} style={{ color: 'var(--text-secondary)' }} />
                    <span className="fw-semibold">{method}</span>
                  </div>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                  }}
                >
                  <CreditCard size={24} />
                </div>
              </div>
              <select
                className="modern-select mt-2"
                style={{ fontSize: 14 }}
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                <option>Bank Transfer</option>
                <option>Mobile Money</option>
                <option>Wallet</option>
              </select>
            </div>
          </motion.div>

          <motion.div
            className="col-12 col-md-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="modern-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="stat-label mb-1">Quick Actions</div>
                <div className="fw-semibold mt-1" style={{ fontSize: 15 }}>
                  Request withdrawal of available funds
                </div>
              </div>
              <button
                className="btn-gradient-primary w-100 mt-3"
                disabled={balance <= 0 || requesting}
                onClick={requestPayout}
              >
                {requesting ? (
                  <>
                    <RefreshCw size={16} className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={16} />
                    Request Payout
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        <div className="toolbar">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="position-relative">
              <Search size={16} className="position-absolute" style={{ left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="modern-input"
                style={{ paddingLeft: 40, width: '100%', maxWidth: 260 }}
                placeholder="Search payouts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="modern-select"
              style={{ width: '100%', maxWidth: 160 }}
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Paid</option>
            </select>
          </div>
          <div className="toolbar-actions">
            <span className="text-secondary" style={{ fontSize: 13 }}>
              {filtered.length} payout{filtered.length !== 1 ? 's' : ''}
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
                  <Banknote size={32} />
                </div>
                <h3>No payouts yet</h3>
                <p>
                  {searchQuery || status !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Your payout history will appear here once you request a withdrawal.'}
                </p>
                {!searchQuery && status === 'all' && balance > 0 && (
                  <button className="btn-gradient-primary" onClick={requestPayout}>
                    <ArrowUpRight size={16} />
                    Request Your First Payout
                  </button>
                )}
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
                    <th>Payout ID</th>
                    <th>Amount</th>
                    <th>Listing</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Requested Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getStatusIcon(p.status)}
                          <span className="fw-medium">{p.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="fw-bold">{currency(p.amount)}</td>
                      <td className="text-secondary" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.listingTitle || '-'}
                      </td>
                      <td className="text-secondary">{p.method || 'Bank Transfer'}</td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td className="text-secondary">
                        <small>{new Date(p.requestedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
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
