// One listing: big photos, the price, who sells it and why it is safe, and
// two clear actions (Buy now / Message seller). Fake ratings and the
// pretend "report" button from the old page are gone; reporting is real.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, MessageSquare, ShieldCheck, LockKeyhole, Share2, Flag, ShoppingCart, BadgeCheck, Loader2, PackageOpen, Clock } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../components/Toast'
import { CategoryIcon, categoryLabel, formatNaira } from '../utils/categories'
import { CONDITION } from './MarketplaceBrowse'

type Listing = {
  id: string; title: string; brand?: string; model?: string; category?: string; storage_capacity?: string; color?: string
  device_condition?: string; price: number; location?: string; description?: string; images: string[]; status?: string
  seller_id?: string; seller_name?: string; seller_verified?: string; seller_since?: string; ownership_level?: string; created_at?: string
}

export default function MarketplaceListing() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { showSuccess, showError } = useToast()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [fee, setFee] = useState<number | null>(null)
  const [flagOpen, setFlagOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [flagging, setFlagging] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true); setIndex(0)
    apiClient.marketplace.get(id)
      .then((d: any) => {
        if (!d || !d.id) { setListing(null); return }
        const images = typeof d.images === 'string' ? (() => { try { return JSON.parse(d.images) } catch { return [] } })() : d.images
        setListing({ ...d, price: Number(d.price) || 0, images: Array.isArray(images) ? images : [] })
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false))
    if (user) apiClient.revenue.getFee('marketplace_commission_percent').then((f: any) => setFee(f?.amount ?? null)).catch(() => setFee(null))
  }, [id, user])

  if (loading) return <Layout><div className="po-page po-center py-5"><Loader2 size={30} className="po-spin" aria-label="Loading" /></div></Layout>

  if (!listing) {
    return (
      <Layout>
        <div className="po-page po-single">
          <div className="po-mk-empty">
            <PackageOpen size={44} aria-hidden="true" />
            <h2>This listing isn't available</h2>
            <p className="po-muted">It may have been sold or removed.</p>
            <Link to="/marketplace" className="po-btn po-btn-primary">Back to the marketplace</Link>
          </div>
        </div>
      </Layout>
    )
  }

  const l = listing
  const name = l.title || [l.brand, l.model].filter(Boolean).join(' ')
  const mine = !!user && user.id === l.seller_id
  const available = !l.status || l.status === 'active'
  const imgs = l.images
  const go = (n: number) => setIndex((i) => (i + n + imgs.length) % imgs.length)

  const buy = () => {
    if (!user) { navigate('/login', { state: { from: `/marketplace/listing/${l.id}` } }); return }
    navigate(`/checkout?listing=${encodeURIComponent(l.id)}`)
  }
  const addToCart = () => {
    addItem({ id: l.id, title: name, price: l.price, currency: '₦', image: imgs[0], seller_id: l.seller_id || '', seller_name: l.seller_name || '', condition: l.device_condition || '', location: l.location || '' })
    showSuccess('Added to your cart')
  }
  const message = () => {
    if (!user) { navigate('/login', { state: { from: `/marketplace/listing/${l.id}` } }); return }
    navigate(`/marketplace-inbox/${l.id}`)
  }
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: name, url: window.location.href })
      else { await navigator.clipboard.writeText(window.location.href); showSuccess('Link copied') }
    } catch { /* closed the share sheet */ }
  }
  const flag = async () => {
    setFlagging(true)
    try {
      const token = localStorage.getItem('auth_token') || ''
      const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/${l.id}/flag`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(b.error || 'Could not send the report')
      showSuccess('Thanks — we will review this listing')
      setFlagOpen(false); setReason('')
    } catch (e: any) { showError('Report not sent', e.message) } finally { setFlagging(false) }
  }

  const details: Array<[string, string | undefined]> = [
    ['Type', l.category ? categoryLabel(l.category) : undefined],
    ['Brand', l.brand], ['Model', l.model],
    ['Condition', l.device_condition ? (CONDITION[l.device_condition] || l.device_condition) : undefined],
    ['Storage', l.storage_capacity], ['Colour', l.color],
  ]

  return (
    <Layout>
      <div className="po-page po-mk-detail">
        <Link to="/marketplace" className="po-back"><ArrowLeft size={18} aria-hidden="true" /> Marketplace</Link>

        <div className="po-mk-detail-grid">
          <div className="po-mk-gallery">
            <div className="po-mk-photo">
              {imgs.length ? <img src={imgs[index]} alt={name} /> : <span className="po-listing-noimg"><CategoryIcon category={l.category} size={72} /></span>}
              {imgs.length > 1 && (
                <>
                  <button className="po-mk-arrow is-left" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={22} /></button>
                  <button className="po-mk-arrow is-right" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={22} /></button>
                  <span className="po-listing-count">{index + 1} / {imgs.length}</span>
                </>
              )}
            </div>
            {imgs.length > 1 && (
              <div className="po-mk-thumbs po-scroll-x">
                {imgs.map((src, i) => (
                  <button key={i} className={`po-mk-thumb ${i === index ? 'is-selected' : ''}`} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}><img src={src} alt="" /></button>
                ))}
              </div>
            )}
          </div>

          <aside className="po-mk-side">
            <div className="po-card po-mk-buy">
              <h1 className="po-mk-title">{name}</h1>
              <div className="po-mk-price">{formatNaira(l.price)}</div>
              <div className="po-mk-pills">
                {l.device_condition && <span className="po-badge po-badge-neutral">{CONDITION[l.device_condition] || l.device_condition}</span>}
                <span className="po-badge po-badge-success"><ShieldCheck size={13} aria-hidden="true" /> Verified owner</span>
                {!available && <span className="po-badge po-badge-warning">{l.status === 'sold' ? 'Sold' : 'Not available'}</span>}
              </div>
              {l.location && <p className="po-mk-line"><MapPin size={16} aria-hidden="true" /> {l.location}</p>}
              {l.created_at && <p className="po-mk-line"><Clock size={16} aria-hidden="true" /> Listed {new Date(l.created_at).toLocaleDateString()}</p>}

              {mine ? (
                <Link to="/business/my-listings" className="po-btn po-btn-secondary w-100">This is your listing — manage it</Link>
              ) : available ? (
                <div className="po-mk-actions">
                  <button className="po-btn po-btn-primary po-btn-lg w-100" onClick={buy}>Buy now</button>
                  <div className="po-mk-actions-row">
                    <button className="po-btn po-btn-secondary" onClick={message}><MessageSquare size={18} aria-hidden="true" /> Message seller</button>
                    <button className="po-btn po-btn-secondary" onClick={addToCart} aria-label="Add to cart"><ShoppingCart size={18} aria-hidden="true" /></button>
                    <button className="po-btn po-btn-secondary" onClick={share} aria-label="Share"><Share2 size={18} aria-hidden="true" /></button>
                  </div>
                </div>
              ) : (
                <Link to="/marketplace" className="po-btn po-btn-secondary w-100">See other items</Link>
              )}
            </div>

            <div className="po-card po-mk-seller">
              <span className="po-avatar" aria-hidden="true">{(l.seller_name || '?').trim().charAt(0).toUpperCase()}</span>
              <div>
                <strong>{l.seller_name || 'Seller'} {l.seller_verified === 'verified' && <BadgeCheck size={16} className="po-text-success" aria-label="ID checked" />}</strong>
                <span className="po-muted d-block">{l.seller_verified === 'verified' ? 'ID checked' : 'Owner verified'}{l.seller_since ? ` · on ProveOwnership since ${new Date(l.seller_since).getFullYear()}` : ''}</span>
              </div>
            </div>

            <div className="po-card po-mk-safe">
              <h2 className="po-card-title">Why this is safe</h2>
              <ul>
                <li><ShieldCheck size={18} aria-hidden="true" /> The seller proved they own this item.</li>
                <li><CategoryIcon category={l.category} size={18} /> It is not reported stolen or lost.</li>
                <li><LockKeyhole size={18} aria-hidden="true" /> Your payment is held until you confirm you received it{fee !== null ? `. A ${fee}% fee is taken from the seller, not you` : ''}.</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="po-mk-info">
          {l.description && (
            <section className="po-card">
              <h2 className="po-card-title">About this item</h2>
              <p className="po-card-text" style={{ whiteSpace: 'pre-wrap' }}>{l.description}</p>
            </section>
          )}
          <section className="po-card">
            <h2 className="po-card-title">Details</h2>
            <dl className="po-rows">
              {details.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </section>
        </div>

        {!mine && user && (
          <div className="po-mk-flag">
            {!flagOpen ? (
              <button className="po-link-btn" onClick={() => setFlagOpen(true)}><Flag size={14} aria-hidden="true" /> Report this listing</button>
            ) : (
              <div className="po-card">
                <label className="form-label" htmlFor="flag-reason">What's wrong?</label>
                <select id="flag-reason" className="modern-select mb-2" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Choose a reason</option>
                  <option value="fraud">Looks like a scam</option>
                  <option value="wrong">The details are wrong</option>
                  <option value="sold">It's already sold</option>
                  <option value="other">Something else</option>
                </select>
                <div className="d-flex gap-2">
                  <button className="po-btn po-btn-primary" disabled={!reason || flagging} onClick={flag}>{flagging ? 'Sending…' : 'Send report'}</button>
                  <button className="po-btn po-btn-secondary" onClick={() => setFlagOpen(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
