// Recovery Service Dashboard - Admin interface for managing recovery services
import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit
} from 'lucide-react'

interface RecoveryService {
  id: string
  device_id: string
  user_name: string
  user_email: string
  brand: string
  model: string
  service_package: string
  status: string
  amount_paid: number
  currency: string
  agent_name?: string
  created_at: string
  expires_at: string
}

interface RecoveryStats {
  total_services: number
  services_by_status: Array<{ status: string; count: number }>
  services_by_package: Array<{ service_package: string; count: number }>
  revenue_by_package: Array<{ service_package: string; total_revenue: number; service_count: number }>
  success_rate: { recovered: number; completed: number; success_rate: number }
  monthly_revenue: Array<{ month: string; revenue: number; services: number }>
}

function RecoveryServiceDashboard() {
  const [services, setServices] = useState<RecoveryService[]>([])
  const [stats, setStats] = useState<RecoveryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    packageType: '',
    page: 1,
    limit: 20,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const [servicesResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/recovery-services/admin/all?${new URLSearchParams({
            page: filters.page.toString(),
            limit: filters.limit.toString(),
            ...(filters.status && { status: filters.status }),
            ...(filters.packageType && { packageType: filters.packageType }),
          })}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        ),
        fetch('/api/recovery-services/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ])

      if (!servicesResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const servicesData = await servicesResponse.json()
      const statsData = await statsResponse.json()

      setServices(servicesData.services || [])
      setPagination(servicesData.pagination || { page: 1, limit: 20, total: servicesData.services?.length || 0, pages: 1 })
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (serviceId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/recovery-services/${serviceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      loadDashboardData()
    } catch (err) {
      alert(`Error updating status: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleRefund = async (serviceId: string, reason: string, partialAmount?: number) => {
    try {
      const response = await fetch(`/api/recovery-services/${serviceId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason, partialAmount }),
      })

      if (!response.ok) {
        throw new Error('Failed to process refund')
      }

      const result = await response.json()
      alert(`Refund processed: ${result.refundAmount}`)

      loadDashboardData()
    } catch (err) {
      alert(`Error processing refund: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'var(--primary-600)'
      case 'investigating':
        return 'var(--warning-700)'
      case 'completed':
        return 'var(--success-700)'
      case 'expired':
        return 'var(--danger-700)'
      default:
        return 'var(--text-secondary)'
    }
  }

  const formatCurrency = (n: number, c = '₦') => `${c}${n.toLocaleString()}`

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <TrendingUp size={20} />
          <h1 className="h4 m-0">Recovery Services</h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          <RefreshCw size={16} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => loadDashboardData()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="modern-card p-3 mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Status</label>
            <div className="input-group">
              <span className="input-group-text">
                <Filter size={16} />
              </span>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-select"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="investigating">Investigating</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label">Package</label>
            <div className="input-group">
              <span className="input-group-text">
                <Package size={16} />
              </span>
              <select
                value={filters.packageType}
                onChange={(e) => setFilters({ ...filters, packageType: e.target.value })}
                className="form-select"
              >
                <option value="">All</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
          <div className="col-md-4 d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--primary-600)' }} />
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-md-3">
            <div className="modern-card p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Users size={18} />
                <strong>Total Services</strong>
              </div>
              <div className="fw-bold">{stats?.total_services ?? 0}</div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="modern-card p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <DollarSign size={18} />
                <strong>Revenue</strong>
              </div>
              <div className="fw-bold">
                {formatCurrency((stats?.revenue_by_package || []).reduce((s, r) => s + r.total_revenue, 0))}
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="modern-card p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <TrendingUp size={18} />
                <strong>Success Rate</strong>
              </div>
              <div className="fw-bold">{stats ? `${Math.round((stats.success_rate.success_rate || 0) * 100)}%` : '—'}</div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="modern-card p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Package size={18} />
                <strong>Packages</strong>
              </div>
              <div className="fw-bold">{(stats?.services_by_package || []).length}</div>
            </div>
          </div>

          <div className="col-12">
            <div className="modern-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Search size={16} />
                  <strong>Services</strong>
                </div>
                <small className="text-secondary">{pagination.total} total</small>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>User</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">
                              {s.brand} {s.model}
                            </span>
                            <small className="text-secondary">IMEI/ID: {s.device_id}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{s.user_name}</span>
                            <small className="text-secondary">{s.user_email}</small>
                          </div>
                        </td>
                        <td className="text-capitalize">{s.service_package}</td>
                        <td>
                          <span style={{ color: getStatusColor(s.status) }}>{s.status}</span>
                        </td>
                        <td>{formatCurrency(s.amount_paid, s.currency)}</td>
                        <td className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleStatusUpdate(s.id, 'investigating')}
                          >
                            <Edit size={14} /> Update
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRefund(s.id, 'Policy refund')}
                          >
                            <DollarSign size={14} /> Refund
                          </button>
                          <button className="btn btn-sm btn-outline-secondary">
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-secondary">
                          No services
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecoveryServiceDashboard
export { RecoveryServiceDashboard }