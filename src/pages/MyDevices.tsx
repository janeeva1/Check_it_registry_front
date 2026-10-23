import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, Loader2, PackageOpen } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'
import OwnershipBadge from '../components/ownership/OwnershipBadge'
import { CategoryIcon, categoryLabel, primaryIdentifier } from '../utils/categories'

type Item = {
  id: string; brand: string; model: string; category: string; status: string; ownership_level?: string
  imei?: string; serial?: string; vin?: string; license_plate?: string; certificate_number?: string; created_at: string
}

const FILTERS: Array<[string, string]> = [
  ['', 'All'], ['verified', 'Active'], ['unverified', 'Needs confirming'], ['stolen', 'Stolen'], ['lost', 'Lost'], ['pending_transfer', 'Transferring'],
]

const STATUS: Record<string, [string, string]> = {
  verified: ['Active', 'success'], unverified: ['Confirm by email', 'warning'], stolen: ['Stolen · held by Prove Ownership', 'danger'], lost: ['Lost · held by Prove Ownership', 'danger'],
  found: ['Found · pay release fee', 'info'], pending_transfer: ['Transferring', 'info'], released: ['Released', 'neutral'],
}

// The single most useful thing to do next for an item
function nextStep(d: Item) {
  if (d.status === 'unverified') return 'Confirm the registration from your email'
  if (d.ownership_level === 'disputed') return 'Someone claimed this item — send your proof'
  if (d.ownership_level === 'registered' || !d.ownership_level) return 'Add proof of ownership'
  return null
}

export default function MyDevices() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [reload, setReload] = useState(0)

  // Search as you type (after a short pause)
  useEffect(() => { const t = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    apiClient.userPortal.devices({ status: status || undefined, search: query || undefined, page, limit: 20 })
      .then((r: any) => { if (!cancelled) { setItems(r?.devices || []); setPages(r?.pagination?.pages || 1) } })
      .catch((e: any) => { if (!cancelled) setError(e?.message || 'Could not load your items') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status, query, page, reload])

  return (
    <Layout requireAuth>
      <div className="po-page">
        <div className="po-title-row">
          <h1 className="po-hello">My items</h1>
          <Link to="/register-device" className="po-btn po-btn-primary"><Plus size={18} aria-hidden="true" /> <span className="po-hide-xs">Register</span></Link>
        </div>

        <div className="po-toolbar">
          <div className="po-search">
            <Search size={18} aria-hidden="true" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, IMEI, serial, VIN or plate" aria-label="Search your items" />
          </div>
          <div className="po-chip-row po-scroll-x" role="tablist" aria-label="Filter by status">
            {FILTERS.map(([k, label]) => (
              <button key={k || 'all'} role="tab" aria-selected={status === k} className={`po-chip ${status === k ? 'is-selected' : ''}`} onClick={() => { setStatus(k); setPage(1) }}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div>
        ) : error ? (
          <div className="modern-card p-4"><p className="po-error">{error}</p><button className="po-btn po-btn-secondary" onClick={() => setReload((n) => n + 1)}>Try again</button></div>
        ) : items.length === 0 ? (
          <div className="modern-card po-empty">
            <PackageOpen size={40} aria-hidden="true" />
            {query || status ? (
              <><h2>No items match</h2><p className="po-muted">Try a different search or filter.</p><button className="po-btn po-btn-secondary" onClick={() => { setSearch(''); setStatus('') }}>Clear filters</button></>
            ) : (
              <><h2>You haven't registered anything yet</h2><p className="po-muted">Register your phone, laptop, car or anything valuable so it can be checked and recovered if stolen.</p><Link to="/register-device" className="po-btn po-btn-primary"><Plus size={18} aria-hidden="true" /> Register your first item</Link></>
            )}
          </div>
        ) : (
          <ul className="po-simple-list">
            {items.map((d) => {
              const id = primaryIdentifier(d)
              const [label, tone] = STATUS[d.status] || [d.status, 'neutral']
              const next = nextStep(d)
              const alert = ['stolen', 'lost', 'found', 'unverified', 'pending_transfer'].includes(d.status)
              return (
                <li key={d.id}>
                  <Link to={`/device/${d.id}`} className="po-simple-row">
                    <span className="po-row-icon"><CategoryIcon category={d.category} size={20} /></span>
                    <span className="po-simple-main">
                      <strong>{d.brand} {d.model}</strong>
                      <span>{next ? <span className="po-next">{next}</span> : id ? <span className="po-mono">{id.label} {id.value}</span> : categoryLabel(d.category)}</span>
                    </span>
                    {alert ? <span className={`po-badge po-badge-${tone}`}>{label}</span> : <OwnershipBadge level={d.ownership_level} compact />}
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {pages > 1 && (
          <nav className="po-pager" aria-label="Pages">
            <button className="po-btn po-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="po-muted">Page {page} of {pages}</span>
            <button className="po-btn po-btn-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </nav>
        )}
      </div>
    </Layout>
  )
}
