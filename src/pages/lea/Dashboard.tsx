import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  MapPin,
  Search,
  Plus,
  Activity,
  Clock,
  Bell,
  ChevronRight,
  RefreshCw,
  User,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Layout } from '../../components/Layout'
import { useToast, ToastContainer } from '../../components/Toast'
import { apiClient } from '../../lib/apiClient'

interface LEAStats {
  total_cases: number
  open_cases: number
  under_review_cases: number
  resolved_cases: number
  cases_24h: number
  regional_cases: number
  devices_recovered?: number
  stolen_reports?: number
  loss_reports?: number
  average_resolution_time_days?: number
  cases_last_7_days?: number[]
}

interface Case {
  case_id: string
  device_id: string
  report_type: string
  status: 'open' | 'under_review' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  device_brand?: string
  device_model?: string
  device_imei?: string
  reporter_name?: string
  reporter_email?: string
  location?: string
  description?: string
  notes?: string
}

interface Alert {
  id: string
  type: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: string
  case_id?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function timeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

const severityConfig = {
  urgent: { color: 'var(--danger-500)', bg: 'rgba(239, 68, 68, 0.1)', label: 'Urgent' },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'High' },
  medium: { color: 'var(--warning-500)', bg: 'rgba(245, 158, 11, 0.1)', label: 'Medium' },
  low: { color: 'var(--success-500)', bg: 'rgba(34, 197, 94, 0.1)', label: 'Low' }
}

const priorityConfig = {
  urgent: { color: '#ff4444' },
  high: { color: '#ff8844' },
  medium: { color: '#ffaa44' },
  low: { color: '#44aa44' }
}

