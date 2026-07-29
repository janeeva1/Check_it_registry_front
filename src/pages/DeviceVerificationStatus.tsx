import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Eye, Copy, Smartphone, Search, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

type Verification = {
  id: string
  device_id: string
  method: string
  status: string
  created_at: string
  verified_at: string | null
  device?: { brand: string; model: string; imei: string; serial: string }
}

export default function DeviceVerificationStatus() {
  const { toasts, removeToast, showSuccess: _showSuccess, showError: _showError } = useToast()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchVerifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/verifications`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setVerifications(data.data || [])
    } catch {
      setVerifications([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchVerifications() }, [])

  const filtered = verifications.filter(v => {
    if (filter !== 'all' && v.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      const d = v.device
      if (!d) return false
      return d.brand.toLowerCase().includes(q) || d.model.toLowerCase().includes(q) || d.imei.includes(q) || d.serial.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
    }
    return true
  })

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { verified: 'status-verified', pending: 'status-pending', failed: 'status-stolen', expired: 'status-unverified' }
    return <span className={`status-badge ${map[s] || ''}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
  }

  const statusIcon = (s: string) => {
    if (s === 'verified') return <CheckCircle size={18} style={{ color: 'var(--success-500)' }} />
    if (s === 'failed') return <XCircle size={18} style={{ color: 'var(--danger-500)' }} />
    if (s === 'expired') return <AlertTriangle size={18} style={{ color: 'var(--warning-500)' }} />
    return <Clock size={18} style={{ color: 'var(--warning-500)' }} />
  }

  const stats = [
    { label: 'Total', value: verifications.length, icon: Shield, color: 'var(--primary-600)' },
    { label: 'Verified', value: verifications.filter(v => v.status === 'verified').length, icon: CheckCircle, color: 'var(--success-500)' },
    { label: 'Pending', value: verifications.filter(v => v.status === 'pending').length, icon: Clock, color: 'var(--warning-500)' },
    { label: 'Failed', value: verifications.filter(v => v.status === 'failed').length, icon: XCircle, color: 'var(--danger-500)' },
  ]

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <h1>Verification Status</h1>
                  <p>Track device verification requests</p>
                </div>
                <div className="ms-md-auto">
                  <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={fetchVerifications}>
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {stats.map(s => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className="stat-card">
                <div className="d-flex align-items-center gap-3">
                  <s.icon size={24} style={{ color: s.color }} />
                  <div>
                    <p className="stat-label">{s.label}</p>
                    <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modern-card p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                <input type="text" placeholder="Search by device, IMEI, or ID..." className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '8px 0' }} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select className="modern-select" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="modern-card p-5 text-center">
            <Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="modern-card p-5 text-center">
            <div className="empty-state">
              <div className="empty-state-icon"><Shield size={48} /></div>
              <h3>No Verifications Found</h3>
              <p>{search || filter !== 'all' ? 'Try adjusting your filters' : 'No verification requests yet'}</p>
              <Link to="/verify-device" className="btn-gradient-primary mt-3">Verify a Device</Link>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((v, i) => (
              <motion.div key={v.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="modern-card p-3">
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-5">
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar" style={{ background: 'var(--primary-50)' }}><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /></div>
                        <div>
                          <p className="fw-medium mb-1">{v.device?.brand || 'Unknown'} {v.device?.model || ''}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>IMEI: {v.device?.imei || '—'} &middot; {v.method}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-4 col-md-2">{statusBadge(v.status)}</div>
                    <div className="col-4 col-md-2 d-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {statusIcon(v.status)}
                      {v.verified_at ? new Date(v.verified_at).toLocaleDateString() : new Date(v.created_at).toLocaleDateString()}
                    </div>
                    <div className="col-4 col-md-3 text-md-end">
                      <button className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 13 }} onClick={() => navigator.clipboard?.writeText(v.id)}>
                        <Copy size={14} /> ID
                      </button>
                      <Link to={`/device-details/${v.device_id}`} className="btn-ghost d-inline-flex align-items-center gap-1 ms-1" style={{ fontSize: 13 }}>
                        <Eye size={14} /> View
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
