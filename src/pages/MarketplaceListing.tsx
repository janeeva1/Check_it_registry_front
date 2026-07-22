import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { useCart } from '../contexts/CartContext'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BadgeCheck, MapPin, MessageSquare, Star,
  ChevronLeft, ChevronRight, Heart, Share2, Clock,
  Shield, Flag, Smartphone, CheckCircle, ChevronDown, ShoppingCart
} from 'lucide-react'

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
  description: string
  images: string[]
  category: string
  seller: {
    name: string
    rating: number
    verified: boolean
    joinDate: string
    totalSales: number
  }
  specifications: Record<string, string>
  rating: number
  reviewCount: number
  inStock: boolean
}

const conditionConfig = {
  new: { label: 'New', color: 'var(--success-500)', bg: 'rgba(16, 185, 129, 0.1)' },
  used: { label: 'Used', color: 'var(--warning-500)', bg: 'rgba(245, 158, 11, 0.1)' },
  refurbished: { label: 'Refurbished', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
}

export default function MarketplaceListing() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const { addItem } = useCart()
 
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [similarListings, setSimilarListings] = useState<any[]>([])
  const [reportReason, setReportReason] = useState('')
  const [zoomed, setZoomed] = useState(false)
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null)

  useEffect(() => {
    fetchListing()
    supabase.revenue.getFee('marketplace_commission_percent')
      .then((data: any) => setCommissionPercent(data?.amount ?? 5))
      .catch(() => setCommissionPercent(5))
  }, [id])

  useEffect(() => {
    if (listing) fetchSimilar()
  }, [listing])

  const fetchListing = async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await supabase.marketplace.get(id)
      if (data) {
        const mapped: Listing = {
          id: data.id,
          title: data.title,
          brand: data.brand,
          model: data.model,
          storage: data.storage_capacity,
          color: data.color,
          condition: data.device_condition,
          price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
          currency: data.currency === 'NGN' ? '₦' : data.currency,
          location: data.location,
          verified: data.seller_verified === 'verified',
          description: data.description,
          images: (typeof data.images === 'string' ? JSON.parse(data.images) : data.images) || [],
          category: 'Electronics',
          seller: {
            name: data.seller_name || 'Unknown',
            rating: 5.0,
            verified: data.seller_verified === 'verified',
            joinDate: new Date().toISOString(),
            totalSales: 0,
          },
          specifications: {
            'Brand': data.brand,
            'Model': data.model,
            'Condition': data.device_condition,
            'Storage': data.storage_capacity || 'N/A',
            'Color': data.color || 'N/A',
          },
          rating: 0,
          reviewCount: 0,
          inStock: data.status === 'active',
        }
        if (mapped.images.length === 0) {
          mapped.images = ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800&auto=format&fit=crop']
        }
        setListing(mapped)
      }
    } catch (err) {
      console.error(err)
      showError('Error', 'Failed to load listing details')
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilar = async () => {
    try {
      const data = await supabase.marketplace.list({ limit: 4 })
      const mapped = (data || []).slice(0, 4).map((l: any) => ({
        id: l.id,
        title: l.title,
        price: typeof l.price === 'string' ? parseFloat(l.price) : l.price,
        currency: l.currency === 'NGN' ? '₦' : l.currency,
        location: l.location,
        thumbnail: l.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
        condition: l.device_condition,
      }))
      setSimilarListings(mapped)
    } catch (err) {
      console.error(err)
    }
  }

  const handleReport = () => {
    showSuccess('Report submitted', 'We will review this listing shortly.')
    setShowReport(false)
    setReportReason('')
  }

  const formatCurrency = (amount: number, currency = '₦') => `${currency}${amount.toLocaleString()}`
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const nextImage = () => {
    if (listing) setCurrentImageIndex(prev => (prev + 1) % listing.images.length)
  }
  const prevImage = () => {
    if (listing) setCurrentImageIndex(prev => (prev - 1 + listing.images.length) % listing.images.length)
  }

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 24, borderRadius: 4 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <div className="skeleton" style={{ height: 400, borderRadius: 16, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ width: 80, height: 80, borderRadius: 8 }} />)}
                </div>
              </div>
              <div>
                <div className="skeleton skeleton-title" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                <div className="skeleton" style={{ height: 48, borderRadius: 10, marginTop: 24 }} />
                <div className="skeleton" style={{ height: 48, borderRadius: 10, marginTop: 12 }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container-fluid">
          <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
            <Smartphone size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16, opacity: 0.5 }} />
            <h4>Listing Not Found</h4>
            <p style={{ color: 'var(--text-tertiary)' }}>This listing may have been removed or doesn't exist.</p>
            <button className="btn-gradient-primary" onClick={() => navigate('/marketplace/browse')}>
              <ArrowLeft size={16} /> Back to Browse
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const condConfig = conditionConfig[listing.condition]

  return (
    <Layout>
      <div className="container-fluid" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/marketplace/browse')}
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </button>
        </motion.div>

        <div className="row g-4">
          {/* Image Gallery */}
          <div className="col-lg-7">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div
                className="modern-card p-0 overflow-hidden"
                style={{ position: 'relative', cursor: 'crosshair' }}
                onClick={() => setZoomed(!zoomed)}
              >
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={listing.images[currentImageIndex]}
                    alt={listing.title}
                    style={{
                      width: '100%',
                      height: zoomed ? 600 : 450,
                      objectFit: zoomed ? 'contain' : 'cover',
                      transition: 'all 0.3s ease',
                      background: 'var(--bg-secondary)',
                      display: 'block',
                    }}
                  />
                  {listing.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage() }}
                        className="btn btn-dark"
                        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.8, borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage() }}
                        className="btn btn-dark"
                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.8, borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted) }}
                    className={`btn ${isWishlisted ? 'btn-danger' : 'btn-dark'}`}
                    style={{ position: 'absolute', top: 16, right: 16, borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85 }}
                  >
                    <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {listing.images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, overflow: 'auto', paddingBottom: 4 }}>
                  {listing.images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      style={{
                        width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
                        border: `3px solid ${i === currentImageIndex ? 'var(--primary-500)' : 'var(--border-color)'}`,
                        cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.2s ease',
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Listing Details */}
          <div className="col-lg-5">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="modern-card" style={{ padding: 28 }}>
                {/* Title & Price */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{listing.title}</h4>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-600)' }}>
                    {formatCurrency(listing.price, listing.currency)}
                  </div>
                </div>

                {/* Quick Info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: condConfig.bg, color: condConfig.color, fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle size={14} /> {condConfig.label}
                  </span>
                  {listing.verified && (
                    <span className="status-badge status-verified" style={{ fontSize: 13 }}>
                      <BadgeCheck size={14} /> Verified Seller
                    </span>
                  )}
                  {listing.storage && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                      <Smartphone size={14} /> {listing.storage}
                    </span>
                  )}
                </div>

                {/* Location & Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <MapPin size={16} /> {listing.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <Clock size={16} /> Listed {formatDate(new Date().toISOString())}
                  </div>
                </div>

                {/* Seller Card */}
                <div className="modern-card" style={{ padding: 16, background: 'var(--bg-secondary)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar avatar-lg" style={{ background: listing.seller.verified ? 'var(--primary-500)' : 'var(--gray-400)', fontSize: 22 }}>
                      {listing.seller.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{listing.seller.name}</span>
                        {listing.seller.verified && <BadgeCheck size={16} style={{ color: 'var(--success-500)' }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-tertiary)' }}>
                        <Star size={14} fill="var(--warning-500)" color="var(--warning-500)" />
                        <span>{listing.seller.rating} • {listing.seller.totalSales} sales</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Joined {formatDate(listing.seller.joinDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        className="btn-gradient-primary"
                        style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/marketplace-inbox/${listing.id}`)}
                      >
                        <MessageSquare size={14} /> Contact
                      </button>
                    </div>
                  </div>
                </div>

                {commissionPercent !== null && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={14} style={{ color: 'var(--primary)' }} />
                    <span>Marketplace commission applies on sale. <strong style={{ color: 'var(--text-primary)' }}>{commissionPercent}%</strong> platform fee deducted at transaction completion.</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn d-flex align-items-center justify-content-center gap-2"
                    style={{ background: 'var(--success-500)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 15 }}
                    onClick={() => { addItem({ id: listing.id, title: listing.title, price: listing.price, currency: listing.currency, image: listing.images[0], seller_id: listing.seller?.name || '', seller_name: listing.seller?.name || '', condition: listing.condition, location: listing.location }); showSuccess('Added to cart!') }}
                  >
                    <ShoppingCart size={20} /> Add to Cart
                  </button>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className="btn-gradient-primary"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/marketplace-inbox/${listing.id}`)}
                    >
                      <MessageSquare size={18} /> Contact Seller
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      style={{ width: 48, height: 48, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => { navigator.clipboard.writeText(window.location.href); showSuccess('Link copied!') }}
                      title="Share"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Report */}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--text-tertiary)', fontSize: 13 }}
                    onClick={() => setShowReport(!showReport)}
                  >
                    <Flag size={14} /> Report this listing
                  </button>
                  {showReport && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ marginTop: 12, padding: 16, background: 'var(--bg-secondary)', borderRadius: 10 }}
                    >
                      <select className="modern-select" style={{ fontSize: 13, marginBottom: 8 }} value={reportReason} onChange={e => setReportReason(e.target.value)}>
                        <option value="">Select a reason</option>
                        <option value="fraud">Suspected fraud</option>
                        <option value="wrong">Wrong information</option>
                        <option value="sold">Already sold</option>
                        <option value="other">Other</option>
                      </select>
                      <button className="btn-gradient-danger btn-sm" style={{ width: '100%', fontSize: 13 }} disabled={!reportReason} onClick={handleReport}>
                        Submit Report
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Description & Specs */}
        <div className="row g-4 mt-2">
          <div className="col-lg-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="modern-card" style={{ padding: 28 }}>
                <h5 style={{ fontWeight: 700, marginBottom: 16 }}>Description</h5>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              </div>

              <div className="modern-card" style={{ padding: 28, marginTop: 20 }}>
                <h5 style={{ fontWeight: 700, marginBottom: 16 }}>Specifications</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {Object.entries(listing.specifications).map(([key, value], i) => (
                    <div
                      key={key}
                      style={{
                        padding: '12px 0',
                        borderBottom: i < Object.entries(listing.specifications).length - 1 ? '1px solid var(--border-color)' : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{key}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="col-lg-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="modern-card" style={{ padding: 24 }}>
                <h5 style={{ fontWeight: 700, marginBottom: 12 }}>Safety Tips</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Inspect the device in person before paying',
                    'Meet in a public, safe location',
                    'Use secure payment methods',
                    'Verify the device IMEI on ProveOwnership',
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <Shield size={16} style={{ color: 'var(--primary-500)', flexShrink: 0, marginTop: 2 }} />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 40 }}
          >
            <h5 style={{ fontWeight: 700, marginBottom: 20 }}>Similar Listings</h5>
            <div className="grid-4">
              {similarListings.map((l: any) => (
                <div
                  key={l.id}
                  className="modern-card p-0 overflow-hidden"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { navigate(`/marketplace/listing/${l.id}`); window.scrollTo(0, 0) }}
                >
                  <div style={{ height: 180, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${l.thumbnail})` }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {l.title}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary-600)' }}>
                      {l.currency}{Number(l.price).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {l.location}</span>
                      <span className="status-badge" style={{ fontSize: 11, padding: '2px 8px', ...(l.condition === 'new' ? { background: 'rgba(16,185,129,0.1)', color: 'var(--success-500)' } : l.condition === 'used' ? { background: 'rgba(245,158,11,0.1)', color: 'var(--warning-500)' } : { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }) }}>
                        {l.condition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
