import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../../components/Layout'
import { useToast, ToastContainer } from '../../components/Toast'
import { apiClient } from '../../lib/apiClient'
import { ShieldAlert, AlertTriangle, Eye, MapPin, RefreshCw, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface FraudAlert {
  id: string
  monitor_name: string
  severity: string
  risk_score: number
  description: string
  details: any
  status: string
  user_id?: string
  user_name?: string
  user_email?: string
  flagged_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'var(--warning-500)',
  medium: 'var(--warning-500)',
  high: 'var(--danger-500)',
  critical: 'var(--danger-500)',
}

const STATUS_BADGES: Record<string, string> = {
  new: 'badge bg-warning text-dark',
  reviewing: 'badge bg-info text-white',
  resolved: 'badge bg-success text-white',
  dismissed: 'badge bg-secondary text-white',
}

export default function FraudAlerts() {
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [alertData, statsData] = await Promise.all([
        apiClient.fraud.alerts({ page: 1, limit: 50 }),
        apiClient.fraud.stats(),
      ])
      setAlerts(Array.isArray(alertData) ? alertData : alertData.alerts || [])
      setStats(statsData)
    } catch {
      showError('Failed to load fraud alerts')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      await apiClient.fraud.updateAlert(id, { status })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      setSelectedAlert(prev => prev?.id === id ? { ...prev, status } : prev)
      showSuccess(`Alert ${status}`)
    } catch (e: any) {
      showError(e.message || 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}>
          <Loader2 size={32} className="spin" />
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
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger-500)', width: 52, height: 52 }}>
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h1>Fraud Detection Alerts</h1>
                  <p>Monitor and manage suspicious activity</p>
                </div>
              </div>
              <button onClick={loadData} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </motion.div>

          {stats && (
            <motion.div variants={itemVariants} className="row g-3 mb-4">
              {[
                { label: 'Total Alerts', value: stats.total || 0, color: 'var(--danger-500)' },
                { label: 'New', value: stats.new || 0, color: 'var(--warning-500)' },
                { label: 'Critical', value: stats.critical || 0, color: 'var(--danger-500)' },
                { label: 'Resolved', value: stats.resolved || 0, color: 'var(--success)' },
              ].map(s => (
                <div key={s.label} className="col-6 col-md-3">
                  <div className="modern-card p-3 text-center">
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <small style={{ color: 'var(--text-tertiary)' }}>{s.label}</small>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            {alerts.length === 0 ? (
              <div className="modern-card p-5 text-center">
                <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 12 }} />
                <h5 style={{ color: 'var(--text-primary)' }}>No Fraud Alerts</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Your fraud detection system is running smoothly</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Monitor</th>
                      <th>User</th>
                      <th>Risk Score</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Flagged</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(alert => (
                      <tr key={alert.id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                            {alert.monitor_name?.replace(/_/g, ' ')}
                          </div>
                        </td>
                        <td>
                          <div style={{ color: 'var(--text-primary)' }}>{alert.user_name || 'Unknown'}</div>
                          <small style={{ color: 'var(--text-tertiary)' }}>{alert.user_email || ''}</small>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontWeight: 600, color: alert.risk_score >= 70 ? 'var(--danger-500)' : alert.risk_score >= 50 ? 'var(--warning-500)' : 'var(--text-secondary)'
                          }}>
                            <AlertTriangle size={14} />
                            {alert.risk_score}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: SEVERITY_COLORS[alert.severity], textTransform: 'capitalize', fontWeight: 500 }}>
                            {alert.severity}
                          </span>
                        </td>
                        <td>
                          <span className={STATUS_BADGES[alert.status] || 'badge bg-secondary'} style={{ fontSize: 11 }}>
                            {alert.status}
                          </span>
                        </td>
                        <td>
                          <small style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(alert.flagged_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button onClick={() => setSelectedAlert(alert)} className="btn btn-sm btn-ghost" title="View Details">
                              <Eye size={14} />
                            </button>
                            {alert.status === 'new' && (
                              <button onClick={() => updateStatus(alert.id, 'reviewing')} disabled={updating === alert.id} className="btn btn-sm btn-ghost" title="Start Review" style={{ color: 'var(--info)' }}>
                                <Clock size={14} />
                              </button>
                            )}
                            {alert.status === 'reviewing' && (
                              <>
                                <button onClick={() => updateStatus(alert.id, 'resolved')} disabled={updating === alert.id} className="btn btn-sm btn-ghost" title="Resolve" style={{ color: 'var(--success)' }}>
                                  <CheckCircle size={14} />
                                </button>
                                <button onClick={() => updateStatus(alert.id, 'dismissed')} disabled={updating === alert.id} className="btn btn-sm btn-ghost" title="Dismiss" style={{ color: 'var(--text-secondary)' }}>
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alert Details</h3>
              <button onClick={() => setSelectedAlert(null)} className="btn-ghost p-1"><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <small style={{ color: 'var(--text-tertiary)' }}>Monitor</small>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {selectedAlert.monitor_name?.replace(/_/g, ' ')}
                </div>
              </div>
              <div className="mb-3">
                <small style={{ color: 'var(--text-tertiary)' }}>Description</small>
                <div style={{ color: 'var(--text-primary)' }}>{selectedAlert.description}</div>
              </div>
              {selectedAlert.details && (
                <div className="mb-3">
                  <small style={{ color: 'var(--text-tertiary)' }}>Details</small>
                  <pre style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
              <div className="d-flex gap-4">
                <div>
                  <small style={{ color: 'var(--text-tertiary)' }}>Risk Score</small>
                  <div style={{ fontWeight: 600, color: selectedAlert.risk_score >= 70 ? 'var(--danger-500)' : 'var(--warning-500)' }}>
                    {selectedAlert.risk_score}/100
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--text-tertiary)' }}>Severity</small>
                  <div style={{ color: SEVERITY_COLORS[selectedAlert.severity], textTransform: 'capitalize' }}>
                    {selectedAlert.severity}
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--text-tertiary)' }}>Status</small>
                  <div style={{ textTransform: 'capitalize' }}>{selectedAlert.status}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedAlert(null)} className="btn-ghost">Close</button>
              {selectedAlert.status === 'new' && (
                <button onClick={() => { updateStatus(selectedAlert.id, 'reviewing'); setSelectedAlert(null) }} className="btn-gradient-primary">
                  Start Review
                </button>
              )}
              {selectedAlert.status === 'reviewing' && (
                <>
                  <button onClick={() => { updateStatus(selectedAlert.id, 'dismissed'); setSelectedAlert(null) }} className="btn-ghost">
                    Dismiss
                  </button>
                  <button onClick={() => { updateStatus(selectedAlert.id, 'resolved'); setSelectedAlert(null) }} className="btn-gradient-primary">
                    <CheckCircle size={16} /> Resolve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
