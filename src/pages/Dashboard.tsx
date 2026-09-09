import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Shield,
  AlertTriangle,
  CheckCircle,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  Search,
  FileText,
  Eye,
  Bell,
  Settings,
  MapPin,
  Calendar,
  Package,
  BarChart3,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

import { Device, Report } from '../types/database'
import { useToast, ToastContainer } from '../components/Toast'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { getDisplayName, getUserInitials } from '../utils/userHelpers'

interface RecentActivity {
  id: string
  type: 'device_registered' | 'device_verified' | 'report_filed' | 'device_found' | 'system_alert'
  title: string
  description: string
  timestamp: string
  icon: string
  severity: 'low' | 'medium' | 'high'
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toasts, removeToast, showError, showWarning: _showWarning } = useToast()

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const [devicesRes, reportsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/device-management`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/report-management`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ])

      if (devicesRes && devicesRes.ok) {
        try {
          const devicesData = await devicesRes.json()
          setDevices(Array.isArray(devicesData) ? devicesData : [])
        } catch {
          setDevices([])
        }
      } else {
        setDevices([])
      }

      if (reportsRes && reportsRes.ok) {
        try {
          const reportsData = await reportsRes.json()
          setReports(Array.isArray(reportsData) ? reportsData : [])
        } catch {
          setReports([])
        }
      } else {
        setReports([])
      }

      setRecentActivity([])

      if (!devicesRes || !devicesRes.ok) {
        setError('Unable to load dashboard data. Please check your connection and try again.')
      }
    } catch (err) {
      console.error('Error loading data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      showError('Loading Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => ({
    registered: devices.length,
    verified: devices.filter(d => d.status === 'verified').length,
    reports: reports.length,
    activeListings: 0
  }), [devices, reports])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'device_registered': return Smartphone
      case 'device_verified': return Shield
      case 'report_filed': return FileText
      case 'device_found': return MapPin
      case 'system_alert': return AlertTriangle
      default: return Activity
    }
  }

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'var(--danger-500)'
      case 'medium': return 'var(--warning-500)'
      case 'low': return 'var(--success-500)'
      default: return 'var(--primary-500)'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return 'status-verified'
      case 'unverified': return 'status-unverified'
      case 'stolen': case 'lost': return 'status-stolen'
      case 'found': return 'status-found'
      default: return 'status-pending'
    }
  }

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return { icon: CheckCircle, color: 'var(--success-500)' }
      case 'unverified': return { icon: Clock, color: 'var(--warning-500)' }
      case 'stolen': return { icon: AlertTriangle, color: 'var(--danger-500)' }
      case 'lost': return { icon: Search, color: 'var(--warning-500)' }
      case 'found': return { icon: Shield, color: 'var(--primary-500)' }
      default: return { icon: Activity, color: 'var(--gray-500)' }
    }
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <AlertTriangle size={48} style={{ color: 'var(--danger-500)' }} className="mb-3" />
            <h3 className="h5 mb-3" style={{ color: 'var(--text-primary)' }}>Unable to load dashboard</h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button
              onClick={loadData}
              className="btn-gradient-primary d-flex align-items-center gap-2 mx-auto"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </motion.div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </Layout>
    )
  }

  const greeting = getGreeting()
  const verifiedPct = devices.length > 0 ? Math.round((stats.verified / devices.length) * 100) : 0

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
              <h1 className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 700
                  }}
                >
                  {getUserInitials(user) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span>
                  {greeting}, {getDisplayName(user) || user?.email || 'User'}!
                </span>
              </h1>
              <p>
                {user?.role === 'admin' ? 'System administrator overview' :
                 user?.role === 'business' ? 'Business performance at a glance' :
                 user?.role === 'lea' ? 'Law enforcement operations dashboard' :
                 'Your device protection overview'}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/notifications" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <Bell size={16} />
                <span className="d-none d-sm-inline">Notifications</span>
              </Link>
              <Link to="/profile" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                <Settings size={16} />
                <span className="d-none d-sm-inline">Settings</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="row g-4 mb-4">
          <div className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)' }}>
                  <Smartphone size={22} />
                </div>
                <span className="stat-trend" style={{ color: 'var(--success-500)' }}>
                  <TrendingUp size={14} />
                  {devices.length > 0 ? '+1' : '0'}
                </span>
              </div>
              <div className="stat-value">{stats.registered}</div>
              <div className="stat-label">Registered Devices</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                  <Shield size={22} />
                </div>
                <span className="stat-trend" style={{ color: verifiedPct > 50 ? 'var(--success-500)' : 'var(--warning-500)' }}>
                  <BarChart3 size={14} />
                  {verifiedPct}%
                </span>
              </div>
              <div className="stat-value">{stats.verified}</div>
              <div className="stat-label">Verified Devices</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)' }}>
                  <FileText size={22} />
                </div>
                <span className="stat-trend" style={{ color: stats.reports > 0 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                  <Activity size={14} />
                  {stats.reports > 0 ? `${stats.reports} active` : 'None'}
                </span>
              </div>
              <div className="stat-value">{stats.reports}</div>
              <div className="stat-label">Reports Filed</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <Package size={22} />
                </div>
                <span className="stat-trend" style={{ color: 'var(--text-tertiary)' }}>
                  <TrendingUp size={14} />
                  --
                </span>
              </div>
              <div className="stat-value">{stats.activeListings}</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </div>
        </motion.div>

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
                  <div className="col-6 col-lg-3">
                    <Link to="/register-device"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none"
                      style={{ background: 'rgba(14, 165, 233, 0.04)', border: '1px solid rgba(14, 165, 233, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.08)'; e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.04)'; e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-600)', width: 44, height: 44 }}>
                        <Plus size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Register Device</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center' }}>Add a new device</span>
                    </Link>
                  </div>
                  <div className="col-6 col-lg-3">
                    <Link to="/device-check"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none"
                      style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)'; e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.04)'; e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)', width: 44, height: 44 }}>
                        <Search size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Check Device</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center' }}>Scan & verify status</span>
                    </Link>
                  </div>
                  <div className="col-6 col-lg-3">
                    <Link to="/report-incident"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none"
                      style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.04)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)', width: 44, height: 44 }}>
                        <AlertTriangle size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Report Incident</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center' }}>Theft or loss</span>
                    </Link>
                  </div>
                  <div className="col-6 col-lg-3">
                    <Link to="/marketplace/browse"
                      className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 text-decoration-none"
                      style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.12)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.12)' }}
                    >
                      <div className="stat-icon mb-2" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 44, height: 44 }}>
                        <Package size={20} />
                      </div>
                      <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>Browse Marketplace</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center' }}>Buy & sell devices</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="row g-4 mb-4">
          {/* Device Overview Chart & Activity */}
          <div className="col-lg-8">
            <motion.div variants={itemVariants}>
              <div className="modern-card mb-4">
                <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1 d-flex align-items-center gap-2">
                        <BarChart3 size={18} style={{ color: 'var(--primary-600)' }} />
                        Device Overview
                      </h5>
                      <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Status distribution across your devices</p>
                    </div>
                    <Link to="/my-devices" className="btn btn-sm btn-ghost d-flex align-items-center gap-1">
                      View All <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="p-4">
                  {devices.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <div className="empty-state-icon">
                        <BarChart3 size={32} />
                      </div>
                      <h3>No device data yet</h3>
                      <p>Register your first device to see analytics here.</p>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex gap-4 mb-4 flex-wrap">
                        {['verified', 'unverified', 'stolen', 'lost', 'found'].map(status => {
                          const count = devices.filter(d => d.status === status).length
                          const _pct = Math.round((count / devices.length) * 100)
                          const colors: Record<string, string> = {
                            verified: 'var(--success-500)',
                            unverified: 'var(--warning-500)',
                            stolen: 'var(--danger-500)',
                            lost: 'var(--accent-500)',
                            found: 'var(--primary-500)'
                          }
                          const labels: Record<string, string> = {
                            verified: 'Verified',
                            unverified: 'Unverified',
                            stolen: 'Stolen',
                            lost: 'Lost',
                            found: 'Found'
                          }
                          return (
                            <div key={status} className="d-flex align-items-center gap-2">
                              <span style={{ width: 10, height: 10, borderRadius: 4, background: colors[status] }} />
                              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{labels[status]}</span>
                              <span className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>{count}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="d-flex align-items-end gap-1" style={{ height: 120 }}>
                        {['verified', 'unverified', 'stolen', 'lost', 'found'].map(status => {
                          const count = devices.filter(d => d.status === status).length
                          const barPct = devices.length > 0 ? (count / devices.length) * 100 : 0
                          const colors: Record<string, string> = {
                            verified: 'linear-gradient(180deg, #22c55e, #16a34a)',
                            unverified: 'linear-gradient(180deg, #f59e0b, #d97706)',
                            stolen: 'linear-gradient(180deg, #f43f5e, #e11d48)',
                            lost: 'linear-gradient(180deg, #6366f1, #4f46e5)',
                            found: 'linear-gradient(180deg, #0ea5e9, #0284c7)'
                          }
                          return (
                            <div key={status} className="d-flex flex-column align-items-center flex-grow-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
                              <div
                                style={{
                                  width: '60%',
                                  height: `${barPct}%`,
                                  background: colors[status],
                                  borderRadius: '6px 6px 0 0',
                                  transition: 'height 0.6s ease'
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Reports Table */}
              <motion.div variants={itemVariants}>
                <div className="modern-card">
                  <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-1 d-flex align-items-center gap-2">
                          <FileText size={18} style={{ color: 'var(--primary-600)' }} />
                          Recent Reports
                        </h5>
                        <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Your latest filed reports</p>
                      </div>
                      <Link to="/reports" className="btn btn-sm btn-ghost d-flex align-items-center gap-1">
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
                          <th>Status</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className="empty-state" style={{ padding: '24px' }}>
                                <p className="mb-0">No reports filed yet.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          reports.slice(0, 5).map((report) => (
                            <tr key={report.id}>
                              <td className="fw-medium">{report.case_id}</td>
                              <td>
                                <span className={`status-badge ${getStatusBadge(report.report_type)} text-capitalize`}>
                                  {report.report_type?.replace('_', ' ') || 'N/A'}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${getStatusBadge(report.status)}`}>
                                  {report.status?.replace('_', ' ') || 'N/A'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                {new Date(report.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <Link to={`/reports/${report.id}`} className="btn btn-sm btn-ghost p-1">
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
            </motion.div>
          </div>

          {/* Right Column: Recent Activity */}
          <div className="col-lg-4">
            <motion.div variants={itemVariants}>
              <div className="modern-card">
                <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Activity size={18} style={{ color: 'var(--primary-600)' }} />
                    <div>
                      <h5 className="mb-0">Recent Activity</h5>
                      <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Latest events</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {recentActivity.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <div className="empty-state-icon" style={{ width: 56, height: 56 }}>
                        <Activity size={24} />
                      </div>
                      <p className="mb-0" style={{ fontSize: 13 }}>No recent activity</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-0" style={{ position: 'relative' }}>
                      {recentActivity.map((activity, index) => {
                        const ActivityIcon = getActivityIcon(activity.type)
                        const color = getActivityColor(activity.severity)
                        return (
                          <div key={activity.id} className="d-flex gap-3" style={{ position: 'relative', paddingBottom: index < recentActivity.length - 1 ? 20 : 0 }}>
                            {index < recentActivity.length - 1 && (
                              <div style={{
                                position: 'absolute',
                                left: 15,
                                top: 28,
                                bottom: 0,
                                width: 2,
                                backgroundColor: 'var(--border-color)'
                              }} />
                            )}
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                              style={{
                                width: 32,
                                height: 32,
                                background: `${color}15`,
                                border: `2px solid ${color}25`,
                                zIndex: 1
                              }}
                            >
                              <ActivityIcon size={14} style={{ color }} />
                            </div>
                            <div className="flex-grow-1 min-w-0">
                              <p className="mb-0 fw-medium" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                                {activity.title}
                              </p>
                              <p className="mb-0" style={{ color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.4 }}>
                                {activity.description}
                              </p>
                              <div className="d-flex align-items-center gap-1 mt-1">
                                <Calendar size={11} style={{ color: 'var(--text-tertiary)' }} />
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                                  {timeAgo(activity.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </motion.div>
    </Layout>
  )
}
