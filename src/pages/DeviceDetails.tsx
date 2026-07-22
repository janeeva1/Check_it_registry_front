import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, ArrowLeft, Edit2, Trash2, CheckCircle, AlertTriangle, Clock, Shield, Copy, ExternalLink, History, Loader2, Plus, LogOut } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'

type Device = {
  id: string
  brand: string
  model: string
  imei: string
  serial: string
  category: string
  color: string
  storage: string
  status: string
  notes: string
  purchaseDate: string
  estimatedValue: number
  created_at: string
  owner?: { id: string; name: string; email: string }
}

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Device>>({})

  useEffect(() => {
    if (!id) return
    const fetchDevice = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Device not found')
        const data = await res.json()
        setDevice(data.data || data)
      } catch { setDevice(null) }
      finally { setLoading(false) }
    }
    fetchDevice()
  }, [id])

  const handleEdit = async () => {
    if (!device) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Failed to update')
      const data = await res.json()
      setDevice({ ...device, ...editForm })
      setEditing(false)
      showSuccess('Device updated')
    } catch (err: any) { showError(err.message) }
  }

  const handleDelete = async () => {
    if (!device || !window.confirm('Are you sure? This cannot be undone.')) return
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/${device.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      showSuccess('Device removed')
      navigate('/my-devices')
    } catch (err: any) { showError(err.message) }
  }

  const handleRelease = async () => {
    if (!device) return
    if (!window.confirm(`Release "${device.brand} ${device.model}" from your account?\n\nThe device will be available for a new owner to register. This action cannot be undone.`)) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api'}/device-management/${device.id}/release`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to release device') }
      showSuccess('Device released successfully')
      setTimeout(() => navigate('/my-devices'), 1500)
    } catch (err: any) { showError(err.message) }
  }

  const statusBadge = (s?: string) => {
    const st = (s || '').toLowerCase()
    if (['clean', 'verified', 'clear', 'active'].includes(st)) return <span className="status-badge status-verified">Active</span>
    if (st === 'stolen') return <span className="status-badge status-stolen">Stolen</span>
    if (st === 'lost') return <span className="status-badge status-unverified">Lost</span>
    if (st === 'transferred') return <span className="status-badge status-found">Transferred</span>
    return <span className="status-badge status-found">{(s || 'Unknown').charAt(0).toUpperCase() + (s || 'Unknown').slice(1)}</span>
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center py-4">
            <div className="col-lg-8"><div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!device) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center py-4">
            <div className="col-lg-8">
              <div className="modern-card p-5 text-center">
                <div className="empty-state"><div className="empty-state-icon"><Smartphone size={48} /></div><h3>Device Not Found</h3><p>The device doesn't exist or has been removed</p><Link to="/my-devices" className="btn-gradient-primary mt-3">My Devices</Link></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Smartphone size={24} className="text-white" />
                </div>
                <div>
                  <h1>{device.brand} {device.model}</h1>
                  <p>{device.category} &middot; {statusBadge(device.status)}</p>
                </div>
                <div className="ms-md-auto d-flex gap-2">
                  <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => { setEditing(!editing); setEditForm(device) }}><Edit2 size={16} /> {editing ? 'Cancel' : 'Edit'}</button>
                  <button className="btn-ghost d-inline-flex align-items-center gap-2" style={{ color: 'var(--danger-500)' }} onClick={handleDelete}><Trash2 size={16} /> Remove</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {editing ? (
                <div className="modern-card p-4">
                  <h5 className="mb-4">Edit Device</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Brand</label>
                      <input className="modern-input" value={editForm.brand || ''} onChange={e => setEditForm(p => ({ ...p, brand: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Model</label>
                      <input className="modern-input" value={editForm.model || ''} onChange={e => setEditForm(p => ({ ...p, model: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Color</label>
                      <input className="modern-input" value={editForm.color || ''} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Storage</label>
                      <input className="modern-input" value={editForm.storage || ''} onChange={e => setEditForm(p => ({ ...p, storage: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea className="modern-textarea" rows={3} value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Estimated Value ($)</label>
                      <input type="number" className="modern-input" value={editForm.estimatedValue || ''} onChange={e => setEditForm(p => ({ ...p, estimatedValue: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div className="mt-4 d-flex gap-2 justify-content-end">
                    <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="btn-gradient-primary" onClick={handleEdit}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <div className="modern-card p-4">
                  <h5 className="mb-4">Device Information</h5>
                  <div className="row g-3" style={{ fontSize: 14 }}>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Category</span><p className="fw-medium mb-0 mt-1 text-capitalize">{device.category}</p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Color</span><p className="fw-medium mb-0 mt-1">{device.color || '—'}</p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Storage</span><p className="fw-medium mb-0 mt-1">{device.storage || '—'}</p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>IMEI</span><p className="fw-medium mb-0 mt-1" style={{ fontFamily: 'monospace' }}>{device.imei || '—'}<button className="btn btn-link p-0 ms-1" onClick={() => { navigator.clipboard?.writeText(device.imei || '') }}><Copy size={12} /></button></p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Serial</span><p className="fw-medium mb-0 mt-1" style={{ fontFamily: 'monospace' }}>{device.serial || '—'}</p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Status</span><p className="mb-0 mt-1">{statusBadge(device.status)}</p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Est. Value</span><p className="fw-medium mb-0 mt-1">{device.estimatedValue ? `$${device.estimatedValue}` : '—'}</p></div>
                    <div className="col-md-4"><span style={{ color: 'var(--text-secondary)' }}>Registered</span><p className="fw-medium mb-0 mt-1">{new Date(device.created_at).toLocaleDateString()}</p></div>
                    {device.notes && <div className="col-12"><span style={{ color: 'var(--text-secondary)' }}>Notes</span><p className="fw-medium mb-0 mt-1">{device.notes}</p></div>}
                  </div>
                </div>
              )}

              {device.owner && device.owner.id !== user?.id && (
                <div className="modern-card p-3 mt-3">
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Owner: {device.owner.name} ({device.owner.email})</p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="col-lg-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4 d-flex align-items-center gap-2"><Shield size={20} style={{ color: 'var(--primary-600)' }} /> Quick Actions</h5>
                <div className="d-flex flex-column gap-2">
                  <Link to={`/device-check-report?deviceId=${device.id}`} className="btn-outline-primary d-flex align-items-center gap-2"><Shield size={16} /> Check Device</Link>
                  <Link to={`/device-transfer?device=${device.id}`} className="btn-outline-primary d-flex align-items-center gap-2"><Smartphone size={16} /> Transfer Ownership</Link>
                  <Link to={`/verify-device?device=${device.id}`} className="btn-outline-primary d-flex align-items-center gap-2"><CheckCircle size={16} /> Verify Ownership</Link>
                  <Link to={`/report-incident?device=${device.id}`} className="btn-outline-primary d-flex align-items-center gap-2" style={{ color: 'var(--danger-500)' }}><AlertTriangle size={16} /> Report Incident</Link>
                  <button onClick={handleRelease} className="btn-outline-primary d-flex align-items-center gap-2" style={{ color: 'var(--warning-500)' }}><LogOut size={16} /> Release Device</button>
                </div>
              </div>

              <div className="modern-card p-4">
                <h5 className="mb-3 d-flex align-items-center gap-2"><History size={18} style={{ color: 'var(--primary-600)' }} /> Recent Activity</h5>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: 'var(--primary-50)' }}><Clock size={14} style={{ color: 'var(--primary-600)' }} /></div>
                  <div>
                    <p className="fw-medium mb-0" style={{ fontSize: 13 }}>Device Registered</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{new Date(device.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Link to={`/audit?entity=${device.id}`} className="btn-ghost d-inline-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                  <History size={14} /> View Full Audit Trail
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
