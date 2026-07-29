import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Search, Eye, Download, ArrowUpRight, ArrowDownLeft, Loader2, Filter } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

type Transaction = {
  id: string
  type: 'payment' | 'refund' | 'fee'
  amount: number
  status: 'completed' | 'pending' | 'failed'
  method: string
  description: string
  reference: string
  created_at: string
}

const STATUS_OPTIONS = ['all', 'completed', 'pending', 'failed']
const TYPE_OPTIONS = ['all', 'payment', 'refund', 'fee']

export default function TransactionHistory() {
  const { user: _user } = useAuth()
  const { toasts, removeToast, showError: _showError } = useToast()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/transactions`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setTxs(data.data || [])
      } catch { setTxs([]) }
      finally { setLoading(false) }
    }
    fetchTxs()
  }, [])

  const filtered = txs.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q)
    }
    return true
  })

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { completed: 'status-verified', pending: 'status-pending', failed: 'status-stolen' }
    return <span className={`status-badge ${map[s] || ''}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
  }

  const stats = [
    { label: 'Total Transactions', value: txs.length, color: 'var(--primary-600)' },
    { label: 'Completed', value: txs.filter(t => t.status === 'completed').length, color: 'var(--success-500)' },
    { label: 'Pending', value: txs.filter(t => t.status === 'pending').length, color: 'var(--warning-500)' },
    { label: 'Total Spent', value: `$${txs.filter(t => t.type === 'payment' && t.status === 'completed').reduce((s, t) => s + t.amount, 0).toFixed(0)}`, color: 'var(--danger-500)' },
  ]

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <CreditCard size={24} className="text-white" />
                </div>
                <div>
                  <h1>Transaction History</h1>
                  <p>View your payment activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {stats.map(s => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className="stat-card"><p className="stat-label">{s.label}</p><p className="stat-value" style={{ color: s.color }}>{s.value}</p></div>
            </div>
          ))}
        </div>

        <div className="modern-card p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                <input type="text" placeholder="Search transactions..." className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '8px 0' }} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select className="modern-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="modern-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-md-4 text-end">
              <button className="btn-ghost d-inline-flex align-items-center gap-2"><Download size={16} /> Export</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="modern-card p-5 text-center">
            <div className="empty-state"><div className="empty-state-icon"><CreditCard size={48} /></div><h3>No Transactions</h3><p>{search || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting filters' : 'No transactions yet'}</p></div>
          </div>
        ) : (
          <div className="row g-3">
            <AnimatePresence>
              {filtered.map((t, i) => (
                <motion.div key={t.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="modern-card p-3">
                    <div className="row g-3 align-items-center">
                      <div className="col-auto">
                        <div className={`d-flex align-items-center justify-content-center rounded-3`} style={{ width: 44, height: 44, background: t.type === 'refund' ? 'var(--success-50)' : t.type === 'fee' ? 'var(--warning-50)' : 'var(--primary-50)' }}>
                          {t.type === 'refund' ? <ArrowDownLeft size={20} style={{ color: 'var(--success-500)' }} /> : t.type === 'fee' ? <Filter size={20} style={{ color: 'var(--warning-500)' }} /> : <ArrowUpRight size={20} style={{ color: 'var(--primary-600)' }} />}
                        </div>
                      </div>
                      <div className="col">
                        <p className="fw-medium mb-1">{t.description}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
                          {t.reference} &middot; {t.method} &middot; {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-auto text-end">
                        <p className="fw-bold mb-1" style={{ color: t.amount < 0 ? 'var(--success-500)' : 'var(--text-primary)' }}>
                          {t.amount < 0 ? '+' : ''}{t.amount < 0 ? Math.abs(t.amount).toFixed(2) : t.amount.toFixed(2)} USD
                        </p>
                        {statusBadge(t.status)}
                      </div>
                      <div className="col-auto">
                        <Link to={`/payment/confirmation?tx=${t.id}`} className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                          <Eye size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
