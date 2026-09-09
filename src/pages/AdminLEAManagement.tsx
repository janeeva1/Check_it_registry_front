import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'
import { getDisplayName } from '../utils/userHelpers'
import { Shield, Search, Filter, MapPin, Users, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

type Agency = {
  id: string; name: string; email: string; region: string
  assigned_cases: number; resolved_cases: number; status: string; created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminLEAManagement() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 0 })
  const { showSuccess, showError, toasts, removeToast } = useToast()

  const loadAgencies = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page, limit: 20 }
      if (query) params.search = query
      const data = await apiClient.devices.leaAgencies(params as any)
      const list = data?.agencies || data || []
      setAgencies(Array.isArray(list) ? list : [])
      if (data?.pagination) setPagination(data.pagination)
    } catch (err: any) {
      console.error('Failed to load LEA agencies:', err)
      const msg = err?.message || String(err) || 'Failed to load agencies'
      showError('Failed to load agencies', msg)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAgencies() }, [page, query])

  const filtered = agencies.filter(a => (
    !query ||
    a.name?.toLowerCase().includes(query.toLowerCase()) ||
    a.email?.toLowerCase().includes(query.toLowerCase()) ||
    a.region?.toLowerCase().includes(query.toLowerCase())
  ))

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>LEA Management</h1>
                <p>Manage law enforcement agency access and settings</p>
              </div>
              <button onClick={loadAgencies} className="btn-ghost"><RefreshCw size={16} /> Refresh</button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-8">
                <label className="form-label d-flex align-items-center gap-2"><Search size={16} /> Search Agencies</label>
                <input className="modern-input" placeholder="Search by name, email, or region..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
              </div>
              <div className="col-md-4">
                <button onClick={() => { setQuery(''); setPage(1) }} className="btn-ghost w-100 text-center">Clear Filters</button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ borderBottomColor: 'var(--border-color)' }}>
              <h3 className="h5 mb-0" style={{ color: 'var(--text-primary)' }}>Agencies ({pagination.total || agencies.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th>Email</th>
                    <th>Region</th>
                    <th>Cases</th>
                    <th>Resolved</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-5">
                      <div className="spinner-border" style={{ color: 'var(--primary-600)' }} />
                    </td></tr>
                  ) : filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar" style={{ background: 'linear-gradient(135deg, #818cf8, #4f46e5)' }}>
                            <Shield size={16} />
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{getDisplayName(a) || a.name || a.email}</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>{a.id?.substring(0, 8)}...</small>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--text-secondary)' }}>{a.email}</span></td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{a.region || 'Unset'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{a.assigned_cases || 0}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <CheckCircle size={14} style={{ color: 'var(--success-500)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{a.resolved_cases || 0}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${a.status === 'active' ? 'status-verified' : a.status === 'suspended' ? 'status-stolen' : 'status-pending'}`}>
                          {a.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state py-4">
                          <div className="empty-state-icon" style={{ width: 60, height: 60 }}><Shield size={24} /></div>
                          <h3 style={{ fontSize: 16 }}>No LEA agencies found</h3>
                          <p>LEA users will appear here once registered.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="p-3 d-flex justify-content-center gap-2 flex-wrap">
                <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span className="d-flex align-items-center px-3" style={{ color: 'var(--text-secondary)' }}>Page {page} of {pagination.pages}</span>
                <button className="btn-ghost" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  )
}
