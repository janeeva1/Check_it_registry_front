// Business home: big actions, what needs doing, three numbers, latest
// orders, shortcuts.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Upload, Search, ChevronRight, ShieldCheck, Receipt, Wallet, Users, Package, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'
import { formatNaira } from '../utils/categories'

type Order = { id: string; brand?: string; model?: string; title?: string; buyer_name?: string; amount?: number; status: string; created_at?: string }

const ORDER_STATUS: Record<string, [string, string]> = {
  pending: ['New', 'warning'], processing: ['Processing', 'info'], shipped: ['Sent', 'info'], delivered: ['Delivered', 'success'],
  completed: ['Completed', 'success'], cancelled: ['Cancelled', 'neutral'], held: ['Paid — awaiting delivery', 'info'],
}

export default function BusinessDashboard() {
  const [stats, setStats] = useState({ listings: 0, pending: 0, balance: 0 })
  const [orders, setOrders] = useState<Order[]>([])
  const [verified, setVerified] = useState(true)
  const [needProof, setNeedProof] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const mp = apiClient.marketplace as any
    const [s, o, v, items] = await Promise.allSettled([
      mp.getSellerStats(),
      mp.getSellerOrders(),
      apiClient.security.getVerificationStatus(),
      apiClient.userPortal.devices({ limit: 100 }),
    ])
    const st = s.status === 'fulfilled' ? s.value || {} : {}
    const raw = o.status === 'fulfilled' ? (o.value?.data || o.value?.orders || o.value) : []
    const list: Order[] = Array.isArray(raw) ? raw.map((x: any) => ({
      id: x.id, brand: x.brand || x.listing?.brand, model: x.model || x.listing?.model, title: x.title || x.listing?.title,
      buyer_name: x.buyer_name || x.buyer?.first_name, amount: Number(x.amount ?? x.total ?? x.price) || 0, status: x.status, created_at: x.created_at || x.sold_at,
    })) : []
    setOrders(list.slice(0, 5))
    setStats({
      listings: Number(st.active_listings ?? st.activeListings) || 0,
      pending: list.filter((x) => ['pending', 'processing', 'held'].includes(x.status)).length,
      balance: Number(st.payout_balance ?? st.revenue) || 0,
    })
    if (v.status === 'fulfilled') setVerified((v.value?.verificationStatus || v.value?.status) === 'verified' || v.value?.business_verified === true)
    if (items.status === 'fulfilled') setNeedProof((items.value?.devices || []).filter((d: any) => !d.ownership_level || d.ownership_level === 'registered').length)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const todo = [
    !verified && { to: '/business-verification', label: 'Verify your business to start selling', tone: 'warning' },
    stats.pending > 0 && { to: '/seller/orders', label: `${stats.pending} order${stats.pending > 1 ? 's' : ''} waiting for you`, tone: 'danger' },
    needProof > 0 && { to: '/my-devices', label: `${needProof} item${needProof > 1 ? 's' : ''} need proof of ownership before you can sell`, tone: 'info' },
  ].filter(Boolean) as Array<{ to: string; label: string; tone: string }>

  return (
    <Layout requireAuth allowedRoles={['business']}>
      <div className="po-page po-home">
        <div className="po-title-row">
          <h1 className="po-hello">Your business</h1>
          <button className="po-btn po-btn-ghost po-btn-sm" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw size={16} className={loading ? 'po-spin' : ''} aria-hidden="true" /></button>
        </div>

        <div className="po-big-actions">
          <Link to="/marketplace/create-listing" className="po-big-action">
            <span className="po-big-icon is-green"><Store size={26} aria-hidden="true" /></span>
            <strong>List an item</strong><span>Sell on the marketplace</span>
          </Link>
          <Link to="/bulk-register" className="po-big-action">
            <span className="po-big-icon is-blue"><Upload size={26} aria-hidden="true" /></span>
            <strong>Register stock</strong><span>Many items at once</span>
          </Link>
          <Link to="/device-check" className="po-big-action">
            <span className="po-big-icon is-red"><Search size={26} aria-hidden="true" /></span>
            <strong>Check an item</strong><span>Before you buy stock</span>
          </Link>
        </div>

        {todo.length > 0 && (
          <section className="po-section">
            <h2 className="po-section-title">To do</h2>
            <ul className="po-simple-list">
              {todo.map((t) => (
                <li key={t.label}>
                  <Link to={t.to} className="po-simple-row">
                    <span className={`po-dot is-${t.tone}`} aria-hidden="true" />
                    <span className="po-simple-main"><strong>{t.label}</strong></span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="po-section">
          <h2 className="po-section-title">At a glance</h2>
          <div className="po-numbers po-numbers-3">
            <div><strong>{loading ? '…' : stats.listings}</strong><span>Items for sale</span></div>
            <div><strong>{loading ? '…' : stats.pending}</strong><span>Orders to handle</span></div>
            <div><strong>{loading ? '…' : formatNaira(stats.balance)}</strong><span>Payout balance</span></div>
          </div>
        </section>

        <section className="po-section">
          <div className="po-section-head">
            <h2 className="po-section-title">Latest orders</h2>
            {orders.length > 0 && <Link to="/seller/orders" className="po-link">See all</Link>}
          </div>
          {orders.length === 0 ? (
            <div className="po-empty-simple"><p className="mb-0">{loading ? 'Loading…' : 'No orders yet.'}</p></div>
          ) : (
            <ul className="po-simple-list">
              {orders.map((o) => {
                const [label, tone] = ORDER_STATUS[o.status] || [o.status, 'neutral']
                return (
                  <li key={o.id}>
                    <Link to="/seller/orders" className="po-simple-row">
                      <span className="po-row-icon"><Package size={20} aria-hidden="true" /></span>
                      <span className="po-simple-main">
                        <strong>{o.title || [o.brand, o.model].filter(Boolean).join(' ') || 'Order'}</strong>
                        <span>{formatNaira(o.amount)}{o.buyer_name ? ` · ${o.buyer_name}` : ''}</span>
                      </span>
                      <span className={`po-badge po-badge-${tone}`}>{label}</span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="po-section">
          <h2 className="po-section-title">Manage</h2>
          <div className="po-shortcuts">
            <Link to="/business/my-listings" className="po-shortcut"><Store size={22} aria-hidden="true" /><span>My listings</span></Link>
            <Link to="/seller/orders" className="po-shortcut"><Receipt size={22} aria-hidden="true" /><span>Orders</span></Link>
            <Link to="/business/payouts" className="po-shortcut"><Wallet size={22} aria-hidden="true" /><span>Payouts</span></Link>
            <Link to="/business/onboard" className="po-shortcut"><Users size={22} aria-hidden="true" /><span>Onboard a customer</span></Link>
            <Link to="/my-devices" className="po-shortcut"><Package size={22} aria-hidden="true" /><span>Registered items</span></Link>
            <Link to="/business-verification" className="po-shortcut"><ShieldCheck size={22} aria-hidden="true" /><span>Business verification</span></Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}
