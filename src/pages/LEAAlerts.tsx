import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import {
  ShieldAlert, AlertTriangle, Bell, RefreshCw,
  Eye, MapPin, Globe, Monitor, Smartphone, Clock, Activity,
  AlertCircle
} from 'lucide-react'

interface ReportedDevice {
  id: string
  brand: string
  model: string
  imei?: string
  serial?: string
  status: string
  owner_name: string
  owner_email: string
  owner_phone: string
  owner_region: string
  latest_report_at: string
  latest_report_type: string
  report_count: number
}

interface DeviceCheckAlert {
  id: string
  device_id: string | null
  check_type: string
  created_at: string
  latitude?: number
  longitude?: number
  location_accuracy?: number
  ip_address?: string
  mac_address?: string
  user_agent?: string
  checker_user_id?: string
  brand?: string
  model?: string
  imei?: string
  serial?: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  owner_region?: string
  checker_name?: string
  checker_email?: string
  checker_phone?: string
  severity?: string
}

const severityConfig: Record<string, { class: string; icon: any; label: string }> = {
  critical: { class: 'alert-banner-danger', icon: AlertCircle, label: 'Critical' },
  high: { class: 'alert-banner-warning', icon: AlertTriangle, label: 'High' },
  medium: { class: 'alert-banner-info', icon: Bell, label: 'Medium' },
  low: { class: '', icon: Activity, label: 'Low' }
}

function getSeverity(alert: DeviceCheckAlert): string {
  if (alert.check_type === 'stolen_check') return 'critical'
  if (alert.check_type === 'suspicious') return 'high'
  if (alert.latitude && alert.longitude) return 'medium'
  return 'low'
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'status-active',
    stolen: 'status-stolen',
    recovered: 'status-recovered',
    pending: 'status-pending',
    under_review: 'status-pending',
    resolved: 'status-verified',
    dismissed: 'status-inactive'
  }
  const cls = map[status] || 'status-pending'
  return <span className={`status-badge ${cls}`}>{status.replace(/_/g, ' ')}</span>
}

