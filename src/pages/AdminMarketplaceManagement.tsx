import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'
import { Search, Filter, Ban, CheckCircle, Star, StarOff, Tag, X, RefreshCw } from 'lucide-react'
import { useToast } from '../components/Toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function AdminMarketplaceManagement() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { showSuccess, showError } = useToast()

  useEffect(() => { fetchListings() }, [statusFilter, search])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const data = await (apiClient as any).marketplace.adminGetAll({ status: statusFilter, search: search || undefined })
      if (Array.isArray(data)) setListings(data)
    } catch (err) {
      showError('Error', 'Failed to fetch listings')
    } finally { setLoading(false) }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await (apiClient as any).marketplace.adminUpdateStatus(id, newStatus)
      showSuccess(`Listing marked as ${newStatus}`)
      fetchListings()
    } catch (err: any) { showError('Failed', err.message) }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await (apiClient as any).marketplace.adminToggleFeatured(id, !current)
      showSuccess(`Listing ${!current ? 'featured' : 'unfeatured'}`)
      fetchListings()
    } catch (err: any) { showError('Failed', err.message) }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'status-verified', sold: 'status-inactive',
      deleted: 'status-stolen', blocked: 'status-pending'
    }
    return <span className={`status-badge ${styles[status] || 'status-inactive'}`}>{status}</span>
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1>Marketplace Moderation</h1>
                <p>Review and manage marketplace listings</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card p-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label d-flex align-items-center gap-2"><Search size={16} /> Search Listings</label>
                <input type="text" className="modern-input" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label d-flex align-items-center gap-2"><Filter size={16} /> Status</label>
                <select className="modern-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="blocked">Blocked</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
              <div className="col-md-3">
                <button onClick={() => { setSearch(''); setStatusFilter('all') }} className="btn-ghost w-100 text-center">
                  <RefreshCw size={16} /> Reset
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="modern-card">
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-5">
                      <div className="spinner-border" style={{ color: 'var(--primary-600)' }} />
                    </td></tr>
                  ) : listings.length === 0 ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><Tag size={32} /></div>
                        <h3>No listings found</h3>
                        <p>No marketplace listings match your criteria.</p>
                      </div>
                    </td></tr>
                  ) : (
                    listings.map(l => (
                      <tr key={l.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img src={Array.isArray(l.images) && l.images[0] ? l.images[0] : 'https://via.placeholder.com/40'}
                              className="rounded" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                            <div>
                              <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{l.title}</div>
                              <small style={{ color: 'var(--text-tertiary)' }}>{l.brand} {l.model}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="fw-medium" style={{ color: 'var(--text-primary)' }}>{l.currency} {l.price?.toLocaleString()}</span></td>
                        <td>
                          <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>{l.seller?.name}</div>
                          <small style={{ color: 'var(--text-tertiary)' }}>{l.seller?.email}</small>
                        </td>
                        <td>{getStatusBadge(l.status)}</td>
                        <td>
                          <button onClick={() => handleToggleFeatured(l.id, l.featured)}
                            className="btn-ghost" style={{ color: l.featured ? 'var(--warning-500)' : 'var(--text-tertiary)' }}
                            title={l.featured ? 'Unfeature' : 'Feature'}>
                            {l.featured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                          </button>
                        </td>
                        <td><small style={{ color: 'var(--text-tertiary)' }}>{new Date(l.created_at).toLocaleDateString()}</small></td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            {l.status !== 'blocked' ? (
                              <button className="btn-ghost" style={{ color: 'var(--danger-500)' }}
                                onClick={() => handleStatusUpdate(l.id, 'blocked')} title="Block">
                                <Ban size={16} /> Block
                              </button>
                            ) : (
                              <button className="btn-ghost" style={{ color: 'var(--success-500)' }}
                                onClick={() => handleStatusUpdate(l.id, 'active')} title="Unblock">
                                <CheckCircle size={16} /> Unblock
                              </button>
                            )}
                            {l.status !== 'deleted' && (
                              <button className="btn-ghost" style={{ color: 'var(--danger-500)' }}
                                onClick={() => handleStatusUpdate(l.id, 'deleted')} title="Remove">
                                <X size={16} /> Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  )
}
