import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Search, User, Activity, AlertTriangle, CheckCircle, Info, Download, RefreshCw, Eye, Clock, MapPin, X } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

interface AuditLog {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_role: string
  action: string
  resource_type: 'user' | 'device' | 'report' | 'system' | 'auth'
  resource_id?: string
  details: string
  ip_address: string
  user_agent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failed' | 'warning'
}

interface AuditStats {
  total_events: number; events_24h: number; critical_events: number
  failed_actions: number; unique_users: number
  top_actions: Array<{ action: string; count: number }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AuditTrail() {
  const location = useLocation()
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const { showError } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ''
    const resource = params.get('resource') || params.get('resource_type') || ''
    const dr = params.get('dr') || ''
    if (q) setSearchTerm(q)
    if (resource) setResourceFilter(resource)
    if (dr) setDateRange(dr)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAuditData() }, [dateRange])

  const loadAuditData = async () => {
    try {
      setLoading(true)
      const now = new Date()
      const start = new Date(now)
      const periodDays = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      start.setDate(now.getDate() - periodDays)
      const start_date = start.toISOString().slice(0, 10)
      const end_date = now.toISOString().slice(0, 10)

      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')

      const params = new URLSearchParams()
      params.append('limit', '50')
      params.append('start_date', start_date)
      params.append('end_date', end_date)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (severityFilter !== 'all') params.append('severity', severityFilter)
      if (resourceFilter !== 'all') params.append('resource_type', resourceFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const base = `${import.meta.env.VITE_API_BASE_URL || ''}/api/audit-trail`
      const logsPath = user?.role === 'admin' ? '/logs' : user?.role === 'lea' ? '/lea/logs' : '/my/logs'

      const res = await fetch(`${base}${logsPath}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const json = await res.json()
      const logs: AuditLog[] = (json?.logs || []).map((l: any) => ({
        id: String(l.id), timestamp: l.created_at,
        user_id: String(l.user_id || ''), user_name: l.user_name || 'Unknown',
        user_role: l.user_role || 'system', action: l.action,
        resource_type: l.resource_type, resource_id: l.resource_id,
        details: l.details || '', ip_address: l.ip_address || '',
        user_agent: l.user_agent || '',
        severity: (l.severity || 'low') as AuditLog['severity'],
        status: (l.status || 'success') as AuditLog['status']
      }))
      setAuditLogs(logs)

      if (user?.role === 'admin') {
        const resStats = await fetch(`${base}/stats?period=${periodDays}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (resStats.ok) {
          const statsJson = await resStats.json()
          const overview = statsJson?.overview || {}
          const topActions = (statsJson?.top_actions || []).map((a: any) => ({ action: a.action, count: a.count }))
          setStats({
            total_events: overview.total_events || 0, events_24h: overview.events_24h || 0,
            critical_events: overview.critical_events || 0, failed_actions: overview.failed_actions || 0,
            unique_users: overview.unique_users || 0, top_actions: topActions
          })
        }
      } else {
        const total = logs.length
        const events24h = logs.filter(l => Date.now() - new Date(l.timestamp).getTime() <= 24 * 60 * 60 * 1000).length
        const critical = logs.filter(l => l.severity === 'critical').length
        const failed = logs.filter(l => l.status === 'failed').length
        const uniqueUsers = new Set(logs.map(l => l.user_id)).size
        setStats({ total_events: total, events_24h: events24h, critical_events: critical, failed_actions: failed, unique_users: uniqueUsers, top_actions: [] })
      }
    } catch {
      showError('Loading Error', 'Failed to load audit trail data')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    return matchesSearch && matchesSeverity && matchesResource && matchesStatus
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'var(--danger-500)'
      case 'high': return 'var(--warning-500)'
      case 'medium': return 'var(--primary-500)'
      case 'low': return 'var(--success-500)'
      default: return 'var(--gray-500)'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'failed': return AlertTriangle
      case 'warning': return Info
      default: return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'var(--success-500)'
      case 'failed': return 'var(--danger-500)'
      case 'warning': return 'var(--warning-500)'
      default: return 'var(--gray-500)'
    }
  }

  const formatAction = (action: string) => action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading audit trail...</p>
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
                <h1>Audit Trail</h1>
                <p>System activity logs and security monitoring</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <select className="modern-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button onClick={loadAuditData} className="btn-ghost"><RefreshCw size={18} /> Refresh</button>
                <button className="btn-ghost"><Download size={18} /> Export</button>
              </div>
            </div>
          </motion.div>

          {stats && (
            <motion.div variants={itemVariants} className="row g-4 mb-4">
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                    <Activity size={24} />
                  </div>
                  <div className="stat-value">{stats.total_events.toLocaleString()}</div>
                  <div className="stat-label">Total Events</div>
                  <small style={{ color: 'var(--success-500)' }}>+{stats.events_24h} today</small>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="stat-value">{stats.critical_events}</div>
                  <div className="stat-label">Critical Events</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                    <Shield size={24} />
                  </div>
                  <div className="stat-value">{stats.failed_actions}</div>
                  <div className="stat-label">Failed Actions</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card">
                  <div className="stat-icon mb-3" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                    <User size={24} />
                  </div>
                  <div className="stat-value">{stats.unique_users.toLocaleString()}</div>
                  <div className="stat-label">Active Users</div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-3 col-md-6">
                <label className="form-label d-flex align-items-center gap-2"><Search size={16} /> Search Logs</label>
                <input type="text" className="modern-input" placeholder="Search by user, action, or details..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Severity</label>
                <select className="modern-select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Resource</label>
                <select className="modern-select" value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
                  <option value="all">All Resources</option>
                  <option value="user">Users</option>
                  <option value="device">Devices</option>
                  <option value="report">Reports</option>
                  <option value="auth">Authentication</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Status</label>
                <select className="modern-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
              <div className="col-lg-3 col-md-12">
                <button onClick={() => { setSearchTerm(''); setSeverityFilter('all'); setResourceFilter('all'); setStatusFilter('all') }} className="btn-ghost w-100 text-center">
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
              <h3 className="h5 mb-0" style={{ color: 'var(--text-primary)' }}>Audit Logs ({filteredLogs.length})</h3>
            </div>
            <div className="p-4">
              {filteredLogs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Shield size={32} /></div>
                  <h3>No audit logs found</h3>
                  <p>Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  <AnimatePresence>
                    {filteredLogs.map((log, index) => {
                      const _StatusIcon = getStatusIcon(log.status)
                      return (
                        <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                          className="p-4 rounded-3" style={{ borderLeft: `4px solid ${getSeverityColor(log.severity)}`, background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                          <div className="d-flex align-items-start gap-3">
                            <div className="position-relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                              <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>
                                {getInitials(log.user_name)}
                              </div>
                              <span className="position-absolute rounded-circle" style={{ width: 10, height: 10, right: -1, bottom: -1, border: '2px solid var(--bg-primary)', backgroundColor: getStatusColor(log.status) }} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1" style={{ color: 'var(--text-primary)' }}>{formatAction(log.action)}</h6>
                                  <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="status-badge" style={{ backgroundColor: `${getSeverityColor(log.severity)}15`, color: getSeverityColor(log.severity), border: `1px solid ${getSeverityColor(log.severity)}30`, fontSize: 11, padding: '2px 8px' }}>
                                      {log.severity.toUpperCase()}
                                    </span>
                                    <span className="status-badge" style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', fontSize: 11, padding: '2px 8px' }}>
                                      {log.resource_type.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    <small style={{ color: 'var(--text-tertiary)' }}>{new Date(log.timestamp).toLocaleString()}</small>
                                  </div>
                                  <button onClick={() => { setSelectedLog(log); setShowDetails(true) }} className="btn-ghost">
                                    <Eye size={14} /> Details
                                  </button>
                                </div>
                              </div>
                              <p className="mb-2" style={{ color: 'var(--text-primary)' }}>{log.details}</p>
                              <div className="d-flex flex-wrap gap-3">
                                <div className="d-flex align-items-center gap-1">
                                  <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                                  <small style={{ color: 'var(--text-tertiary)' }}>{log.user_name} ({log.user_role})</small>
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                  <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                                  <small style={{ color: 'var(--text-tertiary)' }}>{log.ip_address}</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDetails && selectedLog && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ maxWidth: 560 }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h3>Audit Log Details</h3>
                <button onClick={() => setShowDetails(false)} className="btn-ghost p-1"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Timestamp</label>
                    <p style={{ color: 'var(--text-primary)' }}>{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Action</label>
                    <p style={{ color: 'var(--text-primary)' }}>{formatAction(selectedLog.action)}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">User</label>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedLog.user_name} ({selectedLog.user_role})</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Resource Type</label>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedLog.resource_type}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">IP Address</label>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedLog.ip_address}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Severity</label>
                    <span className="status-badge" style={{ backgroundColor: `${getSeverityColor(selectedLog.severity)}15`, color: getSeverityColor(selectedLog.severity), border: `1px solid ${getSeverityColor(selectedLog.severity)}30` }}>
                      {selectedLog.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Details</label>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedLog.details}</p>
                  </div>
                  <div className="col-12">
                    <label className="form-label">User Agent</label>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{selectedLog.user_agent}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowDetails(false)} className="btn-ghost">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
