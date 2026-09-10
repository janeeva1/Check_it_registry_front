import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import {
  Shield, Smartphone, User, MapPin, Calendar, Clock, AlertTriangle,
  Mail, ChevronLeft, Save
} from 'lucide-react'

interface RecoveryRecord {
  id: string
  case_id?: string
  report_type?: string
  status?: string
  notes?: string
  lea_notes?: string
  location?: string
  occurred_at?: string
  created_at?: string
  updated_at?: string
  device_id?: string
  device_brand?: string
  device_model?: string
  imei?: string
  serial?: string
  color?: string
  device_image_url?: string
  proof_url?: string
  owner_id?: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  owner_region?: string
  recovered_by?: string
  recovered_by_agency?: string
  reporter_name?: string
  recovered_at?: string
}

const statusConfig: Record<string, { class: string; label: string }> = {
  open: { class: 'status-pending', label: 'Open' },
  under_review: { class: 'status-pending', label: 'Under Review' },
  pending_recovery: { class: 'status-pending', label: 'Pending Recovery' },
  in_progress: { class: 'status-pending', label: 'In Progress' },
  recovered: { class: 'status-recovered', label: 'Recovered' },
  resolved: { class: 'status-verified', label: 'Resolved' },
  confirmed: { class: 'status-verified', label: 'Confirmed' },
  closed: { class: 'status-inactive', label: 'Closed' },
  dismissed: { class: 'status-inactive', label: 'Dismissed' },
  failed: { class: 'status-stolen', label: 'Failed' }
}

function StatusBadge({ status }: { status?: string }) {
  const cfg = statusConfig[status || ''] || { class: 'status-pending', label: status || '—' }
  return <span className={`status-badge ${cfg.class}`}>{cfg.label}</span>
}