export default function LEADashboard() {
  const [stats, setStats] = useState<LEAStats | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, showError } = useToast()

  useEffect(() => { loadLEAData() }, [])

  const loadLEAData = async () => {
    setLoading(true)
    try {
      const [statsResult, casesResult] = await Promise.allSettled([
        apiClient.leaPortal.stats(),
        apiClient.leaPortal.cases({ status: undefined })
      ])

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.stats)
      } else {
        console.error('LEA stats load error:', statsResult.reason)
      }

      if (casesResult.status === 'fulfilled') {
        const caseData = casesResult.value.cases || []
        setCases(caseData)

        const generatedAlerts: Alert[] = caseData
          .filter((c: Case) => c.status === 'open' || c.status === 'under_review')
          .slice(0, 6)
          .map((c: Case) => ({
            id: `alert-${c.case_id}`,
            type: c.report_type,
            title: `${c.report_type === 'stolen' ? 'Theft' : c.report_type === 'lost' ? 'Loss' : 'Found'} Report`,
            description: `${c.device_brand || 'Unknown'} ${c.device_model || 'Device'} - ${c.location || 'Location unknown'}`,
            severity: c.priority as 'low' | 'medium' | 'high' | 'urgent',
            timestamp: c.created_at,
            case_id: c.case_id
          }))
        setAlerts(generatedAlerts)
      } else {
        console.error('LEA cases load error:', casesResult.reason)
      }
    } catch (err) {
      console.error('Error loading LEA data:', err)
      showError('Loading Error', 'Failed to load LEA dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = useMemo(() => [
    {
      label: 'Active Cases',
      value: stats?.open_cases || 0,
      icon: Shield,
      color: 'var(--danger-500)',
      bg: 'rgba(239, 68, 68, 0.1)',
      trend: stats?.cases_24h ? `+${stats.cases_24h} new today` : 'No new cases'
    },
    {
      label: 'Open Alerts',
      value: alerts.length,
      icon: Bell,
      color: 'var(--warning-500)',
      bg: 'rgba(245, 158, 11, 0.1)',
      trend: alerts.length > 0 ? 'Requires attention' : 'All clear'
    },
    {
      label: 'Recovered Devices',
      value: stats?.devices_recovered || 0,
      icon: CheckCircle2,
      color: 'var(--success-500)',
      bg: 'rgba(34, 197, 94, 0.1)',
      trend: stats?.resolved_cases ? `${stats.resolved_cases} resolved` : '--'
    },
    {
      label: 'Pending Investigations',
      value: stats?.under_review_cases || 0,
      icon: FileSearch,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      trend: stats?.average_resolution_time_days ? `Avg ${stats.average_resolution_time_days}d resolution` : '--'
    }
  ], [stats, alerts])

  const formatLabel = (value: string) => (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'lea']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading LEA dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'lea']}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container-fluid px-0"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="page-header">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="d-flex align-items-center gap-2">
                <Shield size={28} style={{ color: 'var(--primary-600)' }} />
                LEA Operations Dashboard
              </h1>
              <p>Law enforcement case management and investigation tools</p>
            </div>
            <div className="d-flex gap-2">
              <button onClick={loadLEAData} className="btn btn-outline-primary d-flex align-items-center gap-2">
                <RefreshCw size={16} />
                Refresh
              </button>
              <Link to="/lea/cases" className="btn-gradient-primary d-flex align-items-center gap-2">
                <FileSearch size={16} />
                All Cases
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="row g-4 mb-4">
          {statCards.map((s) => (
            <div key={s.label} className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                    <s.icon size={22} />
                  </div>
                  <span className="stat-trend" style={{ color: s.trend.startsWith('+') ? 'var(--danger-500)' : 'var(--text-tertiary)' }}>
                    <Activity size={14} />
                    {s.trend}
                  </span>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Case Status Distribution */}
        {stats && (
          <motion.div variants={itemVariants} className="row g-4 mb-4">
            <div className="col-12">
              <div className="modern-card">
                <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Activity size={18} style={{ color: 'var(--primary-600)' }} />
                    <h5 className="mb-0">Case Status Overview</h5>
                  </div>
                </div>
                <div className="p-4">
                  <div className="row g-3">
                    {[
                      { label: 'Open', value: stats.open_cases, color: '#ff6666' },
                      { label: 'Under Review', value: stats.under_review_cases, color: '#ffcc66' },
                      { label: 'Resolved', value: stats.resolved_cases, color: '#66cc66' },
                      { label: 'Dismissed', value: stats.total_cases - stats.open_cases - stats.under_review_cases - stats.resolved_cases, color: '#94a3b8' }
                    ].map((item) => {
                      const total = Math.max(stats.total_cases, 1)
                      const pct = Math.round((Math.max(item.value, 0) / total) * 100)
                      return (
                        <div key={item.label} className="col-6 col-lg-3">
                          <div className="p-4 rounded-3" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-bold" style={{ color: item.color, fontSize: 24 }}>{Math.max(item.value, 0)}</span>
                              <span className="fw-semibold" style={{ color: item.color, fontSize: 13 }}>{pct}%</span>
                            </div>
                            <div className="stat-label mb-0">{item.label}</div>
                            <div className="progress mt-2" style={{ height: 4, background: `${item.color}15` }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, background: item.color, borderRadius: 2 }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="row g-4 mb-4">
          {/* Recent Alerts Feed */}
          <div className="col-lg-5">
            <motion.div variants={itemVariants} className="modern-card h-100">
              <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Bell size={18} style={{ color: 'var(--primary-600)' }} />
                    <div>
                      <h5 className="mb-0">Recent Alerts</h5>
                      <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Open cases requiring attention</p>
                    </div>
                  </div>
                  <Link to="/lea/alerts" className="btn btn-sm btn-ghost d-flex align-items-center gap-1">
                    View All <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="p-4">
                {alerts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <div className="empty-state-icon" style={{ width: 56, height: 56 }}>
                      <CheckCircle2 size={24} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <h3>All clear</h3>
                    <p className="mb-0" style={{ fontSize: 13 }}>No pending alerts at this time.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {alerts.map((alert) => {
                      const sev = severityConfig[alert.severity] || severityConfig.medium
                      return (
                        <div
                          key={alert.id}
                          className="d-flex gap-3 p-3 rounded-3"
                          style={{ background: sev.bg, border: `1px solid ${sev.color}20` }}
                        >
                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{ width: 36, height: 36, background: sev.bg, border: `2px solid ${sev.color}30` }}
                          >
                            <AlertTriangle size={16} style={{ color: sev.color }} />
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <p className="mb-0 fw-medium" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                                {alert.title}
                              </p>
                              <span style={{ color: sev.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                                {sev.label}
                              </span>
                            </div>
                            <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.4 }}>
                              {alert.description}
                            </p>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <Calendar size={11} style={{ color: 'var(--text-tertiary)' }} />
                              <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{timeAgo(alert.timestamp)}</span>
                              {alert.case_id && (
                                <Link to={`/lea/cases/${alert.case_id}`} style={{ color: 'var(--primary-600)', fontSize: 11, textDecoration: 'none' }}>
                                  View case <ArrowRight size={10} style={{ display: 'inline' }} />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Active Cases Table */}
          <div className="col-lg-7">
            <motion.div variants={itemVariants} className="modern-card h-100">
              <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      <FileSearch size={18} style={{ color: 'var(--primary-600)' }} />
                      Active Cases
                    </h5>
                    <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                      {cases.length} total cases
                    </p>
                  </div>
                  <Link to="/lea/cases" className="btn btn-sm btn-ghost d-flex align-items-center gap-1">
                    View All <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Type</th>
                      <th>Device</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state" style={{ padding: 24 }}>
                            <div className="empty-state-icon" style={{ width: 56, height: 56 }}>
                              <FileSearch size={24} />
                            </div>
                            <h3>No cases found</h3>
                            <p>Cases will appear here once reports are filed.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      cases.slice(0, 6).map((c) => (
                        <tr key={c.case_id}>
                          <td className="fw-medium" style={{ fontSize: 13, fontFamily: 'monospace' }}>
                            {c.case_id?.slice(0, 12)}...
                          </td>
                          <td>
                            <span className={`status-badge ${c.report_type === 'stolen' ? 'status-stolen' : c.report_type === 'lost' ? 'status-pending' : 'status-found'}`} style={{ textTransform: 'capitalize' }}>
                              {c.report_type?.replace('_', ' ') || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: 13 }}>
                              {c.device_brand || 'Unknown'} {c.device_model || ''}
                            </div>
                            <small style={{ color: 'var(--text-tertiary)' }}>{c.device_imei || ''}</small>
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                background: `${(priorityConfig[c.priority] || priorityConfig.medium).color}15`,
                                color: (priorityConfig[c.priority] || priorityConfig.medium).color,
                                border: `1px solid ${(priorityConfig[c.priority] || priorityConfig.medium).color}25`,
                                textTransform: 'capitalize'
                              }}
                            >
                              {c.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${c.status === 'open' ? 'status-stolen' : c.status === 'under_review' ? 'status-pending' : c.status === 'resolved' ? 'status-verified' : 'status-inactive'}`} style={{ textTransform: 'capitalize' }}>
                              {c.status?.replace('_', ' ') || 'N/A'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to={`/lea/cases/${c.case_id}`} className="btn btn-sm btn-ghost p-1">
                              <Eye size={15} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="row g-4 mb-4">
          <div className="col-12">
            <div className="modern-card">
              <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                <div className="d-flex align-items-center gap-2">
                  <Activity size={18} style={{ color: 'var(--primary-600)' }} />
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
              </div>
              <div className="p-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <Link to="/lea/device-search"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none text-center"
                      style={{ background: 'rgba(14, 165, 233, 0.04)', border: '1px solid rgba(14, 165, 233, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.08)'; e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.04)'; e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)', width: 44, height: 44 }}>
                        <Search size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Search Device</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>Look up by IMEI or serial</span>
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link to="/lea/report-recovery"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none text-center"
                      style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)'; e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.04)'; e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)', width: 44, height: 44 }}>
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Report Recovery</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>Mark device as recovered</span>
                    </Link>
                  </div>
                  <div className="col-md-4">
                    <Link to="/lea/cases/new"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none text-center"
                      style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 44, height: 44 }}>
                        <Plus size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Create Case</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>Open new investigation</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </motion.div>
    </Layout>
  )
}
