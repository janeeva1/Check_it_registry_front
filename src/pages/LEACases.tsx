import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { Link } from 'react-router-dom'
import {
  FileText, Search, Calendar, MapPin, ChevronLeft, ChevronRight,
  Filter, CaseSensitive, AlertTriangle
} from 'lucide-react'

type CaseItem = {
  id: number
  case_id: string
  report_type: string
  status: string
  description?: string
  created_at: string
  location?: string
  device_brand?: string
  device_model?: string
}

const statusStyles: Record<string, string> = {
  open: 'status-active',
  under_review: 'status-pending',
  resolved: 'status-verified',
  dismissed: 'status-inactive',
  stolen: 'status-stolen',
  recovered: 'status-recovered'
}

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] || 'status-pending'
  return <span className={`status-badge ${cls}`}>{status.replace(/_/g, ' ')}</span>
}

export default function LEACases() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', '20')
        if (status !== 'all') params.set('status', status)
        if (type !== 'all') params.set('type', type)
        if (q.trim()) params.set('search', q.trim())
        const res = await fetch(`/api/lea-portal/cases?${params.toString()}`)
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json.cases || [])
        if (mounted) {
          setCases(list)
          setPages((json.pagination?.pages) || 1)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [q, status, type, page])

  const filtered = useMemo(() => cases, [cases])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  return (
    <Layout requireAuth allowedRoles={['lea', 'admin']}>
      <motion.div className="container-fluid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={childVariants} className="page-header">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} color="white" />
            </div>
            <div>
              <h1>Case Management</h1>
              <p>Assigned and active investigations in your jurisdiction</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={childVariants} className="alert-banner alert-banner-danger">
            <AlertTriangle size={20} />
            <div>
              <strong>Error</strong>
              <div className="small">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="btn-ghost ms-auto">Dismiss</button>
          </motion.div>
        )}

        <motion.div variants={childVariants} className="toolbar">
          <div className="d-flex gap-2 flex-wrap">
            <div className="input-group" style={{ maxWidth: 360 }}>
              <span className="input-group-text"><Search size={16} /></span>
              <input
                className="form-control"
                placeholder="Search by case ID, device, location..."
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1) }}
              />
            </div>
            <select className="modern-select" style={{ width: 'auto' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select className="modern-select" style={{ width: 'auto' }} value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
              <option value="all">All Types</option>
              <option value="stolen">Stolen</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          <div className="toolbar-actions">
            <button className="btn-ghost" onClick={() => { setQ(''); setStatus('all'); setType('all'); setPage(1) }}>
              <Filter size={16} /> Clear
            </button>
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="modern-card p-0">
          {loading ? (
            <div className="p-5 text-center">
              <div className="spinner-border text-primary mb-3" role="status" />
              <div className="text-muted small">Loading cases...</div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Type</th>
                      <th>Device</th>
                      <th>Location</th>
                      <th>Reported</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <motion.tr key={c.id} variants={childVariants} initial="hidden" animate="visible" layout>
                        <td className="fw-semibold">
                          <Link to={`/lea/cases/${c.case_id}`} className="text-decoration-none">{c.case_id}</Link>
                        </td>
                        <td><span className="text-capitalize small fw-semibold">{c.report_type}</span></td>
                        <td>{c.device_brand || ''} {c.device_model || ''}</td>
                        <td>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <MapPin size={12} /> {c.location || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <Calendar size={12} /> {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="text-end">
                          <Link to={`/lea/cases/${c.case_id}`} className="btn-gradient-primary btn-sm">
                            <CaseSensitive size={14} /> Open
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">
                            <div className="empty-state-icon"><FileText size={32} /></div>
                            <h3>No cases found</h3>
                            <p>No cases match your current search criteria. Try adjusting the filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-secondary small">Page {page} of {pages}</div>
                <div className="d-flex gap-2">
                  <button
                    className="btn-ghost"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                  >
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