export default function LEARecoveryDetail() {
  const { id } = useParams()
  const [record, setRecord] = useState<RecoveryRecord | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')

  const load = async () => {
    if (!id) return
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/lea-portal/recovery/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const json = await res.json()
      setRecord(json.record || null)
      setHistory(json.history || [])
      setNewStatus(json.record?.status || '')
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery details')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [id])

  const updateStatus = async () => {
    if (!id || !newStatus) return
    try {
      setSaving(true); setError(null)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/lea-portal/cases/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      setRecord(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const saveNote = async () => {
    if (!id || !note.trim()) return
    try {
      setSaving(true); setError(null)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/lea-portal/cases/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ notes: note.trim() })
      })
      if (!res.ok) throw new Error('Failed to add note')
      setNote('')
      await load()
    } catch (err: any) {
      setError(err.message || 'Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  const variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  return (
    <Layout requireAuth allowedRoles={['lea', 'admin']}>
      <motion.div className="container-fluid" initial="hidden" animate="visible">
        <motion.div variants={variants} className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <h1>Recovery Details</h1>
              <p>{record?.case_id ? `Case ${record.case_id}` : 'Recovery operation'}</p>
            </div>
          </div>
          <Link to="/lea/recovery" className="btn-ghost">
            <ChevronLeft size={16} /> Back to Recovery
          </Link>
        </motion.div>

        {error && (
          <motion.div variants={variants} className="alert-banner alert-banner-danger mb-4">
            <AlertTriangle size={20} />
            <div>
              <strong>Error</strong>
              <div className="small">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="btn-ghost ms-auto">Dismiss</button>
          </motion.div>
        )}

        {loading && (
          <motion.div variants={variants} className="modern-card p-5 text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <div className="text-muted small">Loading recovery details...</div>
          </motion.div>
        )}

        {!loading && !record && (
          <motion.div variants={variants} className="empty-state">
            <div className="empty-state-icon"><Shield size={32} /></div>
            <h3>Recovery record not found</h3>
            <p>This recovery record may have been removed or you do not have access to it.</p>
          </motion.div>
        )}

        {!loading && record && (
          <div className="row g-4">
            <div className="col-lg-8">
              <motion.div variants={variants} className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="h6 m-0">Device</h3>
                  {record.device_id && (
                    <Link to={`/lea/devices/${record.device_id}`} className="btn-ghost btn-sm">
                      <Smartphone size={14} /> LEA Device View
                    </Link>
                  )}
                </div>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="text-secondary small">Device</div>
                    <div className="fw-medium">{record.device_brand} {record.device_model}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-secondary small">Identifier</div>
                    <code className="small">{record.imei || record.serial || '—'}</code>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-secondary small">Report Type</div>
                    <div className="text-capitalize fw-medium">{record.report_type || '—'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-secondary small">Status</div>
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={variants} className="modern-card p-4 mb-4">
                <h3 className="h6 mb-3">Owner</h3>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-1 text-secondary small"><User size={12} /> Name</div>
                    <div className="fw-medium">{record.owner_name || '—'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-1 text-secondary small"><MapPin size={12} /> Region</div>
                    <div>{record.owner_region || '—'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-1 text-secondary small"><Mail size={12} /> Email</div>
                    <div>{record.owner_email || '—'}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-1 text-secondary small">
                      <Calendar size={12} /> Reported At
                    </div>
                    <div>{record.created_at ? new Date(record.created_at).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={variants} className="modern-card p-4">
                <h3 className="h6 mb-3">Update Status</h3>
                <div className="d-flex gap-2 flex-wrap align-items-center">
                  <select className="modern-select" style={{ maxWidth: 220 }} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <button className="btn-ghost" onClick={updateStatus} disabled={saving || !newStatus}>
                    <Save size={16} /> Save Status
                  </button>
                </div>
                <hr />
                <h3 className="h6">Add Investigation Note</h3>
                <textarea className="form-control mb-2" rows={4} placeholder="Enter note details" value={note} onChange={e => setNote(e.target.value)} />
                <button className="btn-ghost" onClick={saveNote} disabled={saving || !note.trim()}>
                  <Save size={16} /> Save Note
                </button>
              </motion.div>
            </div>

            <div className="col-lg-4">
              <motion.div variants={variants} className="modern-card p-4 mb-4">
                <h3 className="h6 mb-3">Recovery Info</h3>
                <div className="d-flex align-items-center gap-2 mb-2 text-secondary small">
                  <Clock size={14} /> Last Activity
                </div>
                <div className="fw-medium mb-3">{record.updated_at ? new Date(record.updated_at).toLocaleString() : '—'}</div>
                <div className="d-flex align-items-center gap-2 mb-2 text-secondary small">
                  <Shield size={14} /> Recovered By
                </div>
                <div className="fw-medium mb-3">{record.recovered_by || record.recovered_by_agency || '—'}</div>
                {record.recovered_at && (
                  <>
                    <div className="d-flex align-items-center gap-2 mb-2 text-secondary small"><Calendar size={14} /> Recovered At</div>
                    <div className="fw-medium">{new Date(record.recovered_at).toLocaleString()}</div>
                  </>
                )}
              </motion.div>

              <motion.div variants={variants} className="modern-card p-4 mb-4">
                <h3 className="h6 mb-3">Reporter</h3>
                <div className="fw-medium">{record.reporter_name || '—'}</div>
              </motion.div>

              <motion.div variants={variants} className="modern-card p-4">
                <h3 className="h6 mb-3">Case Notes</h3>
                {record.notes || record.lea_notes ? (
                  <div style={{ whiteSpace: 'pre-wrap' }} className="small">
                    {record.notes || record.lea_notes}
                  </div>
                ) : (
                  <div className="text-secondary small">No notes yet</div>
                )}
              </motion.div>
            </div>

            {history.length > 0 && (
              <motion.div variants={variants} className="col-12">
                <div className="modern-card p-4">
                  <h3 className="h6 mb-3">Activity Timeline</h3>
                  <div className="small">
                    {history.map((h: any) => (
                      <div key={h.id} className="mb-2 d-flex gap-2 align-items-baseline">
                        <span className="text-secondary">{h.created_at ? new Date(h.created_at).toLocaleString() : '—'}</span>
                        <span className="fw-medium">{h.action}</span>
                        <span className="text-secondary">— {h.user_name || 'System'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  )
}