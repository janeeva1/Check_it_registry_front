import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, Smartphone, FileText, Download, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'

interface AnalyticsData {
  overview: {
    total_users: number; total_devices: number; total_reports: number
    recovery_rate: number; user_growth: number; device_growth: number
  }
  trends: {
    user_registrations: Array<{ date: string; count: number }>
    device_registrations: Array<{ date: string; count: number }>
    reports_filed: Array<{ date: string; count: number }>
  }
  demographics: {
    regions: Array<{ name: string; users: number; devices: number }>
    user_types: Array<{ type: string; count: number; percentage: number }>
    device_brands: Array<{ brand: string; count: number; percentage: number }>
  }
  security: {
    theft_reports: number; loss_reports: number
    recovery_success: number; average_recovery_time: number
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'demographics' | 'security'>('overview')
  const { showError } = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAnalyticsData() }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const period = timeRange === '30d' ? '30' : timeRange === '7d' ? '7' : '90'

      const [statsRes, analyticsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin-dashboard/stats`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin-dashboard/analytics?period=${period}`, { headers })
      ])

      if (!statsRes.ok || !analyticsRes.ok) throw new Error('Failed to load analytics')

      const stats = await statsRes.json()
      const analytics = await analyticsRes.json()

      const userRegs = (analytics.user_registrations || []).map((r: any) => ({ date: r.date || r.day || '', count: r.count || r.total || 0 }))
      const deviceRegs = (analytics.device_registrations || []).map((r: any) => ({ date: r.date || r.day || '', count: r.count || r.total || 0 }))
      const reportData = (analytics.reports || []).map((r: any) => ({ date: r.date || r.day || '', count: r.count || r.total || 0 }))
      const brands = (analytics.top_brands || []).map((b: any) => ({ brand: b.brand || b.name || 'Unknown', count: b.count || b.total || 0, percentage: b.percentage || b.percent || 0 }))
      const regions = (analytics.regional_distribution || []).map((r: any) => ({ name: r.region || r.name || 'Unknown', users: r.users || r.users_count || 0, devices: r.devices || r.devices_count || 0 }))

      const devicesByStatus: Record<string, number> = {}
      for (const row of (stats.devices_by_status || [])) {
        if (row?.status) devicesByStatus[row.status] = row.count || 0
      }

      setData({
        overview: {
          total_users: stats.total_users || 0,
          total_devices: stats.total_devices || 0,
          total_reports: stats.total_reports || 0,
          recovery_rate: 0,
          user_growth: stats.new_users_30_days || 0,
          device_growth: stats.new_devices_30_days || 0
        },
        trends: {
          user_registrations: userRegs,
          device_registrations: deviceRegs,
          reports_filed: reportData
        },
        demographics: {
          regions,
          user_types: [],
          device_brands: brands
        },
        security: {
          theft_reports: devicesByStatus['stolen'] || 0,
          loss_reports: devicesByStatus['lost'] || 0,
          recovery_success: 0,
          average_recovery_time: 0
        }
      })
    } catch {
      showError('Loading Error', 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'security', label: 'Security', icon: FileText }
  ]

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} role="status" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
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
                <h1>Analytics & Insights</h1>
                <p>Comprehensive platform analytics and reporting</p>
              </div>
              <div className="d-flex gap-2">
                <select className="modern-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <button onClick={loadAnalyticsData} className="btn-ghost"><RefreshCw size={18} /> Refresh</button>
                <button className="btn-ghost"><Download size={18} /> Export</button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-2 mb-4">
            <div className="d-flex flex-wrap gap-1">
              {tabs.map(tab => {
                const IconComponent = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className="btn-ghost d-flex align-items-center gap-2"
                    style={{
                      background: isActive ? 'var(--primary-500)' : 'transparent',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      borderRadius: 8, padding: '10px 20px'
                    }}>
                    <IconComponent size={18} />
                    <span className="fw-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {data && activeTab === 'overview' && (
            <motion.div variants={itemVariants} className="row g-4 mb-4">
              <div className="col-xl-3 col-md-6">
                <div className="stat-card text-center">
                  <div className="stat-icon mx-auto mb-3" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-value">{data.overview.total_users.toLocaleString()}</div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-trend" style={{ color: 'var(--success-500)' }}>
                    <TrendingUp size={14} /> +{data.overview.user_growth}%
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card text-center">
                  <div className="stat-icon mx-auto mb-3" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                    <Smartphone size={24} />
                  </div>
                  <div className="stat-value">{data.overview.total_devices.toLocaleString()}</div>
                  <div className="stat-label">Registered Devices</div>
                  <div className="stat-trend" style={{ color: 'var(--success-500)' }}>
                    <TrendingUp size={14} /> +{data.overview.device_growth}%
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card text-center">
                  <div className="stat-icon mx-auto mb-3" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)' }}>
                    <FileText size={24} />
                  </div>
                  <div className="stat-value">{data.overview.total_reports.toLocaleString()}</div>
                  <div className="stat-label">Total Reports</div>
                  <small style={{ color: 'var(--text-tertiary)' }}>Theft & Loss Cases</small>
                </div>
              </div>
              <div className="col-xl-3 col-md-6">
                <div className="stat-card text-center">
                  <div className="stat-icon mx-auto mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-value">{data.overview.recovery_rate}%</div>
                  <div className="stat-label">Recovery Rate</div>
                  <small style={{ color: 'var(--text-tertiary)' }}>Success Rate</small>
                </div>
              </div>
            </motion.div>
          )}

          {data && activeTab === 'demographics' && (
            <motion.div variants={itemVariants} className="row g-4">
              <div className="col-lg-6">
                <div className="modern-card p-4">
                  <h3 className="section-title">Regional Distribution</h3>
                  <div className="d-flex flex-column gap-3">
                    {data.demographics.regions.map(region => (
                      <div key={region.name}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ color: 'var(--text-primary)' }}>{region.name}</span>
                          <small style={{ color: 'var(--text-tertiary)' }}>{((region.users / data.overview.total_users) * 100).toFixed(1)}%</small>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div className="progress-bar" style={{ width: `${(region.users / data.overview.total_users) * 100}%`, backgroundColor: 'var(--primary-500)' }} />
                        </div>
                        <small style={{ color: 'var(--text-tertiary)' }}>{region.users.toLocaleString()} users, {region.devices.toLocaleString()} devices</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="modern-card p-4">
                  <h3 className="section-title">User Types</h3>
                  <div className="d-flex flex-column gap-3">
                    {data.demographics.user_types.map(type => (
                      <div key={type.type}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ color: 'var(--text-primary)' }}>{type.type}</span>
                          <small style={{ color: 'var(--text-tertiary)' }}>{type.percentage}%</small>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div className="progress-bar" style={{ width: `${type.percentage}%`, backgroundColor: 'var(--success-500)' }} />
                        </div>
                        <small style={{ color: 'var(--text-tertiary)' }}>{type.count.toLocaleString()} users</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="modern-card p-4">
                  <h3 className="section-title">Popular Device Brands</h3>
                  <div className="row g-4">
                    {data.demographics.device_brands.map((brand, index) => (
                      <div key={brand.brand} className="col-md-2 col-sm-4 col-6">
                        <div className="text-center">
                          <div className="stat-icon mx-auto mb-2" style={{ background: `hsla(${index * 60}, 70%, 90%, 0.5)`, color: `hsl(${index * 60}, 70%, 50%)` }}>
                            <Smartphone size={24} />
                          </div>
                          <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{brand.brand}</div>
                          <small style={{ color: 'var(--text-tertiary)' }}>{brand.count.toLocaleString()} ({brand.percentage}%)</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {data && activeTab === 'security' && (
            <motion.div variants={itemVariants} className="row g-4">
              <div className="col-lg-8">
                <div className="modern-card p-4">
                  <h3 className="section-title">Security Overview</h3>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="text-center p-4 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                        <div className="stat-value" style={{ color: 'var(--danger-500)' }}>{data.security.theft_reports}</div>
                        <div className="stat-label">Theft Reports</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-center p-4 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                        <div className="stat-value" style={{ color: 'var(--warning-500)' }}>{data.security.loss_reports}</div>
                        <div className="stat-label">Loss Reports</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-center p-4 rounded-3" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                        <div className="stat-value" style={{ color: 'var(--success-500)' }}>{data.security.recovery_success}</div>
                        <div className="stat-label">Successful Recoveries</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-center p-4 rounded-3" style={{ background: 'rgba(14, 165, 233, 0.08)' }}>
                        <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{data.security.average_recovery_time}h</div>
                        <div className="stat-label">Avg Recovery Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="modern-card p-4">
                  <h3 className="section-title">Recovery Success Rate</h3>
                  <div className="text-center py-3">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 position-relative"
                      style={{
                        width: 140, height: 140,
                        background: `conic-gradient(var(--success-500) 0deg ${data.overview.recovery_rate * 3.6}deg, var(--gray-200) ${data.overview.recovery_rate * 3.6}deg 360deg)`
                      }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 100, height: 100, background: 'var(--bg-primary)' }}>
                        <span className="h3 mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>{data.overview.recovery_rate}%</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-tertiary)' }}>Overall device recovery success rate</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {data && activeTab === 'trends' && (
            <motion.div variants={itemVariants} className="row g-4">
              {(['user_registrations', 'device_registrations', 'reports_filed'] as const).map((key) => {
                const trendData = data.trends[key]
                const maxVal = Math.max(...trendData.map(d => d.count), 1)
                const labels: Record<string, string> = {
                  user_registrations: 'User Registrations',
                  device_registrations: 'Device Registrations',
                  reports_filed: 'Reports Filed'
                }
                return (
                  <div key={key} className="col-lg-4">
                    <div className="modern-card p-4">
                      <h3 className="section-title">{labels[key]}</h3>
                      <div className="d-flex align-items-end gap-2" style={{ height: 160 }}>
                        {trendData.map((d, i) => (
                          <div key={i} className="flex-grow-1 d-flex flex-column align-items-center" style={{ height: '100%', justifyContent: 'flex-end' }}>
                            <div className="w-100 rounded-top" style={{
                              height: `${(d.count / maxVal) * 100}%`,
                              background: 'linear-gradient(180deg, var(--primary-400), var(--primary-600))',
                              minHeight: 4,
                              borderRadius: '4px 4px 0 0'
                            }} />
                            <small style={{ color: 'var(--text-tertiary)', fontSize: 9, marginTop: 4 }}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
