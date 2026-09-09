import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Package, Eye, EyeOff, Trash2, BadgeCheck,
  Search, RefreshCw, Smartphone, DollarSign
} from 'lucide-react'
import { apiClient } from '../lib/apiClient'
import { useToast, ToastContainer } from '../components/Toast'

type SellerListing = {
  id: string
  title: string
  price: number
  currency: string
  status: 'active' | 'paused' | 'sold' | 'deleted'
  verified: boolean
  views?: number
  updated_at: string
  condition?: string
  location?: string
}

export default function BusinessMyListings() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'sold'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState<SellerListing[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const user = JSON.parse(localStorage.getItem('user_data') || '{}')

  useEffect(() => {
    fetchListings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const data = await apiClient.marketplace.list({ seller_id: user.id })
      const mapped = data.map((l: any) => ({
        id: l.id,
        title: l.title,
        price: Number(l.price),
        currency: l.currency,
        status: l.status,
        verified: l.seller?.verified,
        views: l.views || 0,
        updated_at: l.updated_at,
        condition: l.condition,
        location: l.location,
      }))
      setListings(mapped)
    } catch {
      showError('Error', 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.marketplace.update(id, { status: newStatus })
      showSuccess(`Listing ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`)
      fetchListings()
    } catch (err: any) {
      showError('Failed', err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    try {
      await apiClient.marketplace.delete(id)
      showSuccess('Listing deleted successfully')
      fetchListings()
    } catch (err: any) {
      showError('Failed', err.message)
    }
  }

  const filtered = listings
    .filter(i => i.status !== 'deleted')
    .filter(i => statusFilter === 'all' ? true : i.status === statusFilter)
    .filter(i => searchQuery === '' || i.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const stats = {
    active: listings.filter(l => l.status === 'active').length,
    paused: listings.filter(l => l.status === 'paused').length,
    sold: listings.filter(l => l.status === 'sold').length,
    totalViews: listings.reduce((a, l) => a + (l.views || 0), 0),
  }

  const currency = (n: number, c = '₦') => `${c}${n.toLocaleString()}`

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      active: { className: 'status-verified', label: 'Active' },
      paused: { className: 'status-pending', label: 'Paused' },
      sold: { className: 'status-inactive', label: 'Sold' },
    }
    const s = map[status] || { className: 'status-inactive', label: status }
    return <span className={`status-badge ${s.className}`}>{s.label}</span>
  }

  const LoadingSkeleton = () => (
    <div className="modern-card">
      <div className="table-responsive">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Price</th>
              <th>Status</th>
              <th>Views</th>
              <th>Last Updated</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map(i => (
              <tr key={i}>
                <td><div className="skeleton skeleton-text" style={{ width: 180 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 50 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <Layout requireAuth allowedRoles={['business']}>
      <div className="container-fluid py-4">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h1>My Listings</h1>
            <p>Manage your marketplace device listings</p>
          </div>
          <button
            className="btn-gradient-primary"
            onClick={() => navigate('/marketplace/create')}
          >
            <Plus size={18} />
            Create Listing
          </button>
        </div>

        <div className="row g-3 mb-4">
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#10b981' }}>
                <Package size={22} />
              </div>
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </motion.div>
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <EyeOff size={22} />
              </div>
              <div className="stat-value">{stats.paused}</div>
              <div className="stat-label">Paused</div>
            </div>
          </motion.div>
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>
                <DollarSign size={22} />
              </div>
              <div className="stat-value">{stats.sold}</div>
              <div className="stat-label">Sold</div>
            </div>
          </motion.div>
          <motion.div
            className="col-6 col-md-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Eye size={22} />
              </div>
              <div className="stat-value">{stats.totalViews}</div>
              <div className="stat-label">Total Views</div>
            </div>
          </motion.div>
        </div>

        <div className="toolbar">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="position-relative">
              <Search size={16} className="position-absolute" style={{ left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="modern-input"
                style={{ paddingLeft: 40, width: '100%', maxWidth: 260 }}
                placeholder="Search listings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="modern-select"
              style={{ width: '100%', maxWidth: 160 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div className="toolbar-actions">
            <button className="btn-ghost" onClick={fetchListings}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="modern-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package size={32} />
                </div>
                <h3>No listings found</h3>
                <p>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first marketplace listing to start selling devices.'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <button
                    className="btn-gradient-primary"
                    onClick={() => navigate('/marketplace/create')}
                  >
                    <Plus size={18} />
                    Create First Listing
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="modern-card p-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Last Updated</th>
                    <th style={{ width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((listing, i) => (
                    <motion.tr
                      key={listing.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="avatar"
                            style={{
                              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                              borderRadius: 10,
                            }}
                          >
                            <Smartphone size={18} />
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <strong>{listing.title}</strong>
                              {listing.verified && (
                                <BadgeCheck size={16} style={{ color: 'var(--success-500)' }} />
                              )}
                            </div>
                            <small className="text-secondary">
                              {listing.condition && `${listing.condition} · `}
                              {listing.location || 'No location'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold">{currency(listing.price, listing.currency)}</td>
                      <td>{getStatusBadge(listing.status)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Eye size={14} className="text-secondary" />
                          <span>{listing.views || 0}</span>
                        </div>
                      </td>
                      <td className="text-secondary">
                        <small>{new Date(listing.updated_at).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {listing.status === 'active' && (
                            <button
                              className="btn-ghost"
                              style={{ padding: '6px 10px', fontSize: 13 }}
                              onClick={() => handleStatusChange(listing.id, 'paused')}
                              title="Pause"
                            >
                              <EyeOff size={14} />
                            </button>
                          )}
                          {listing.status === 'paused' && (
                            <button
                              className="btn-ghost"
                              style={{ padding: '6px 10px', fontSize: 13 }}
                              onClick={() => handleStatusChange(listing.id, 'active')}
                              title="Resume"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button
                            className="btn-ghost"
                            style={{ padding: '6px 10px', fontSize: 13, color: 'var(--danger-500)' }}
                            onClick={() => handleDelete(listing.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="d-flex align-items-center justify-content-between mt-3">
            <small className="text-secondary">
              Showing {filtered.length} of {listings.length} listings
            </small>
          </div>
        )}
      </div>
    </Layout>
  )
}
