import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Search, Filter, User, CheckCircle, XCircle, Clock, Tag, RefreshCw, Plus, X, Save } from 'lucide-react'
import { useToast } from '../components/Toast'

interface AdminDevice {
  id: string; brand: string; model: string; imei?: string; serial?: string
  owner_name: string; owner_email?: string; owner_phone?: string
  status: 'unverified' | 'verified'; created_at?: string; updated_at?: string
  verified_at?: string; category?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminDeviceManagement() {
  const { categoryKey } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | AdminDevice['status']>('all')
  const [category, setCategory] = useState('')
  const [modelQuery, setModelQuery] = useState('')
  const [categories, setCategories] = useState<{ key: string; label: string }[]>([])
  const [devices, setDevices] = useState<AdminDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null)
  const { showError, showSuccess } = useToast()

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

  const [reportingDeviceId, setReportingDeviceId] = useState<string | null>(null)
  const [reportType, setReportType] = useState<'stolen' | 'lost' | 'found'>('stolen')
  const [reportDescription, setReportDescription] = useState('')

  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ brand: string; model: string; color?: string; category?: string; imei?: string; serial?: string; device_image_url?: string; proof_url?: string; status?: AdminDevice['status'] | 'found' }>({ brand: '', model: '' })

  const startEdit = (d: AdminDevice) => {
    setEditingDeviceId(d.id)
    setEditForm({
      brand: d.brand || '', model: d.model || '', color: undefined,
      category: d.category || '', imei: d.imei || '', serial: d.serial || '',
      device_image_url: undefined, proof_url: undefined, status: d.status
    })
  }

  const submitEdit = async () => {
    if (!editingDeviceId) return
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      const res = await fetch(`${API_URL}/admin-portal/devices/${editingDeviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to update device')
      setDevices(prev => prev.map(d => d.id === editingDeviceId ? { ...d, ...data } : d))
      setEditingDeviceId(null)
      showSuccess('Device Updated', 'Device details saved')
    } catch (err) {
      showError('Update Error', err instanceof Error ? err.message : 'Failed to update device')
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDevices() }, [page, limit, status, category, query, modelQuery])

  useEffect(() => { if (categoryKey) setCategory(categoryKey) }, [categoryKey])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return
        const res = await fetch(`${API_URL}/device-management/categories`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      } catch { /* fetch may fail silently */ }
    }
    fetchCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      const params = new URLSearchParams()
      params.append('page', String(page)); params.append('limit', String(limit))
      if (status !== 'all') params.append('status', status)
      if (category) params.append('category', category)
      if (query) params.append('search', query)
      if (modelQuery) params.append('model', modelQuery)
      const res = await fetch(`${API_URL}/admin-portal/devices?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch devices')
      const json = await res.json()
      const list: AdminDevice[] = json?.devices || json?.data?.devices || []
      setDevices(list)
      const pg = json?.pagination || json?.data?.pagination
      if (pg) {
        setPagination({
          page: parseInt(String(pg.page || page)), limit: parseInt(String(pg.limit || limit)),
          total: parseInt(String(pg.total || list.length)), pages: parseInt(String(pg.pages || Math.max(1, Math.ceil((pg.total || list.length) / (pg.limit || limit)))))
        })
      } else { setPagination(null) }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error loading devices'
      setError(msg); showError('Loading Error', msg)
    } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return devices.filter(d => {
      const matchesQuery = `${d.brand} ${d.model} ${d.imei || ''} ${d.serial || ''} ${d.owner_name}`.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'all' || d.status === status
      const matchesCategory = !category || d.category === category
      return matchesQuery && matchesStatus && matchesCategory
    })
  }, [devices, query, status, category])

  const handleCreateReport = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      const res = await fetch(`${API_URL}/report-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ device_id: deviceId, report_type: reportType, description: reportDescription || `${reportType} device reported by admin`, occurred_at: new Date().toISOString() })
      })
      if (!res.ok) throw new Error('Failed to create report')
      setReportingDeviceId(null); setReportDescription('')
      showSuccess('Report Created', 'The device report has been created')
      await loadDevices()
    } catch (err) {
      showError('Report Error', err instanceof Error ? err.message : 'Failed to create report')
    }
  }

  const handleVerify = async (deviceId: string, approved: boolean) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin-portal/verify-device/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approved })
      })
      if (!res.ok) throw new Error('Failed to update device verification')
      const updated = await res.json()
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: updated.status || (approved ? 'verified' : 'unverified'), verified_at: updated.verified_at, updated_at: updated.updated_at } as AdminDevice : d))
      showSuccess(approved ? 'Device Verified' : 'Verification Rejected', approved ? 'The device is now verified.' : 'Verification rejected')
    } catch (err) {
      showError('Action Error', err instanceof Error ? err.message : 'Action failed')
    }
  }

  const handleResendVerificationEmail = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')
      const res = await fetch(`${API_URL}/admin-portal/resend-device-verification/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to resend verification email')
      showSuccess('Email Sent', 'Verification email resent to the owner')
    } catch (err) {
      showError('Email Error', err instanceof Error ? err.message : 'Failed to resend verification email')
    }
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading devices...</p>
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
                <h1>Device Management</h1>
                <p>Browse, filter, edit, and manage all registered devices</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-3 mb-4">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Link to="/admin/device-management" className={`btn-ghost ${!category ? 'btn-gradient-primary' : ''}`}>All</Link>
              {categories.map(c => (
                <Link key={c.key} to={`/admin/device-management/category/${c.key}`}
                  className={`btn-ghost ${category === c.key ? 'btn-gradient-primary' : ''}`}>
                  {c.label}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label d-flex align-items-center gap-2"><Search size={16} /> Search Devices</label>
                <input className="modern-input" placeholder="Search by brand, model, IMEI, or owner" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label d-flex align-items-center gap-2"><Filter size={16} /> Model</label>
                <input className="modern-input" placeholder="Filter by model" value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Status</label>
                <select className="modern-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Category</label>
                <select className="modern-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All</option>
                  {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <button onClick={() => { setQuery(''); setModelQuery(''); setStatus('all'); setCategory(''); setPage(1); loadDevices(); navigate('/admin/device-management') }}
                  className="btn-ghost w-100 text-center">
                  <RefreshCw size={16} /> Reset
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
              <h3 className="h5 mb-0" style={{ color: 'var(--text-primary)' }}>{loading ? 'Loading devices...' : `Devices (${filtered.length})`}</h3>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Last Update</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="stat-icon" style={{ width: 40, height: 40, background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{d.brand} {d.model}</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>
                              <Tag size={12} className="me-1" /> IMEI: {d.imei || '\u2014'} | Serial: {d.serial || '\u2014'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{d.owner_name}</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>{d.owner_email || ''}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${d.status === 'verified' ? 'status-verified' : 'status-unverified'}`}>
                          <span className="badge-dot" style={{ backgroundColor: d.status === 'verified' ? 'var(--success-500)' : 'var(--warning-500)' }} />
                          {d.status === 'verified' ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                          <small style={{ color: 'var(--text-tertiary)' }}>{new Date(d.updated_at || d.created_at || Date.now()).toLocaleString()}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-end flex-wrap">
                          <Link to={`/admin/devices/${d.id}`} className="btn-ghost">View</Link>
                          <button className="btn-ghost" style={{ color: 'var(--success-500)' }} onClick={() => handleVerify(d.id, true)} title="Verify">
                            <CheckCircle size={14} />
                          </button>
                          <button className="btn-ghost" style={{ color: 'var(--danger-500)' }} onClick={() => handleVerify(d.id, false)} title="Reject">
                            <XCircle size={14} />
                          </button>
                          <button className="btn-ghost" style={{ color: 'var(--warning-500)' }} onClick={() => setReportingDeviceId(prev => prev === d.id ? null : d.id)}>
                            Report
                          </button>
                          <button className="btn-ghost" onClick={() => startEdit(d)}><EditIcon size={14} /></button>
                          {d.status === 'unverified' && (
                            <button className="btn-ghost" onClick={() => handleResendVerificationEmail(d.id)} title="Resend Email">
                              Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.map(d => reportingDeviceId === d.id ? (
                    <tr key={`report-${d.id}`}>
                      <td colSpan={5} style={{ background: 'var(--bg-tertiary)' }}>
                        <div className="d-flex flex-wrap gap-3 align-items-end p-3">
                          <div>
                            <label className="form-label">Type</label>
                            <select className="modern-select" value={reportType} onChange={e => setReportType(e.target.value as any)}>
                              <option value="stolen">Stolen</option>
                              <option value="lost">Lost</option>
                              <option value="found">Found</option>
                            </select>
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 240 }}>
                            <label className="form-label">Description</label>
                            <input className="modern-input" value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="Notes..." />
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn-gradient-primary" onClick={() => handleCreateReport(d.id)}><Plus size={16} /> Create</button>
                            <button className="btn-ghost" onClick={() => setReportingDeviceId(null)}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    ) : null)}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Smartphone size={32} /></div>
                <h3>No devices found</h3>
                <p>Try adjusting the search or filters.</p>
              </div>
            )}
            {error && <div className="text-center py-3"><small style={{ color: 'var(--danger-500)' }}>{error}</small></div>}
            {!loading && pagination && (
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 p-4 border-top" style={{ borderTopColor: 'var(--border-color)' }}>
                <small style={{ color: 'var(--text-tertiary)' }}>Page {pagination.page} of {pagination.pages} &middot; {pagination.total} total</small>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn-ghost" disabled={pagination.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                  <button className="btn-ghost" disabled={pagination.page >= pagination.pages} onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}>Next</button>
                  <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1) }} className="modern-select" style={{ width: 'auto', padding: '6px 12px' }}>
                    <option value={10}>10/page</option>
                    <option value={20}>20/page</option>
                    <option value={50}>50/page</option>
                  </select>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {editingDeviceId && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ maxWidth: 640 }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h3>Edit Device</h3>
                <button onClick={() => setEditingDeviceId(null)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Brand</label>
                    <input className="modern-input" value={editForm.brand} onChange={e => setEditForm(prev => ({ ...prev, brand: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Model</label>
                    <input className="modern-input" value={editForm.model} onChange={e => setEditForm(prev => ({ ...prev, model: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Color</label>
                    <input className="modern-input" value={editForm.color || ''} onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <select className="modern-select" value={editForm.category || ''} onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}>
                      <option value="">\u2014</option>
                      {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Status</label>
                    <select className="modern-select" value={editForm.status || 'unverified'} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}>
                      <option value="unverified">Unverified</option>
                      <option value="verified">Verified</option>
                      <option value="found">Found</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">IMEI</label>
                    <input className="modern-input" value={editForm.imei || ''} onChange={e => setEditForm(prev => ({ ...prev, imei: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Serial</label>
                    <input className="modern-input" value={editForm.serial || ''} onChange={e => setEditForm(prev => ({ ...prev, serial: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditingDeviceId(null)} className="btn-ghost">Cancel</button>
                <button onClick={submitEdit} className="btn-gradient-primary"><Save size={18} /> Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function EditIcon({ size }: { size?: number }) {
  return (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
