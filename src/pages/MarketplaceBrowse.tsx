import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../lib/apiClient'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { useCart } from '../contexts/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, SlidersHorizontal, Grid3X3, List, MapPin, Clock,
  Smartphone, BadgeCheck,
  ChevronLeft, ChevronRight, RefreshCw, X, Package, FilterX, ShoppingCart
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Listing = {
  id: string
  title: string
  brand: string
  model: string
  storage?: string
  color?: string
  condition: 'new' | 'used' | 'refurbished'
  price: number
  currency: string
  location: string
  verified: boolean
  thumbnail?: string
  category?: string
  featured?: boolean
  rating?: number
  reviewCount?: number
  description?: string
  created_at?: string
  seller?: {
    name: string
    rating: number
    verified: boolean
  }
}

const CONDITIONS = ['new', 'used', 'refurbished'] as const
const CATEGORIES = ['All', 'Smartphones', 'Tablets', 'Laptops', 'Wearables', 'Accessories']
const STATUS_OPTIONS = ['all', 'verified', 'unverified'] as const
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₦100,000', min: 0, max: 100000 },
  { label: '₦100,000 - ₦300,000', min: 100000, max: 300000 },
  { label: '₦300,000 - ₦500,000', min: 300000, max: 500000 },
  { label: '₦500,000+', min: 500000, max: Infinity },
]

const ITEMS_PER_PAGE = 12

const statusBadgeClass = (condition: string) => {
  switch (condition) {
    case 'new': return 'status-badge status-active'
    case 'used': return 'status-badge status-pending'
    case 'refurbished': return 'status-badge status-found'
    default: return 'status-badge status-inactive'
  }
}

