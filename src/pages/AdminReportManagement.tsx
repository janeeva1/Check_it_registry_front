import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search, Filter, FileText, X } from 'lucide-react'
import { getDisplayName } from '../utils/userHelpers'

type AdminReportItem = {
  id: number; case_id: string; report_type: string; status: string
  brand?: string; model?: string; reporter_name?: string
  device_id?: number; created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminReportManagement() {
  const [reports, setReports] = useState<AdminReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'all' | 'open' | 'under_review' | 'resolved' | 'dismissed'>('all')
  const [type, setType] = useState<'all' | 'stolen' | 'lost' | 'found'>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [showAssign, setShowAssign] = useState<{ reportId: number } | null>(null)
  const [leaQuery, setLeaQuery] = useState('')
  const [leaResults, setLeaResults] = useState<Array<{ id: number; name: string; email: string; badge_number?: string }>>([])
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true); setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page)); params.set('limit', '20')
        if (status !== 'all') params.set('status', status)
        if (type !== 'all') params.set('type', type)
        if (q.trim()) params.set('search', q.trim())
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`/api/admin-dashboard/reports?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`)
        const json = await res.json()
        if (mounted) {
          setReports(json.reports || [])
          setPages(json.pagination?.pages || 1)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [status, type, q, page])

  const filtered = useMemo(() => reports, [reports])

  async function updateReportStatus(id: number, newStatus: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin-dashboard/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    } catch {
      setError('Failed to update status')
    }
  }

  async function searchLeaDirectory(query: string) {
    try {
      const res = await fetch(`/api/admin-dashboard/lea-directory?search=${encodeURIComponent(query)}`)
      const json = await res.json()
      setLeaResults(json.users || [])
    } catch {
      setLeaResults([])
    }
  }

  async function assignLeaById(reportId: number, leaId: number) {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/admin-dashboard/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ assigned_lea_id: leaId })
      })
      if (!res.ok) throw new Error('Failed to assign LEA')
      setShowAssign(null)
    } catch { setError('Failed to assign LEA') }
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading reports...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>Report Management</h1>
                <p>Review and process device incident reports</p>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="alert-banner alert-banner-danger mb-4">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label d-flex align-items-center gap-2"><Search size={16} /> Search</label>
                <input className="modern-input" placeholder="Search by ID, device, reporter" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label d-flex align-items-center gap-2"><Filter size={16} /> Status</label>
                <select className="modern-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select className="modern-select" value={type} onChange={(e) => setType(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="stolen">Stolen</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>
              <div className="col-md-2">
                <button onClick={() => { setQ(''); setStatus('all'); setType('all'); setPage(1) }} className="btn-ghost w-100 text-center">
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
              <h3 className="h5 mb-0" style={{ color: 'var(--text-primary)' }}>Reports ({filtered.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Type</th>
                    <th>Device</th>
                    <th>Reporter</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td><span className="fw-medium" style={{ color: 'var(--text-primary)' }}>{r.case_id}</span></td>
                      <td>
                        <span className={`status-badge ${r.report_type === 'stolen' ? 'status-stolen' : r.report_type === 'lost' ? 'status-unverified' : 'status-found'}`}>
                          {r.report_type.charAt(0).toUpperCase() + r.report_type.slice(1)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>{r.brand || ''} {r.model || ''}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{r.reporter_name || '\u2014'}</td>
                      <td><small style={{ color: 'var(--text-tertiary)' }}>{new Date(r.created_at).toLocaleDateString()}</small></td>
                      <td>
                        <span className={`status-badge ${r.status === 'resolved' ? 'status-verified' : r.status === 'under_review' ? 'status-unverified' : 'status-pending'}`}>
                          <span className="badge-dot" style={{
                            backgroundColor: r.status === 'resolved' ? 'var(--success-500)' : r.status === 'under_review' ? 'var(--warning-500)' : 'var(--danger-500)'
                          }} />
                          {r.status.replace('_', ' ').charAt(0).toUpperCase() + r.status.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn-ghost" onClick={() => navigate(`/admin/report-management/${r.case_id}`)}>Open</button>
                          {r.device_id && (
                            <button className="btn-ghost" onClick={() => navigate(`/admin/devices/${r.device_id}`)}>Device</button>
                          )}
                          <button className="btn-ghost" onClick={() => { setShowAssign({ reportId: r.id }); setLeaQuery(''); setLeaResults([]) }}>Assign</button>
                          <button className="btn-ghost" style={{ color: 'var(--success-500)' }} onClick={() => updateReportStatus(r.id, 'resolved')}>Resolve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state py-4">
                          <div className="empty-state-icon" style={{ width: 60, height: 60 }}><FileText size={24} /></div>
                          <h3 style={{ fontSize: 16 }}>No reports match your filters</h3>
                          <p>Try adjusting your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between align-items-center p-4 border-top" style={{ borderTopColor: 'var(--border-color)' }}>
              <small style={{ color: 'var(--text-tertiary)' }}>Page {page} of {pages}</small>
              <div className="d-flex gap-2">
                <button className="btn-ghost" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page <= 1}>Prev</button>
                <button className="btn-ghost" onClick={() => setPage(prev => Math.min(pages, prev + 1))} disabled={page >= pages}>Next</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAssign && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ maxWidth: 480, width: '90%' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h3>Assign LEA Officer</h3>
                <button onClick={() => setShowAssign(null)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <input className="modern-input mb-3" placeholder="Search by name, email, badge number"
                  value={leaQuery} onChange={(e) => { setLeaQuery(e.target.value); searchLeaDirectory(e.target.value) }} />
                <div className="d-flex flex-column gap-2">
                  {leaResults.map(u => (
                    <button key={u.id} onClick={() => assignLeaById(showAssign.reportId, u.id)}
                      className="btn-ghost w-100 justify-content-between text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                      <div>
                        <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{getDisplayName(u)}</div>
                        <small style={{ color: 'var(--text-tertiary)' }}>{u.email}</small>
                      </div>
                      {u.badge_number && (
                        <span className="status-badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 11 }}>
                          {u.badge_number}
                        </span>
                      )}
                    </button>
                  ))}
                  {leaResults.length === 0 && leaQuery && (
                    <small style={{ color: 'var(--text-tertiary)' }}>No LEA officers found.</small>
                  )}
                  {!leaQuery && (
                    <small style={{ color: 'var(--text-tertiary)' }}>Type to search the LEA directory...</small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAssign(null)} className="btn-ghost">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
