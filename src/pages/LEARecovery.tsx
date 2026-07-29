import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import {
  Shield, RefreshCw, Search, MapPin, Calendar, Clock,
  CheckCircle, AlertTriangle, User, Smartphone,
  ChevronLeft, ChevronRight, Mail, Eye
} from 'lucide-react'

interface RecoveryRecord {
  id: string
  case_id?: string
  device_brand?: string
  device_model?: string
  imei?: string
  serial?: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  location?: string
  recovered_by?: string
  recovered_at?: string
  status: string
  notes?: string
  created_at: string
}

const statusConfig: Record<string, { class: string; label: string }> = {
  pending_recovery: { class: 'status-pending', label: 'Pending Recovery' },
  in_progress: { class: 'status-pending', label: 'In Progress' },
  recovered: { class: 'status-recovered', label: 'Recovered' },
  confirmed: { class: 'status-verified', label: 'Confirmed' },
  closed: { class: 'status-inactive', label: 'Closed' },
  failed: { class: 'status-stolen', label: 'Failed' }
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { class: 'status-pending', label: status }
  return <span className={`status-badge ${cfg.class}`}>{cfg.label}</span>
}

export default function LEARecovery() {
  const [records, setRecords] = useState<RecoveryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData() }, [statusFilter, page])

  const loadData = async () => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '20')
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/lea-portal/recovery?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const json = await res.json()
      setRecords(json.records || json.recoveries || [])
      setTotalPages(json.pagination?.pages || 1)
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery records')
    } finally { setLoading(false) }
  }

  const filtered = records.filter(r => {
    const s = search.toLowerCase()
    return !s ||
      r.device_brand?.toLowerCase().includes(s) ||
      r.device_model?.toLowerCase().includes(s) ||
      r.imei?.toLowerCase().includes(s) ||
      r.serial?.toLowerCase().includes(s) ||
      r.owner_name?.toLowerCase().includes(s) ||
      r.location?.toLowerCase().includes(s) ||
      r.case_id?.toLowerCase().includes(s)
  })

  const stats = {
    total: records.length,
    recovered: records.filter(r => r.status === 'recovered' || r.status === 'confirmed').length,
    pending: records.filter(r => r.status === 'pending_recovery' || r.status === 'in_progress').length,
    failed: records.filter(r => r.status === 'failed').length
  }

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
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <h1>Recovery Operations</h1>
              <p>Track and coordinate device recovery efforts across your jurisdiction</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={childVariants} className="alert-banner alert-banner-danger mb-4">
            <AlertTriangle size={20} />
            <div>
              <strong>Error</strong>
              <div className="small">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="btn-ghost ms-auto">Dismiss</button>
          </motion.div>
        )}

        <motion.div variants={childVariants} className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                  <Shield size={24} />
                </div>
                <div>
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Records</div>
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
                  <div className="stat-value">{stats.recovered}</div>
                  <div className="stat-label">Recovered</div>
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
                  <div className="stat-value">{stats.pending}</div>
                  <div className="stat-label">Pending / In Progress</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="stat-value">{stats.failed}</div>
                  <div className="stat-label">Failed</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="toolbar">
          <div className="d-flex gap-2 flex-wrap">
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text"><Search size={16} /></span>
              <input className="form-control" placeholder="Search device, owner, case..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="modern-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="all">All Statuses</option>
              <option value="pending_recovery">Pending Recovery</option>
              <option value="in_progress">In Progress</option>
              <option value="recovered">Recovered</option>
              <option value="confirmed">Confirmed</option>
              <option value="closed">Closed</option>
              <option value="failed">Failed</option>
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
              <div className="text-muted small">Loading recovery records...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Shield size={32} /></div>
              <h3>No recovery records</h3>
              <p>No recovery operations match your current filters. Recovery records will appear here once cases are assigned.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Identifier</th>
                      <th>Owner</th>
                      <th>Location</th>
                      <th>Recovered By</th>
                      <th>Recovered At</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <motion.tr key={r.id} variants={childVariants} initial="hidden" animate="visible" layout>
                        <td className="fw-semibold">
                          <Smartphone size={14} className="me-1 text-muted" />
                          {r.device_brand} {r.device_model}
                        </td>
                        <td><code className="small">{r.imei || r.serial || '-'}</code></td>
                        <td>
                          <div className="small fw-medium">
                            <User size={12} className="me-1 text-muted" />{r.owner_name || '—'}
                          </div>
                          {r.owner_email && <div className="text-muted small"><Mail size={10} className="me-1" />{r.owner_email}</div>}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <MapPin size={12} /> {r.location || '—'}
                          </div>
                        </td>
                        <td>{r.recovered_by || '—'}</td>
                        <td>
                          {r.recovered_at ? (
                            <div className="d-flex align-items-center gap-1 text-secondary small">
                              <Calendar size={12} /> {new Date(r.recovered_at).toLocaleDateString()}
                            </div>
                          ) : '—'}
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-end">
                          <a href={`/lea/recovery/${r.id}`} className="btn-ghost">
                            <Eye size={16} /> View
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
