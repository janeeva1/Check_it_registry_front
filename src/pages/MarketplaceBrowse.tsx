// Marketplace: a welcoming header with one search box, picture-led type
// tiles, and big photo cards. Every listing comes from a verified owner
// (the server refuses anyone else), so the cards can say so plainly.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, ShieldCheck, PackageOpen, LockKeyhole, Images, Plus } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { CategoryIcon, formatNaira } from '../utils/categories'

type Listing = { id: string; title: string; brand?: string; model?: string; category?: string; price: number; location?: string; images?: string[]; device_condition?: string; ownership_level?: string; created_at?: string }

const TYPES: Array<[string, string]> = [
  ['', 'Everything'], ['mobile_phone', 'Phones'], ['computer', 'Laptops'], ['smart_watch', 'Watches'],
  ['electronics', 'Electronics'], ['vehicle', 'Vehicles'], ['jewelry', 'Jewellery'],
]
export const CONDITION: Record<string, string> = { new: 'New', used: 'Used', refurbished: 'Refurbished', excellent: 'Like new', good: 'Good', fair: 'Fair' }

function isNew(created?: string) {
  if (!created) return false
  const t = new Date(created).getTime()
  return !Number.isNaN(t) && Date.now() - t < 3 * 24 * 3600 * 1000
}

export default function MarketplaceBrowse() {
  const { user } = useAuth()
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState<'new' | 'low' | 'high'>('new')

  useEffect(() => { const t = setTimeout(() => setQuery(search.trim()), 350); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    apiClient.marketplace.list({ search: query || undefined, category: type || undefined, limit: 60 })
      .then((d: any) => { if (!cancelled) setItems((Array.isArray(d) ? d : d?.listings || []).map((l: any) => ({ ...l, price: Number(l.price) || 0, images: typeof l.images === 'string' ? safeJson(l.images) : l.images }))) })
      .catch((e: any) => { if (!cancelled) setError(e?.message || 'Could not load listings') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query, type])

  const shown = [...items].sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0)

  return (
    <Layout>
      <div className="po-page">
        <section className="po-mk-hero">
          <div className="po-mk-hero-text">
            <h1>Buy with confidence</h1>
            <p>Every item here is sold by its checked, verified owner — and your money is held safely until you receive it.</p>
          </div>
          <div className="po-mk-search">
            <Search size={20} aria-hidden="true" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search phones, laptops, cars…" aria-label="Search listings" />
          </div>
          <ul className="po-mk-trust" aria-label="Why it is safe">
            <li><ShieldCheck size={16} aria-hidden="true" /> Verified owners only</li>
            <li><LockKeyhole size={16} aria-hidden="true" /> Payment held until delivery</li>
            <li><CategoryIcon category="mobile_phone" size={16} /> Not reported stolen</li>
          </ul>
        </section>

        <div className="po-mk-types po-scroll-x" role="tablist" aria-label="Type">
          {TYPES.map(([k, label]) => (
            <button key={k || 'all'} role="tab" aria-selected={type === k} className={`po-mk-type ${type === k ? 'is-selected' : ''}`} onClick={() => setType(k)}>
              <span className="po-mk-type-icon">{k ? <CategoryIcon category={k} size={22} /> : <PackageOpen size={22} aria-hidden="true" />}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="po-mk-bar">
          <span className="po-muted" aria-live="polite">{loading ? 'Loading…' : `${shown.length} ${shown.length === 1 ? 'item' : 'items'}`}</span>
          <div className="po-mk-bar-right">
            <select className="modern-select po-sort" value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort">
              <option value="new">Newest first</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
            {user && <Link to="/marketplace/create-listing" className="po-btn po-btn-primary"><Plus size={18} aria-hidden="true" /> <span className="po-hide-xs">Sell an item</span></Link>}
          </div>
        </div>

        {loading ? (
          <ul className="po-listing-grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => <li key={i}><div className="po-listing is-skeleton"><span className="po-listing-img skeleton" /><span className="po-listing-body"><span className="skeleton" style={{ height: 18, width: '50%' }} /><span className="skeleton" style={{ height: 14, width: '80%' }} /></span></div></li>)}
          </ul>
        ) : error ? (
          <div className="po-card"><p className="po-error">{error}</p></div>
        ) : shown.length === 0 ? (
          <div className="po-mk-empty">
            <PackageOpen size={44} aria-hidden="true" />
            <h2>Nothing for sale here yet</h2>
            <p className="po-muted">Try another type or search{user ? ', or be the first to sell one.' : '.'}</p>
            {user && <Link to="/marketplace/create-listing" className="po-btn po-btn-secondary">Sell an item</Link>}
          </div>
        ) : (
          <ul className="po-listing-grid" data-testid="listing-grid">
            {shown.map((l) => {
              const imgs = l.images || []
              return (
                <li key={l.id}>
                  <Link to={`/marketplace/listing/${l.id}`} className="po-listing">
                    <span className="po-listing-img">
                      {imgs[0] ? <img src={imgs[0]} alt="" loading="lazy" /> : <span className="po-listing-noimg"><CategoryIcon category={l.category} size={44} /></span>}
                      {l.device_condition && <span className="po-listing-tag">{CONDITION[l.device_condition] || l.device_condition}</span>}
                      {isNew(l.created_at) && <span className="po-listing-tag is-new">Just listed</span>}
                      {imgs.length > 1 && <span className="po-listing-count"><Images size={13} aria-hidden="true" /> {imgs.length}</span>}
                    </span>
                    <span className="po-listing-body">
                      <strong className="po-listing-price">{formatNaira(l.price)}</strong>
                      <span className="po-listing-title">{l.title || [l.brand, l.model].filter(Boolean).join(' ')}</span>
                      <span className="po-listing-meta">
                        {l.location && <span><MapPin size={13} aria-hidden="true" /> {l.location}</span>}
                      </span>
                      <span className="po-listing-verified"><ShieldCheck size={14} aria-hidden="true" /> Verified owner</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}

function safeJson(s: string) { try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] } }
