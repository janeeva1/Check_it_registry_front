import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { RefreshCw, Search, ArrowLeftRight, Clock } from 'lucide-react'

interface TransferRow {
  id: string; device_id: string; brand: string; model: string
  imei?: string; serial?: string; category?: string
  from_user_name: string; from_user_email: string
  to_user_name: string; to_user_email: string
  status: string; created_at: string
  accepted_at?: string; rejected_at?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminTransferHistory() {
  const [rows, setRows] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { showError: _showError } = { showError: (_t: string, _m?: string) => {} }

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      params.append('limit', '50')
      const statusMap: Record<string, string> = { pending: 'active', accepted: 'completed', rejected: 'rejected', expired: 'expired', cancelled: 'cancelled' }
      if (status !== 'all') params.append('status', statusMap[status] || status)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      const API_URL = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API_URL}/device-transfer/history?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const json = await res.json()
      const transfers = (json?.transfers || []) as any[]
      setRows(transfers.map(t => ({
        id: String(t.id), device_id: String(t.device_id), brand: t.brand, model: t.model,
        imei: t.imei, serial: t.serial, category: t.category,
        from_user_name: t.from_user_name, from_user_email: t.from_user_email,
        to_user_name: t.to_user_name, to_user_email: t.to_user_email,
        status: t.status, created_at: t.created_at, accepted_at: t.accepted_at, rejected_at: t.rejected_at
      })))
    } catch (e) {
      console.error('Failed to load transfers', e)
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData() }, [status, selectedCategory])

  const categories = useMemo(() => {
    const set = new Set<string>()
    rows.forEach(r => { if (r.category) set.add(r.category) })
    return Array.from(set)
  }, [rows])

  const filtered = rows.filter(r => {
    const s = search.toLowerCase()
    return !s || r.brand?.toLowerCase().includes(s) || r.model?.toLowerCase().includes(s) ||
      r.imei?.toLowerCase().includes(s) || r.serial?.toLowerCase().includes(s) ||
      r.from_user_email?.toLowerCase().includes(s) || r.to_user_email?.toLowerCase().includes(s)
  }).filter(r => selectedCategory === 'all' ? true : r.category === selectedCategory)

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'completed': return 'status-verified'
      case 'active': return 'status-unverified'
      case 'rejected': return 'status-stolen'
      case 'expired': return 'status-inactive'
      case 'cancelled': return 'status-inactive'
      default: return 'status-pending'
    }
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>Ownership Transfers</h1>
                <p>All device ownership transfer records</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <select className="modern-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
                  <option value="all">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="modern-select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={loadData} className="btn-ghost"><RefreshCw size={18} /> Refresh</button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="position-relative">
              <Search size={18} className="position-absolute top-50 translate-middle-y ms-3" style={{ color: 'var(--text-tertiary)' }} />
              <input className="modern-input" style={{ paddingLeft: 44 }} placeholder="Search by device, IMEI, or user email..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} />
            </div>
          ) : (
            <motion.div variants={itemVariants} className="modern-card">
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}></th>
                      <th>Device</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td><ArrowLeftRight size={16} style={{ color: 'var(--primary-500)' }} /></td>
                        <td>
                          <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{r.brand} {r.model}</div>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span className="status-badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: 11, padding: '2px 8px' }}>
                              {r.category || '\u2014'}
                            </span>
                          </div>
                          <small style={{ color: 'var(--text-tertiary)' }}>IMEI: {r.imei || 'N/A'} &middot; Serial: {r.serial || 'N/A'}</small>
                        </td>
                        <td>
                          <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{r.from_user_name}</div>
                          <small style={{ color: 'var(--text-tertiary)' }}>{r.from_user_email}</small>
                        </td>
                        <td>
                          <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{r.to_user_name}</div>
                          <small style={{ color: 'var(--text-tertiary)' }}>{r.to_user_email}</small>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusStyle(r.status)}`}>
                            <span className="badge-dot" style={{
                              backgroundColor: r.status === 'completed' ? 'var(--success-500)' : r.status === 'active' ? 'var(--warning-500)' : r.status === 'rejected' ? 'var(--danger-500)' : 'var(--gray-500)'
                            }} />
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                            <small style={{ color: 'var(--text-tertiary)' }}>{new Date(r.created_at).toLocaleString()}</small>
                          </div>
                          {r.accepted_at && <small style={{ color: 'var(--success-500)' }}>Accepted: {new Date(r.accepted_at).toLocaleString()}</small>}
                          {r.rejected_at && <small style={{ color: 'var(--danger-500)' }}>Rejected: {new Date(r.rejected_at).toLocaleString()}</small>}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">
                            <div className="empty-state-icon"><ArrowLeftRight size={32} /></div>
                            <h3>No transfers found</h3>
                            <p>No device ownership transfers match your criteria.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
