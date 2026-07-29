import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Smartphone, MapPin, Clock, User, FileText, ArrowLeft, Loader2, ExternalLink, Shield } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useParams, useNavigate, Link } from 'react-router-dom'

type Report = {
  id: string
  type: string
  status: string
  description: string
  location: string
  created_at: string
  updated_at: string
  device?: { id: string; brand: string; model: string; imei: string; serial: string }
  reporter?: { id: string; name: string; email: string }
}

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: _user } = useAuth()
  const { toasts, removeToast, showError: _showError } = useToast()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Report not found')
        const data = await res.json()
        setReport(data.data || data)
      } catch { setReport(null) }
      finally { setLoading(false) }
    }
    fetchReport()
  }, [id])

  const statusBadge = (s?: string) => {
    const map: Record<string, string> = { open: 'status-pending', investigating: 'status-unverified', resolved: 'status-verified', closed: 'status-found', dismissed: 'status-stolen' }
    return <span className={`status-badge ${map[(s || '').toLowerCase()] || ''}`}>{(s || 'Unknown').charAt(0).toUpperCase() + (s || 'Unknown').slice(1)}</span>
  }

  const typeIcon = (t?: string) => {
    const tl = (t || '').toLowerCase()
    if (tl === 'stolen') return { icon: AlertTriangle, color: 'var(--danger-500)', bg: 'var(--danger-50)' }
    if (tl === 'lost') return { icon: AlertTriangle, color: 'var(--warning-500)', bg: 'var(--warning-50)' }
    if (tl === 'found') return { icon: Shield, color: 'var(--success-500)', bg: 'var(--success-50)' }
    return { icon: FileText, color: 'var(--primary-600)', bg: 'var(--primary-50)' }
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

  if (!report) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center py-4">
            <div className="col-lg-8">
              <div className="modern-card p-5 text-center">
                <div className="empty-state"><div className="empty-state-icon"><AlertTriangle size={48} /></div><h3>Report Not Found</h3><p>The report you're looking for doesn't exist</p><Link to="/reports" className="btn-gradient-primary mt-3">View All Reports</Link></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const ti = typeIcon(report.type)

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: ti.bg }}>
                  <ti.icon size={24} style={{ color: ti.color }} />
                </div>
                <div>
                  <h1>Report Details</h1>
                  <p style={{ textTransform: 'capitalize' }}>{report.type} Report &middot; {report.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4">Device Information</h5>
                {report.device ? (
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar avatar-lg" style={{ background: 'var(--primary-50)' }}><Smartphone size={24} style={{ color: 'var(--primary-600)' }} /></div>
                    <div>
                      <p className="fw-semibold mb-1">{report.device.brand} {report.device.model}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>IMEI: {report.device.imei || '—'} &middot; Serial: {report.device.serial || '—'}</p>
                      <Link to={`/device-details/${report.device.id}`} className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 13 }}><ExternalLink size={14} /> View Device</Link>
                    </div>
                  </div>
                ) : <p style={{ color: 'var(--text-secondary)' }}>No device information</p>}
              </div>

              <div className="modern-card p-4 mb-4">
                <h5 className="mb-3">Description</h5>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{report.description || 'No description provided'}</p>
              </div>

              {report.location && (
                <div className="modern-card p-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2"><MapPin size={18} style={{ color: 'var(--danger-500)' }} /> Location</h5>
                  <p style={{ color: 'var(--text-secondary)' }}>{report.location}</p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="col-lg-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="modern-card p-4 mb-4">
                <h5 className="mb-3">Status</h5>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: 'var(--text-secondary)' }}>Current Status</span>
                  {statusBadge(report.status)}
                </div>
                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Type</span>
                  <span className="fw-medium text-capitalize">{report.type}</span>
                </div>
              </div>

              <div className="modern-card p-4 mb-4">
                <h5 className="mb-3">Timeline</h5>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, background: 'var(--danger-50)' }}>
                    <FileText size={16} style={{ color: 'var(--danger-500)' }} />
                  </div>
                  <div>
                    <p className="fw-medium mb-0" style={{ fontSize: 14 }}>Reported</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, background: 'var(--primary-50)' }}>
                    <Clock size={16} style={{ color: 'var(--primary-600)' }} />
                  </div>
                  <div>
                    <p className="fw-medium mb-0" style={{ fontSize: 14 }}>Last Updated</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(report.updated_at || report.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {report.reporter && (
                <div className="modern-card p-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2"><User size={18} style={{ color: 'var(--primary-600)' }} /> Reporter</h5>
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>{report.reporter.name?.charAt(0) || '?'}</div>
                    <div>
                      <p className="fw-medium mb-0">{report.reporter.name || 'Anonymous'}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{report.reporter.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
