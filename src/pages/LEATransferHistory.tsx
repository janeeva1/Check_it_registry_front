import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import {
  ArrowLeftRight, Search, RefreshCw, Shield,
  Calendar, User, ChevronLeft, ChevronRight,
  Smartphone, CheckCircle, XCircle, AlertTriangle, Ban,
  Clock
} from 'lucide-react'

interface TransferRow {
  id: string
  brand: string
  model: string
  imei?: string
  serial?: string
  from_user_name: string
  to_user_name: string
  status: string
  created_at: string
}

const statusConfig: Record<string, { class: string; icon: any; label: string }> = {
  pending: { class: 'status-pending', icon: Clock, label: 'Pending' },
  accepted: { class: 'status-verified', icon: CheckCircle, label: 'Accepted' },
  rejected: { class: 'status-stolen', icon: XCircle, label: 'Rejected' },
  expired: { class: 'status-inactive', icon: Ban, label: 'Expired' },
  cancelled: { class: 'status-inactive', icon: Ban, label: 'Cancelled' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { class: 'status-pending', icon: Clock, label: status }
  const Icon = cfg.icon
  return (
    <span className={`status-badge ${cfg.class}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

export default function LEATransferHistory() {
  const [rows, setRows] = useState<TransferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadData = async () => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      params.append('limit', '25')
      params.append('page', String(page))
      if (status !== 'all') params.append('status', status)

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/device-transfer/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const json = await res.json()
      const transfers = (json?.transfers || []) as any[]
      const mapped = transfers.map(t => ({
        id: String(t.id),
        brand: t.brand || '',
        model: t.model || '',
        imei: t.imei,
        serial: t.serial,
        from_user_name: t.from_user_name || 'Unknown',
        to_user_name: t.to_user_name || 'Unknown',
        status: t.status || 'pending',
        created_at: t.created_at
      }))
      setRows(mapped)
      setTotalPages(json.pagination?.pages || 1)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData() }, [status, page])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return rows.filter(r =>
      !s ||
      r.brand?.toLowerCase().includes(s) ||
      r.model?.toLowerCase().includes(s) ||
      r.imei?.toLowerCase().includes(s) ||
      r.serial?.toLowerCase().includes(s) ||
      r.from_user_name?.toLowerCase().includes(s) ||
      r.to_user_name?.toLowerCase().includes(s)
    )
  }, [rows, search])

  const totals = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    accepted: rows.filter(r => r.status === 'accepted').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  }), [rows])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  return (
    <Layout requireAuth allowedRoles={['lea']}>
      <motion.div className="container-fluid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={childVariants} className="page-header">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={24} color="white" />
            </div>
            <div>
              <h1>Transfer History</h1>
              <p>Regional ownership transfers monitored by your jurisdiction</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={childVariants} className="alert-banner alert-banner-danger mb-4">
            <AlertTriangle size={20} />
            <div>
              <strong>Error loading transfers</strong>
              <div className="small">{error}</div>
            </div>
          </motion.div>
        )}

        <motion.div variants={childVariants} className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                  <ArrowLeftRight size={24} />
                </div>
                <div>
                  <div className="stat-value">{totals.total}</div>
                  <div className="stat-label">Total Transfers</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div className="stat-value">{totals.pending}</div>
                  <div className="stat-label">Pending</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div className="stat-value">{totals.accepted}</div>
                  <div className="stat-label">Accepted</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <XCircle size={24} />
                </div>
                <div>
                  <div className="stat-value">{totals.rejected}</div>
                  <div className="stat-label">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="toolbar">
          <div className="d-flex gap-2 flex-wrap">
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text"><Search size={16} /></span>
              <input className="form-control" placeholder="Search device or user..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="modern-select" style={{ width: 'auto' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="toolbar-actions">
            <button onClick={loadData} className="btn-ghost"><RefreshCw size={16} /> Refresh</button>
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="modern-card p-0">
          {loading ? (
            <div className="p-5 text-center">
              <div className="spinner-border text-primary mb-3" role="status" />
              <div className="text-muted small">Loading transfers...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ArrowLeftRight size={32} /></div>
              <h3>No transfers found</h3>
              <p>No ownership transfers match your current search or filters. Transfers in your region will appear here.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: 28 }}><Shield size={14} /></th>
                      <th>Device</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <motion.tr key={r.id} variants={childVariants} initial="hidden" animate="visible" layout>
                        <td><ArrowLeftRight size={16} style={{ color: 'var(--primary-600)' }} /></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Smartphone size={14} className="text-muted" />
                            <div>
                              <div className="fw-semibold small">{r.brand} {r.model}</div>
                              <small className="text-muted">IMEI: {r.imei || 'N/A'} &bull; Serial: {r.serial || 'N/A'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <User size={12} className="text-muted" />
                            <span className="small">{r.from_user_name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <User size={12} className="text-muted" />
                            <span className="small">{r.to_user_name}</span>
                          </div>
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-muted small">
                            <Clock size={10} /> {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="text-end">
                          <a href={`/lea/transfers/${r.id}`} className="btn-ghost">
                            Details <ChevronRight size={14} />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-secondary small">Page {page} of {totalPages}</div>
                <div className="d-flex gap-2">
                  <button className="btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button className="btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  )
}
