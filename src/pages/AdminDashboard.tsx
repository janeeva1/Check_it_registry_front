import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Smartphone, FileText, AlertTriangle, CheckCircle, TrendingUp, Activity, Shield, Eye, RefreshCw, BarChart3, ArrowRight, Clock, UserPlus, Settings } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { Link } from 'react-router-dom'

interface DashboardStats {
  users: { total: number; new_24h: number; verified: number; growth_rate: number }
  devices: { total: number; new_24h: number; verified: number; stolen: number; lost: number; found: number }
  reports: { total: number; new_24h: number; open: number; resolved: number; under_review: number }
  system: { uptime: string; response_time: number; error_rate: number; active_sessions: number }
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'device_registration' | 'report_filed' | 'device_verified' | 'system_alert'
  description: string
  timestamp: string
  user?: string
  severity?: 'low' | 'medium' | 'high'
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { showSuccess, showError } = useToast()

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDashboardData() }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')

      const res = await fetch(`${API_URL}/admin-dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load admin statistics')

      const devicesByStatus: Record<string, number> = {}
      for (const row of (data.devices_by_status || [])) {
        if (row?.status) devicesByStatus[row.status] = row.count || 0
      }

      const mapped: DashboardStats = {
        users: {
          total: data.total_users || 0,
          new_24h: data.new_users_30_days || 0,
          verified: 0,
          growth_rate: 0
        },
        devices: {
          total: data.total_devices || 0,
          new_24h: data.new_devices_30_days || 0,
          verified: devicesByStatus['verified'] || 0,
          stolen: devicesByStatus['stolen'] || 0,
          lost: devicesByStatus['lost'] || 0,
          found: devicesByStatus['found'] || 0
        },
        reports: {
          total: data.total_reports || 0,
          new_24h: 0,
          open: data.active_cases || 0,
          resolved: 0,
          under_review: 0
        },
        system: {
          uptime: '\u2014',
          response_time: 0,
          error_rate: 0,
          active_sessions: 0
        }
      }
      setStats(mapped)

      const reportsRes = await fetch(`${API_URL}/admin-dashboard/reports?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const reportsData = await reportsRes.json().catch(() => ({}))
      if (reportsRes.ok && Array.isArray(reportsData?.reports)) {
        const activities: RecentActivity[] = reportsData.reports.map((r: any) => {
          const severity: 'low' | 'medium' | 'high' =
            r.report_type === 'stolen' ? 'high' : r.report_type === 'lost' ? 'medium' : 'low'
          return {
            id: r.id,
            type: 'report_filed',
            description: `New ${r.report_type} report for ${r.brand ?? ''} ${r.model ?? ''} (${r.case_id})`,
            timestamp: r.created_at,
            user: r.reporter_name || r.owner_name || 'Unknown',
            severity
          }
        })
        setRecentActivity(activities)
      }
    } catch (err) {
      showError('Loading Error', err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    showSuccess('Data Refreshed', 'Dashboard data has been updated')
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return UserPlus
      case 'device_registration': return Smartphone
      case 'report_filed': return FileText
      case 'device_verified': return CheckCircle
      case 'system_alert': return AlertTriangle
      default: return Activity
    }
  }

  const getActivityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'var(--danger-500)'
      case 'medium': return 'var(--warning-500)'
      case 'low': return 'var(--success-500)'
      default: return 'var(--primary-500)'
    }
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading admin dashboard...</p>
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
                <h1>Admin Dashboard</h1>
                <p>System overview and management controls</p>
              </div>
              <div className="d-flex gap-2">
                <button onClick={handleRefresh} className="btn-ghost" disabled={refreshing}>
                  <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {stats && (
            <>
              <motion.div variants={itemVariants} className="row g-4 mb-4">
                <div className="col-xl-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                        <Users size={24} />
                      </div>
                      <span className="stat-trend" style={{ color: 'var(--success-500)' }}>
                        <TrendingUp size={14} /> +{stats.users.growth_rate}%
                      </span>
                    </div>
                    <div className="stat-value">{stats.users.total.toLocaleString()}</div>
                    <div className="stat-label">Total Users</div>
                    <small style={{ color: 'var(--text-tertiary)' }}>+{stats.users.new_24h} new today</small>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                        <Smartphone size={24} />
                      </div>
                    </div>
                    <div className="stat-value">{stats.devices.total.toLocaleString()}</div>
                    <div className="stat-label">Registered Devices</div>
                    <small style={{ color: 'var(--text-tertiary)' }}>+{stats.devices.new_24h} new today</small>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)' }}>
                        <FileText size={24} />
                      </div>
                    </div>
                    <div className="stat-value">{stats.reports.total.toLocaleString()}</div>
                    <div className="stat-label">Total Reports</div>
                    <small style={{ color: 'var(--text-tertiary)' }}>{stats.reports.open} open cases</small>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                        <Activity size={24} />
                      </div>
                    </div>
                    <div className="stat-value">{stats.system.uptime}</div>
                    <div className="stat-label">System Uptime</div>
                    <small style={{ color: 'var(--text-tertiary)' }}>{stats.system.active_sessions} active sessions</small>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="row g-4 mb-4">
                <div className="col-lg-6">
                  <div className="modern-card p-4">
                    <h3 className="section-title">Device Status Overview</h3>
                    <div className="d-flex flex-column gap-3">
                      {[
                        { label: 'Verified', value: stats.devices.verified, color: 'var(--success-500)' },
                        { label: 'Stolen', value: stats.devices.stolen, color: 'var(--danger-500)' },
                        { label: 'Lost', value: stats.devices.lost, color: 'var(--warning-500)' },
                        { label: 'Found', value: stats.devices.found, color: 'var(--primary-500)' },
                      ].map(item => (
                        <div key={item.label} className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-2" style={{ width: 12, height: 12, backgroundColor: item.color }} />
                            <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                          </div>
                          <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="modern-card p-4">
                    <h3 className="section-title">System Performance</h3>
                    <div className="d-flex flex-column gap-4">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span style={{ color: 'var(--text-primary)' }}>Response Time</span>
                          <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{stats.system.response_time}ms</span>
                        </div>
                        <div className="progress" style={{ height: 8 }}>
                          <div className="progress-bar" style={{ width: '75%', backgroundColor: 'var(--success-500)' }} />
                        </div>
                      </div>
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span style={{ color: 'var(--text-primary)' }}>Error Rate</span>
                          <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{stats.system.error_rate}%</span>
                        </div>
                        <div className="progress" style={{ height: 8 }}>
                          <div className="progress-bar" style={{ width: '2%', backgroundColor: 'var(--success-500)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="row g-4 mb-5">
                <div className="col-lg-4">
                  <div className="modern-card p-4">
                    <h3 className="section-title">Quick Actions</h3>
                    <div className="d-flex flex-column gap-3">
                      <Link to="/user-management" className="btn-ghost w-100 justify-content-start text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)', width: 40, height: 40 }}>
                            <Users size={18} />
                          </div>
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>Manage Users</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>User roles and permissions</small>
                          </div>
                          <ArrowRight size={16} className="ms-auto" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </Link>
                      <Link to="/analytics" className="btn-ghost w-100 justify-content-start text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)', width: 40, height: 40 }}>
                            <BarChart3 size={18} />
                          </div>
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>View Analytics</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Detailed reports and insights</small>
                          </div>
                          <ArrowRight size={16} className="ms-auto" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </Link>
                      <Link to="/audit-trail" className="btn-ghost w-100 justify-content-start text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)', width: 40, height: 40 }}>
                            <Shield size={18} />
                          </div>
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>Audit Trail</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>System logs and security</small>
                          </div>
                          <ArrowRight size={16} className="ms-auto" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </Link>
                      <Link to="/admin/system-settings" className="btn-ghost w-100 justify-content-start text-start p-3" style={{ borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 40, height: 40 }}>
                            <Settings size={18} />
                          </div>
                          <div>
                            <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>System Settings</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Platform configuration</small>
                          </div>
                          <ArrowRight size={16} className="ms-auto" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="modern-card p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h3 className="section-title mb-0">Recent Activity</h3>
                      <Link to="/audit-trail" className="btn-ghost">
                        <Eye size={16} />
                        View All
                      </Link>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {recentActivity.map((activity, index) => {
                        const IconComponent = getActivityIcon(activity.type)
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="d-flex align-items-center gap-3 p-3 rounded-3"
                            style={{ background: 'var(--bg-tertiary)' }}
                          >
                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                              style={{ width: 36, height: 36, background: `${getActivityColor(activity.severity)}20` }}>
                              <IconComponent size={16} style={{ color: getActivityColor(activity.severity) }} />
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-medium" style={{ color: 'var(--text-primary)' }}>{activity.description}</p>
                              <div className="d-flex align-items-center gap-2">
                                {activity.user && <small style={{ color: 'var(--text-tertiary)' }}>by {activity.user}</small>}
                                <div className="d-flex align-items-center gap-1">
                                  <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
                                  <small style={{ color: 'var(--text-tertiary)' }}>
                                    {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                      {recentActivity.length === 0 && (
                        <div className="empty-state py-4">
                          <div className="empty-state-icon" style={{ width: 60, height: 60 }}>
                            <Activity size={24} />
                          </div>
                          <h3 style={{ fontSize: 16 }}>No recent activity</h3>
                          <p>Activity feed will appear here as events occur.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
