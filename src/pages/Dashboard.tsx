// Home screen: three big actions, anything that needs attention, and your
// items. Nothing else.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/apiClient'
import OwnershipBadge from '../components/ownership/OwnershipBadge'
import { CategoryIcon, categoryLabel } from '../utils/categories'

type Item = { id: string; brand: string; model: string; category: string; status: string; ownership_level?: string }

function todoFor(d: Item) {
  if (d.ownership_level === 'disputed') return { text: 'Someone claimed this item — send your proof', tone: 'danger' }
  if (d.status === 'unverified') return { text: 'Confirm the registration from your email', tone: 'warning' }
  if (!d.ownership_level || d.ownership_level === 'registered') return { text: 'Add proof of ownership', tone: 'info' }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.userPortal.devices({ limit: 50 })
      .then((r: any) => { setItems(r?.devices || []); setTotal(r?.pagination?.total ?? (r?.devices || []).length) })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.first_name || (user?.name || '').split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todos = items.map((d) => ({ d, t: todoFor(d) })).filter((x) => x.t).slice(0, 3)

  return (
    <Layout requireAuth>
      <div className="po-page po-home">
        <h1 className="po-hello">{greeting}{firstName ? `, ${firstName}` : ''}</h1>

        <div className="po-big-actions">
          <Link to="/device-check" className="po-big-action">
            <span className="po-big-icon is-green"><Search size={26} aria-hidden="true" /></span>
            <strong>Check an item</strong>
            <span>Before you buy</span>
          </Link>
          <Link to="/register-device" className="po-big-action">
            <span className="po-big-icon is-blue"><Plus size={26} aria-hidden="true" /></span>
            <strong>Register an item</strong>
            <span>Protect what you own</span>
          </Link>
          <Link to="/report-incident" className="po-big-action">
            <span className="po-big-icon is-red"><AlertTriangle size={26} aria-hidden="true" /></span>
            <strong>Report stolen</strong>
            <span>Or lost</span>
          </Link>
        </div>

        {todos.length > 0 && (
          <section className="po-section">
            <h2 className="po-section-title">To do</h2>
            <ul className="po-simple-list">
              {todos.map(({ d, t }) => (
                <li key={d.id}>
                  <Link to={`/device/${d.id}`} className="po-simple-row">
                    <span className={`po-dot is-${t!.tone}`} aria-hidden="true" />
                    <span className="po-simple-main"><strong>{t!.text}</strong><span>{d.brand} {d.model}</span></span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="po-section">
          <div className="po-section-head">
            <h2 className="po-section-title">Your items{total ? ` (${total})` : ''}</h2>
            {items.length > 0 && <Link to="/my-devices" className="po-link">See all</Link>}
          </div>
          {loading ? (
            <div className="po-center py-4"><Loader2 size={24} className="po-spin" aria-label="Loading" /></div>
          ) : items.length === 0 ? (
            <div className="po-empty-simple">
              <p>Nothing registered yet.</p>
              <Link to="/register-device" className="po-btn po-btn-primary"><Plus size={18} aria-hidden="true" /> Register your first item</Link>
            </div>
          ) : (
            <ul className="po-simple-list">
              {items.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link to={`/device/${d.id}`} className="po-simple-row">
                    <span className="po-row-icon"><CategoryIcon category={d.category} size={20} /></span>
                    <span className="po-simple-main"><strong>{d.brand} {d.model}</strong><span>{categoryLabel(d.category)}</span></span>
                    {['stolen', 'lost'].includes(d.status)
                      ? <span className="po-badge po-badge-danger">{d.status === 'stolen' ? 'Stolen' : 'Lost'}</span>
                      : <OwnershipBadge level={d.ownership_level} compact />}
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  )
}