export default function LEAAlerts() {
  const [reportedDevices, setReportedDevices] = useState<ReportedDevice[]>([])
  const [alerts, setAlerts] = useState<DeviceCheckAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const [reportedRes, alertsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/lea-portal/reported-devices?page=1&limit=50`, { headers }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/lea-portal/alerts/device-checks?limit=50`, { headers })
      ])
      if (!reportedRes.ok) throw new Error('Failed to load reported devices')
      if (!alertsRes.ok) throw new Error('Failed to load alerts')
      const reportedJson = await reportedRes.json()
      const alertsJson = await alertsRes.json()
      setReportedDevices(reportedJson.devices || [])
      setAlerts((alertsJson.alerts || []).map((a: DeviceCheckAlert) => ({ ...a, severity: getSeverity(a) })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LEA alerts')
    } finally { setLoading(false) }
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (typeFilter !== 'all' && a.check_type !== typeFilter) return false
    return true
  })
  const filteredDevices = reportedDevices.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    return true
  })

  const criticalCount = criticalAlerts.length
  const reportedCount = reportedDevices.length
  const activeChecks = alerts.filter(a => a.check_type === 'stolen_check').length
  const todayAlerts = alerts.filter(a => {
    const d = new Date(a.created_at); const n = new Date()
    return d.toDateString() === n.toDateString()
  }).length

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  }

  return (
    <Layout requireAuth allowedRoles={['lea']}>
      <motion.div className="container-fluid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="page-header">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={24} color="white" />
            </div>
            <div>
              <h1>Alerts & Intelligence</h1>
              <p>Reported devices and real-time check alerts in your jurisdiction</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="alert-banner alert-banner-danger">
            <AlertTriangle size={20} />
            <div>
              <strong>Error loading alerts</strong>
              <div className="small">{error}</div>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="stat-value">{criticalCount}</div>
                  <div className="stat-label">Critical Alerts</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <div className="stat-value">{reportedCount}</div>
                  <div className="stat-label">Reported Devices</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div className="stat-value">{activeChecks}</div>
                  <div className="stat-label">Active Checks</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div className="stat-value">{todayAlerts}</div>
                  <div className="stat-label">Today's Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {criticalAlerts.length > 0 && (
          <motion.div variants={itemVariants}>
            {criticalAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="alert-banner alert-banner-danger d-flex align-items-center gap-3 mb-2">
                <AlertTriangle size={20} />
                <div className="flex-grow-1">
                  <strong>Critical: {alert.brand} {alert.model}</strong>
                  <div className="small">{alert.imei || alert.serial} — Checked by {alert.checker_name || 'Anonymous'} at {new Date(alert.created_at).toLocaleString()}</div>
                </div>
                <a href={`/device-check-report?checkId=${alert.id}`} className="btn-ghost text-nowrap">
                  <Eye size={16} /> Investigate
                </a>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="modern-card mb-4">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 fw-semibold">
              <AlertTriangle size={18} /> Reported Devices
              <span className="status-badge status-active">{reportedCount}</span>
            </div>
            <div className="d-flex gap-2">
              <select className="modern-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="stolen">Stolen</option>
                <option value="recovered">Recovered</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-center"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Identifier</th>
                    <th>Owner</th>
                    <th>Region</th>
                    <th>Latest Report</th>
                    <th>Type</th>
                    <th>Reports</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map(dev => (
                    <tr key={dev.id}>
                      <td className="fw-semibold">{dev.brand} {dev.model}</td>
                      <td><code className="small">{dev.imei || dev.serial || '-'}</code></td>
                      <td>
                        <div className="small fw-medium">{dev.owner_name}</div>
                        <div className="text-muted small">{dev.owner_email}</div>
                      </td>
                      <td>{dev.owner_region || '-'}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-secondary small">
                          <Clock size={12} /> {new Date(dev.latest_report_at).toLocaleString()}
                        </div>
                      </td>
                      <td><span className="text-uppercase small fw-semibold">{dev.latest_report_type}</span></td>
                      <td><span className="fw-semibold">{dev.report_count}</span></td>
                      <td><StatusBadge status={dev.status} /></td>
                      <td className="text-end">
                        <a href={`/lea/devices/${dev.id}`} className="btn-ghost">
                          <Eye size={16} /> View
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredDevices.length === 0 && (
                    <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon"><Smartphone size={32} /></div><h3>No reported devices</h3><p>No devices have been reported in your region yet.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="modern-card">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 fw-semibold">
              <Bell size={18} /> Recent Check Alerts
              <span className="status-badge status-pending">{alerts.length}</span>
            </div>
            <div className="d-flex gap-2">
              <select className="modern-select" style={{ width: 'auto' }} value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="modern-select" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="stolen_check">Stolen Check</option>
                <option value="suspicious">Suspicious</option>
                <option value="standard">Standard</option>
              </select>
              <button onClick={loadData} className="btn-ghost"><RefreshCw size={16} /></button>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-center"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Time</th>
                    <th>Device</th>
                    <th>Identifier</th>
                    <th>Checker</th>
                    <th>Network</th>
                    <th>Location</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map(alert => {
                    const sev = alert.severity || 'low'
                    const cfg = severityConfig[sev]
                    const SevIcon = cfg.icon
                    return (
                      <tr key={alert.id}>
                        <td><span className={`status-badge ${sev === 'critical' ? 'status-stolen' : sev === 'high' ? 'status-pending' : sev === 'medium' ? 'status-verified' : 'status-inactive'}`}><SevIcon size={12} /> {cfg.label}</span></td>
                        <td>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <Clock size={12} /> {new Date(alert.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="fw-semibold">{alert.brand} {alert.model}</td>
                        <td><code className="small">{alert.imei || alert.serial || '-'}</code></td>
                        <td>
                          <div className="small fw-medium">{alert.checker_name || 'Anonymous'}</div>
                          <div className="text-muted small">{alert.checker_email || alert.checker_phone || ''}</div>
                        </td>
                        <td>
                          <div className="small"><Globe size={12} className="me-1" />{alert.ip_address || '-'}</div>
                          <div className="text-muted small"><Monitor size={12} className="me-1" />{alert.mac_address || '-'}</div>
                        </td>
                        <td>
                          <div className="small">
                            <MapPin size={12} className="me-1" />
                            {alert.latitude && alert.longitude ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}` : 'Unknown'}
                          </div>
                          <div className="text-muted small">±{alert.location_accuracy || 'n/a'}m</div>
                        </td>
                        <td className="text-end">
                          <a href={`/device-check-report?checkId=${alert.id}`} className="btn-ghost">
                            <Eye size={16} /> Details
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAlerts.length === 0 && (
                    <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><Bell size={32} /></div><h3>No alerts</h3><p>No check alerts match your current filters.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  )
}