export default function MarketplaceBrowse() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [location, setLocation] = useState('')
  const [priceRange, setPriceRange] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const navigate = useNavigate()
  const { showError: _showError, showSuccess } = useToast()
  const { addItem } = useCart()

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.marketplace.list({
          search: search || undefined,
          category: category === 'All' ? undefined : category.toLowerCase(),
          condition: condition === 'all' ? undefined : condition,
          max_price: priceRange > 0 ? PRICE_RANGES[priceRange].max : undefined,
          min_price: priceRange > 0 ? PRICE_RANGES[priceRange].min : undefined,
          status: status === 'all' ? undefined : status,
        })

        const mapped: Listing[] = data.map((l: any) => ({
          id: l.id,
          title: l.title,
          brand: l.brand,
          model: l.model,
          condition: l.device_condition as any,
          price: typeof l.price === 'string' ? parseFloat(l.price) : l.price,
          currency: l.currency === 'NGN' ? '₦' : l.currency,
          location: l.location,
          verified: l.seller?.verified,
          thumbnail: l.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
          category: l.category || 'Smartphones',
          description: l.description,
          created_at: l.created_at,
          seller: {
            name: l.seller?.name || 'Unknown',
            verified: l.seller?.verified,
            rating: 5.0,
          },
          featured: !!l.featured,
          rating: 0,
          reviewCount: 0,
        }))

        setListings(mapped)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load listings')
      } finally {
        setLoading(false)
      }
    }

    const t = setTimeout(fetchListings, 500)
    return () => clearTimeout(t)
  }, [search, category, condition, priceRange, status])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return listings.filter(l => {
      if (q && ![l.title, l.brand, l.model, l.location].some(v => v?.toLowerCase().includes(q))) return false
      if (category !== 'All' && l.category !== category) return false
      if (condition !== 'all' && l.condition !== condition) return false
      if (status !== 'all' && status === 'verified' && !l.verified) return false
      if (status !== 'all' && status === 'unverified' && l.verified) return false
      if (location && !l.location?.toLowerCase().includes(location.toLowerCase())) return false
      if (priceRange > 0) {
        const range = PRICE_RANGES[priceRange]
        if (l.price < range.min || l.price >= range.max) return false
      }
      return true
    })
  }, [listings, search, category, condition, status, location, priceRange])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const formatCurrency = (n: number, c = '₦') => `${c}${n.toLocaleString()}`
  const timeAgo = (date?: string) => {
    if (!date) return ''
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const clearFilters = () => {
    setCategory('All')
    setCondition('all')
    setStatus('all')
    setLocation('')
    setPriceRange(0)
    setSearch('')
    setCurrentPage(1)
  }

  const hasActiveFilters = category !== 'All' || condition !== 'all' || status !== 'all' || location || priceRange > 0

  const SkeletonCard = () => (
    <div className="modern-card p-0 overflow-hidden">
      <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="container-fluid">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h1 style={{ fontSize: 32 }}>Marketplace</h1>
              <p>Discover verified devices from trusted sellers</p>
            </div>
            <button
              className="btn-gradient-primary"
              onClick={() => navigate('/marketplace/create-listing')}
            >
              <Package size={18} /> Sell a Device
            </button>
          </div>
        </motion.div>

        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 480 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                className="modern-input"
                style={{ paddingLeft: 44 }}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                placeholder="Search by brand, model, location..."
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className={`btn ${filterOpen ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilterOpen(!filterOpen)}
              title="Toggle filters"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <div className="toolbar-actions">
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3 }}>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 14, whiteSpace: 'nowrap' }}>
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Filter Sidebar */}
          <AnimatePresence>
            {filterOpen && (
              <motion.aside
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 280 }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                transition={{ duration: 0.2 }}
                style={{ flexShrink: 0, overflow: 'hidden' }}
              >
                <div className="modern-card" style={{ padding: 20, width: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h6 style={{ margin: 0, fontWeight: 700 }}>Filters</h6>
                    {hasActiveFilters && (
                      <button className="btn btn-sm btn-ghost" onClick={clearFilters} style={{ color: 'var(--primary-600)' }}>
                        <FilterX size={14} /> Clear
                      </button>
                    )}
                  </div>

                  {/* Category */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Category</label>
                    <select className="modern-select" value={category} onChange={e => { setCategory(e.target.value); setCurrentPage(1) }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Condition */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Condition</label>
                    <select className="modern-select" value={condition} onChange={e => { setCondition(e.target.value); setCurrentPage(1) }}>
                      <option value="all">All Conditions</option>
                      {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Price Range</label>
                    <select className="modern-select" value={priceRange} onChange={e => { setPriceRange(Number(e.target.value)); setCurrentPage(1) }}>
                      {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                    </select>
                  </div>

                  {/* Location */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Location</label>
                    <input
                      className="modern-input"
                      value={location}
                      onChange={e => { setLocation(e.target.value); setCurrentPage(1) }}
                      placeholder="City or region"
                    />
                  </div>

                  {/* Status */}
                  <div style={{ marginBottom: 0 }}>
                    <label className="form-label">Seller Status</label>
                    <select className="modern-select" value={status} onChange={e => { setStatus(e.target.value); setCurrentPage(1) }}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s === 'all' ? 'All Sellers' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className={`grid-${viewMode === 'grid' ? 4 : 1}`}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="modern-card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ color: 'var(--danger-500)', marginBottom: 12 }}>
                  <Smartphone size={48} style={{ opacity: 0.5 }} />
                </div>
                <h5>Something went wrong</h5>
                <p style={{ color: 'var(--text-tertiary)' }}>{error}</p>
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            ) : paginated.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package size={32} />
                </div>
                <h3>No listings found</h3>
                <p>
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                    : 'There are no listings yet. Be the first to sell a device!'}
                </p>
                {hasActiveFilters ? (
                  <button className="btn btn-outline-primary" onClick={clearFilters}>
                    <FilterX size={16} /> Clear Filters
                  </button>
                ) : (
                  <button className="btn-gradient-primary" onClick={() => navigate('/marketplace/create-listing')}>
                    <Package size={16} /> Create Listing
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid-4' : ''} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: 12 } : {}}>
                  <AnimatePresence mode="popLayout">
                    {paginated.map((l, index) => (
                      <motion.div
                        key={l.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className={viewMode === 'list' ? 'd-flex' : ''}
                      >
                        {viewMode === 'grid' ? (
                          /* Grid Card */
                          <div className="modern-card p-0 h-100 overflow-hidden d-flex flex-column">
                            <div style={{ position: 'relative', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: 200,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundImage: `url(${l.thumbnail})`,
                                  cursor: 'pointer',
                                  transition: 'transform 0.3s ease',
                                }}
                                className="hover-scale"
                                onClick={() => navigate(`/marketplace/listing/${l.id}`)}
                              />
                              {l.featured && (
                                <span style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none' }} className="status-badge bg-gradient-warm">
                                  Featured
                                </span>
                              )}
                              <span
                                style={{ position: 'absolute', top: 8, right: 8 }}
                                className={statusBadgeClass(l.condition)}
                              >
                                {l.condition}
                              </span>
                            </div>
                            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                              <div>
                                <div
                                  style={{ fontWeight: 600, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                  onClick={() => navigate(`/marketplace/listing/${l.id}`)}
                                >
                                  {l.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{l.brand} • {l.model}</span>
                                </div>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--primary-600)' }}>
                                {formatCurrency(l.price, l.currency)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-tertiary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <MapPin size={14} /> {l.location}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={14} /> {timeAgo(l.created_at)}
                                </span>
                              </div>
                              {l.seller && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                                  <div className="avatar avatar-sm" style={{ background: 'var(--primary-500)', fontSize: 11 }}>
                                    {l.seller.name.charAt(0)}
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{l.seller.name}</span>
                                  {l.verified && <BadgeCheck size={14} style={{ color: 'var(--success-500)' }} />}
                                </div>
                              )}
                              <button
                                className="btn btn-sm d-flex align-items-center justify-content-center gap-1 w-100 mt-2"
                                style={{ background: 'var(--primary-500)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 600, fontSize: 13 }}
                                onClick={(e) => { e.stopPropagation(); addItem({ id: l.id, title: l.title, price: l.price, currency: l.currency, image: l.thumbnail || '', seller_id: '', seller_name: l.seller?.name || '', condition: l.condition, location: l.location }); showSuccess('Added to cart!') }}
                              >
                                <ShoppingCart size={14} /> Add to Cart
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* List Card */
                          <div
                            className="modern-card p-0 overflow-hidden d-flex flex-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/marketplace/listing/${l.id}`)}
                          >
                            <div style={{ width: 200, minHeight: 160, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${l.thumbnail})` }} />
                            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 16 }}>{l.title}</div>
                                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{l.brand} • {l.model} {l.storage ? `• ${l.storage}` : ''}</div>
                                </div>
                                <span className={statusBadgeClass(l.condition)} style={{ fontSize: 12 }}>{l.condition}</span>
                              </div>
                              {l.description && (
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                                  {l.description}
                                </p>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary-600)' }}>
                                  {formatCurrency(l.price, l.currency)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-tertiary)' }}>
                                  <MapPin size={14} /> {l.location} • <Clock size={14} /> {timeAgo(l.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setCurrentPage(page)}
                        style={{ minWidth: 36 }}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
