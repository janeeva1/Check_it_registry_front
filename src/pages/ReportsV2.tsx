import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Search, Eye, Loader2, FileText, Clock, Smartphone } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

type Report = {
  id: string
  type: string
  status: string
  device_brand?: string
  device_model?: string
  location?: string
  description?: string
  created_at: string
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div className="modern-card p-5 text-center"><AlertTriangle size={32} style={{ color: 'var(--danger-500)' }} /><h5 className="mt-3">Something went wrong</h5><p style={{ color: 'var(--text-secondary)' }}>Please try refreshing the page</p></div>
    return this.props.children
  }
}

const STATUS_OPTIONS = ['all', 'open', 'investigating', 'resolved', 'closed', 'dismissed']
const TYPE_OPTIONS = ['all', 'stolen', 'lost', 'found', 'fraud', 'other']

export default function ReportsV2() {
  const { user: _user } = useAuth()
  const { toasts, removeToast, showError: _showError } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setReports(data.data || [])
    } catch { setReports([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [])

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.id.toLowerCase().includes(q) || (r.device_brand || '').toLowerCase().includes(q) || (r.device_model || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => sortBy === 'newest' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { open: 'status-pending', investigating: 'status-unverified', resolved: 'status-verified', closed: 'status-found', dismissed: 'status-stolen' }
    return <span className={`status-badge ${map[s] || ''}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
  }

  const typeColor = (t: string) => {
    const tl = t.toLowerCase()
    if (tl === 'stolen') return { color: 'var(--danger-500)', bg: 'var(--danger-50)', icon: AlertTriangle }
    if (tl === 'lost') return { color: 'var(--warning-500)', bg: 'var(--warning-50)', icon: Clock }
    if (tl === 'found') return { color: 'var(--success-500)', bg: 'var(--success-50)', icon: Smartphone }
    return { color: 'var(--primary-600)', bg: 'var(--primary-50)', icon: FileText }
  }

  const stats = [
    { label: 'Total', value: reports.length, color: 'var(--primary-600)' },
    { label: 'Open', value: reports.filter(r => r.status === 'open').length, color: 'var(--warning-500)' },
    { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, color: 'var(--success-500)' },
    { label: 'Stolen', value: reports.filter(r => r.type === 'stolen').length, color: 'var(--danger-500)' },
  ]

  return (
    <Layout requireAuth>
      <ErrorBoundary>
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <div className="page-header">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--danger-500), var(--danger-700))' }}>
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h1>Incident Reports</h1>
                    <p>Track and manage your device incident reports</p>
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
                  <input type="text" placeholder="Search reports..." className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '8px 0' }} value={search} onChange={e => setSearch(e.target.value)} />
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
              <div className="col-6 col-md-2">
                <select className="modern-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              <div className="col-6 col-md-2 text-end">
                <Link to="/report-incident" className="btn-gradient-danger d-inline-flex align-items-center gap-2 btn-sm">
                  <AlertTriangle size={16} /> New Report
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="modern-card p-5 text-center">
              <div className="empty-state">
                <div className="empty-state-icon"><AlertTriangle size={48} /></div>
                <h3>No Reports Found</h3>
                <p>{search || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting filters' : 'No incident reports yet'}</p>
                {!search && statusFilter === 'all' && typeFilter === 'all' && <Link to="/report-incident" className="btn-gradient-danger mt-3 d-inline-flex align-items-center gap-2"><AlertTriangle size={16} /> Report Incident</Link>}
              </div>
            </div>
          ) : (
            <div className="row g-3">
              <AnimatePresence>
                {filtered.map((r, _i) => {
                  const tc = typeColor(r.type)
                  const Icon = tc.icon
                  return (
                    <motion.div key={r.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
                      <Link to={`/report/${r.id}`} className="text-decoration-none">
                        <div className="modern-card p-3">
                          <div className="row g-3 align-items-center">
                            <div className="col-auto">
                              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 44, height: 44, background: tc.bg }}>
                                <Icon size={22} style={{ color: tc.color }} />
                              </div>
                            </div>
                            <div className="col">
                              <p className="fw-medium mb-1" style={{ color: 'var(--text-primary)' }}>{r.device_brand || r.device_model || `Report #${r.id.slice(0, 8)}`}</p>
                              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
                                {r.type.charAt(0).toUpperCase() + r.type.slice(1)} &middot; {r.location || 'Location N/A'} &middot; {new Date(r.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="col-auto d-flex align-items-center gap-2">
                              {statusBadge(r.status)}
                              <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ErrorBoundary>
    </Layout>
  )
}
