import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  Smartphone,
  FileText,
  TrendingUp,
  Shield,
  Eye,
  RefreshCw,
  Download,
  Package,
  DollarSign,
  ChevronRight,
  Server,
  Zap,
  PieChart,
  Lock,
  Settings
} from 'lucide-react'
import { Layout } from '../../components/Layout'
import { useToast, ToastContainer } from '../../components/Toast'
import { Link } from 'react-router-dom'
import { getDisplayName } from '../../utils/userHelpers'

interface DashboardStats {
  users: { total: number; new_24h: number; verified: number; growth_rate: number }
  devices: { total: number; new_24h: number; verified: number; stolen: number; lost: number; found: number }
  reports: { total: number; new_24h: number; open: number; resolved: number; under_review: number }
  marketplace: { total_listings: number; active_listings: number; total_sales: number; revenue: number }
  system: { uptime: string; response_time: number; error_rate: number; active_sessions: number }
  escrow: { total_transactions: number; held: number; released: number; disputed: number; refunded: number; total_held_amount: number; total_fees_collected: number }
  platform_fee_percent: string
}

interface RecentRegistration {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monthlyGrowthData, setMonthlyGrowthData] = useState<{ month_label: string; count: number }[]>([])
  const { toasts, removeToast, showSuccess, showError } = useToast()

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
          growth_rate: data.user_growth_rate || 0
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
          resolved: data.resolved_cases || 0,
          under_review: data.under_review_cases || 0
        },
        marketplace: {
          total_listings: data.marketplace?.total_listings || data.total_listings || 0,
          active_listings: data.marketplace?.active_listings || data.active_listings || 0,
          total_sales: data.marketplace?.total_sales || data.total_sales || 0,
          revenue: data.marketplace?.revenue || data.revenue || 0
        },
        system: {
          uptime: data.system_uptime || '99.9%',
          response_time: data.response_time || 0,
          error_rate: data.error_rate || 0,
          active_sessions: data.system_health?.active_users || data.active_sessions || 0
        },
        escrow: data.escrow || { total_transactions: 0, held: 0, released: 0, disputed: 0, refunded: 0, total_held_amount: 0, total_fees_collected: 0 },
        platform_fee_percent: data.platform_fee_percent || '2.50'
      }

      setMonthlyGrowthData(data.monthly_user_growth || [])
      setStats(mapped)

      const usersRes = await fetch(`${API_URL}/admin-portal/users?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const usersData = await usersRes.json().catch(() => ({}))
      if (usersRes.ok && Array.isArray(usersData?.users)) {
        setRecentRegistrations(usersData.users.map((u: any) => ({
          id: u.id,
          name: getDisplayName(u) || u.email,
          email: u.email,
          role: u.role,
          created_at: u.created_at
        })))
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      showError('Loading Error', 'Failed to load admin dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    showSuccess('Refreshed', 'Dashboard data has been updated')
  }

  const healthIndicators = useMemo(() => [
    { label: 'API Response Time', value: `${stats?.system.response_time || 0}ms`, status: (stats?.system.response_time || 0) < 200 ? 'success' : (stats?.system.response_time || 0) < 500 ? 'warning' : 'danger' },
    { label: 'Error Rate', value: `${stats?.system.error_rate || 0}%`, status: (stats?.system.error_rate || 0) < 1 ? 'success' : (stats?.system.error_rate || 0) < 5 ? 'warning' : 'danger' },
    { label: 'Uptime', value: stats?.system.uptime || '--', status: 'success' },
    { label: 'Active Sessions', value: `${stats?.system.active_sessions || 0}`, status: 'info' }
  ], [stats])

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading admin dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
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
              <h1>Admin Dashboard</h1>
              <p>System overview and management controls</p>
            </div>
            <div className="d-flex gap-2">
              <button
                onClick={handleRefresh}
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                disabled={refreshing}
              >
                <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                Refresh
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        {stats && (
          <>
            <motion.div variants={itemVariants} className="row g-4 mb-4">
              <div className="col-6 col-xl">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                      <Users size={22} />
                    </div>
                    <span className="stat-trend" style={{ color: stats.users.growth_rate > 0 ? 'var(--success-500)' : 'var(--text-tertiary)' }}>
                      <TrendingUp size={14} />+{stats.users.growth_rate}%
                    </span>
                  </div>
                  <div className="stat-value">{stats.users.total.toLocaleString()}</div>
                  <div className="stat-label">Total Users</div>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>+{stats.users.new_24h} recent</small>
                </div>
              </div>
              <div className="col-6 col-xl">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                      <Smartphone size={22} />
                    </div>
                    <span className="stat-trend" style={{ color: stats.devices.new_24h > 0 ? 'var(--success-500)' : 'var(--text-tertiary)' }}>
                      <TrendingUp size={14} />+{stats.devices.new_24h}
                    </span>
                  </div>
                  <div className="stat-value">{stats.devices.total.toLocaleString()}</div>
                  <div className="stat-label">Total Devices</div>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{stats.devices.verified} verified</small>
                </div>
              </div>
              <div className="col-6 col-xl">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)' }}>
                      <FileText size={22} />
                    </div>
                  </div>
                  <div className="stat-value">{stats.reports.total.toLocaleString()}</div>
                  <div className="stat-label">Active Reports</div>
                  <small style={{ color: 'var(--danger-500)', fontSize: 11 }}>{stats.reports.open} open</small>
                </div>
              </div>
              <div className="col-6 col-xl">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                      <Package size={22} />
                    </div>
                  </div>
                  <div className="stat-value">{stats.marketplace.active_listings.toLocaleString()}</div>
                  <div className="stat-label">Marketplace Listings</div>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{stats.marketplace.total_listings} total</small>
                </div>
              </div>
              <div className="col-6 col-xl">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                      <DollarSign size={22} />
                    </div>
                  </div>
                  <div className="stat-value">${(stats.marketplace.revenue || 0).toLocaleString()}</div>
                  <div className="stat-label">Revenue</div>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{stats.marketplace.total_sales} sales</small>
                </div>
              </div>
              <div className="col-6 col-xl">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                      <Lock size={22} />
                    </div>
                  </div>
                  <div className="stat-value">₦{Number(stats.escrow.total_held_amount).toLocaleString()}</div>
                  <div className="stat-label">In Escrow</div>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {stats.escrow.total_transactions} transactions · {stats.escrow.released} released
                  </small>
                </div>
              </div>
            </motion.div>

            {/* Charts + Tables Grid */}
            <div className="row g-4 mb-4">
              {/* User Growth Chart */}
              <div className="col-lg-8">
                <motion.div variants={itemVariants}>
                  <div className="modern-card mb-4">
                    <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1 d-flex align-items-center gap-2">
                            <BarChart3 size={18} style={{ color: 'var(--primary-600)' }} />
                            User Growth
                          </h5>
                          <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Registration trends over time</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="d-flex align-items-end gap-2" style={{ height: 160 }}>
                        {(() => {
                          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                          const now = new Date()
                          const chartData: { label: string; count: number }[] = []

                          for (let i = 11; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                            const found = monthlyGrowthData.find((m: any) => m.month_label === key)
                            chartData.push({
                              label: months[d.getMonth()],
                              count: found?.count || 0,
                            })
                          }

                          const maxCount = Math.max(...chartData.map(c => c.count), 1)

                          return chartData.map((c, i) => (
                            <div key={i} className="d-flex flex-column align-items-center flex-grow-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
                              <div
                                style={{
                                  width: '70%',
                                  height: `${Math.max((c.count / maxCount) * 100, c.count > 0 ? 4 : 0)}%`,
                                  background: c.count > 0 ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'var(--gray-200)',
                                  borderRadius: '4px 4px 0 0',
                                  transition: 'height 0.6s ease',
                                }}
                                title={`${c.label}: ${c.count} users`}
                              />
                              <span style={{ color: 'var(--text-tertiary)', fontSize: 10, marginTop: 4 }}>
                                {c.label}
                              </span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Recent Registrations Table */}
                <motion.div variants={itemVariants}>
                  <div className="modern-card">
                    <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1 d-flex align-items-center gap-2">
                            <Users size={18} style={{ color: 'var(--primary-600)' }} />
                            Recent Registrations
                          </h5>
                          <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>New users on the platform</p>
                        </div>
                        <Link to="/user-management" className="btn btn-sm btn-ghost d-flex align-items-center gap-1">
                          View All <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRegistrations.length === 0 ? (
                            <tr>
                              <td colSpan={5}>
                                <div className="empty-state" style={{ padding: 24 }}>
                                  <p className="mb-0">No recent registrations</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            recentRegistrations.slice(0, 5).map((u) => (
                              <tr key={u.id}>
                                <td className="fw-medium">{u.name}</td>
                                <td style={{ color: 'var(--text-tertiary)' }}>{u.email}</td>
                                <td>
                                  <span className={`status-badge ${u.role === 'admin' ? 'status-verified' : u.role === 'business' ? 'status-pending' : 'status-unverified'}`} style={{ textTransform: 'capitalize' }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <Link to={`/admin/users/${u.id}`} className="btn btn-sm btn-ghost p-1">
                                    <Eye size={15} />
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="col-lg-4">
                {/* System Health */}
                <motion.div variants={itemVariants}>
                  <div className="modern-card mb-4">
                    <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <Server size={18} style={{ color: 'var(--primary-600)' }} />
                        <div>
                          <h5 className="mb-0">System Health</h5>
                          <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Infrastructure status</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="d-flex flex-column gap-3">
                        {healthIndicators.map((indicator) => {
                          const statusColors = {
                            success: { dot: 'var(--success-500)', bg: 'rgba(34, 197, 94, 0.1)' },
                            warning: { dot: 'var(--warning-500)', bg: 'rgba(245, 158, 11, 0.1)' },
                            danger: { dot: 'var(--danger-500)', bg: 'rgba(239, 68, 68, 0.1)' },
                            info: { dot: 'var(--primary-500)', bg: 'rgba(14, 165, 233, 0.1)' }
                          }
                          const sc = statusColors[indicator.status as keyof typeof statusColors]
                          return (
                            <div key={indicator.label} className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot }} />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{indicator.label}</span>
                              </div>
                              <span className="fw-semibold" style={{ color: sc.dot, fontSize: 13 }}>{indicator.value}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Management Links */}
                <motion.div variants={itemVariants}>
                  <div className="modern-card">
                    <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                      <div className="d-flex align-items-center gap-2">
                        <Zap size={18} style={{ color: 'var(--primary-600)' }} />
                        <div>
                          <h5 className="mb-0">Quick Management</h5>
                          <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Frequently used tools</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="d-flex flex-column gap-2">
                        <Link to="/user-management" className="btn btn-outline-primary d-flex align-items-center gap-3 text-start w-100" style={{ justifyContent: 'flex-start' }}>
                          <Users size={18} />
                          <div>
                            <div className="fw-medium" style={{ fontSize: 13 }}>Manage Users</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Roles and permissions</small>
                          </div>
                        </Link>
                        <Link to="/admin/devices" className="btn btn-outline-primary d-flex align-items-center gap-3 text-start w-100" style={{ justifyContent: 'flex-start' }}>
                          <Smartphone size={18} />
                          <div>
                            <div className="fw-medium" style={{ fontSize: 13 }}>Device Management</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>View all registered devices</small>
                          </div>
                        </Link>
                        <Link to="/analytics" className="btn btn-outline-primary d-flex align-items-center gap-3 text-start w-100" style={{ justifyContent: 'flex-start' }}>
                          <PieChart size={18} />
                          <div>
                            <div className="fw-medium" style={{ fontSize: 13 }}>View Analytics</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Reports and insights</small>
                          </div>
                        </Link>
                        <Link to="/audit-trail" className="btn btn-outline-primary d-flex align-items-center gap-3 text-start w-100" style={{ justifyContent: 'flex-start' }}>
                          <Shield size={18} />
                          <div>
                            <div className="fw-medium" style={{ fontSize: 13 }}>Audit Trail</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Security logs</small>
                          </div>
                        </Link>
                        <Link to="/admin/reports" className="btn btn-outline-primary d-flex align-items-center gap-3 text-start w-100" style={{ justifyContent: 'flex-start' }}>
                          <FileText size={18} />
                          <div>
                            <div className="fw-medium" style={{ fontSize: 13 }}>Report Management</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Review filed reports</small>
                          </div>
                        </Link>
                        <Link to="/admin/system-settings" className="btn btn-outline-primary d-flex align-items-center gap-3 text-start w-100" style={{ justifyContent: 'flex-start' }}>
                          <Settings size={18} />
                          <div>
                            <div className="fw-medium" style={{ fontSize: 13 }}>System Settings</div>
                            <small style={{ color: 'var(--text-tertiary)' }}>Platform fee, features, security</small>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Device Status Breakdown */}
            <motion.div variants={itemVariants} className="row g-4 mb-4">
              <div className="col-12">
                <div className="modern-card">
                  <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <PieChart size={18} style={{ color: 'var(--primary-600)' }} />
                      <h5 className="mb-0">Device Status Distribution</h5>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="row g-3">
                      {[
                        { label: 'Verified', value: stats.devices.verified, color: 'var(--success-500)', bg: 'rgba(34, 197, 94, 0.1)' },
                        { label: 'Stolen', value: stats.devices.stolen, color: 'var(--danger-500)', bg: 'rgba(239, 68, 68, 0.1)' },
                        { label: 'Lost', value: stats.devices.lost, color: 'var(--warning-500)', bg: 'rgba(245, 158, 11, 0.1)' },
                        { label: 'Found', value: stats.devices.found, color: 'var(--primary-500)', bg: 'rgba(14, 165, 233, 0.1)' }
                      ].map((item) => {
                        const total = stats.devices.total || 1
                        const pct = Math.round((item.value / total) * 100)
                        return (
                          <div key={item.label} className="col-6 col-lg-3">
                            <div className="p-4 rounded-3" style={{ background: item.bg, border: `1px solid ${item.color}20` }}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-semibold" style={{ color: item.color, fontSize: 22 }}>{item.value}</span>
                                <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                              </div>
                              <div className="stat-label mb-0">{item.label}</div>
                              <div className="progress mt-2" style={{ height: 4, background: `${item.color}20` }}>
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

            {/* Escrow Status Breakdown */}
            <motion.div variants={itemVariants} className="row g-4 mb-4">
              <div className="col-12">
                <div className="modern-card">
                  <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <Lock size={18} style={{ color: '#6366f1' }} />
                      <h5 className="mb-0">Escrow Transactions</h5>
                      <span className="badge ms-2" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 500 }}>
                        {stats.platform_fee_percent}% fee
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="row g-3">
                      {[
                        { label: 'Held', value: stats.escrow.held, color: 'var(--warning-500)', bg: 'rgba(245, 158, 11, 0.1)', amount: stats.escrow.total_held_amount },
                        { label: 'Released', value: stats.escrow.released, color: 'var(--success-500)', bg: 'rgba(34, 197, 94, 0.1)', amount: null },
                        { label: 'Disputed', value: stats.escrow.disputed, color: 'var(--danger-500)', bg: 'rgba(239, 68, 68, 0.1)', amount: null },
                        { label: 'Refunded', value: stats.escrow.refunded, color: 'var(--text-secondary)', bg: 'rgba(100, 116, 139, 0.1)', amount: null },
                      ].map((item) => {
                        const total = stats.escrow.total_transactions || 1
                        const pct = Math.round((item.value / total) * 100)
                        return (
                          <div key={item.label} className="col-6 col-lg-3">
                            <div className="p-4 rounded-3" style={{ background: item.bg, border: `1px solid ${item.color}20` }}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-semibold" style={{ color: item.color, fontSize: 22 }}>{item.value}</span>
                                <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                              </div>
                              <div className="stat-label mb-0">{item.label}</div>
                              {item.amount !== null && (
                                <small style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                  ₦{Number(item.amount).toLocaleString()} locked
                                </small>
                              )}
                              <div className="progress mt-2" style={{ height: 4, background: `${item.color}20` }}>
                                <div className="progress-bar" style={{ width: `${pct}%`, background: item.color, borderRadius: 2 }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {stats.escrow.total_fees_collected > 0 && (
                      <div className="mt-3 p-3 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Total Platform Fees Collected</span>
                          <span style={{ color: 'var(--success-500)', fontWeight: 600 }}>₦{Number(stats.escrow.total_fees_collected).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </motion.div>
    </Layout>
  )
}
