// Police home: search an item, cases waiting, four numbers, latest cases,
// shortcuts.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, FileText, Bell, ChevronRight, RotateCcw, MessageSquare, ArrowLeftRight, Settings, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'

type Stats = { total_cases?: number; open_cases?: number; under_review_cases?: number; resolved_cases?: number; cases_24h?: number }
type Case = { case_id: string; report_type: string; status: string; priority?: string; created_at: string; device_brand?: string; device_model?: string; location?: string }

const STATUS: Record<string, [string, string]> = {
  open: ['New', 'warning'], under_review: ['In review', 'info'], resolved: ['Resolved', 'success'], dismissed: ['Closed', 'neutral'],
}

export default function LEAPortal() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    const [s, c] = await Promise.allSettled([apiClient.leaPortal.stats(), apiClient.leaPortal.cases({})])
    if (s.status === 'fulfilled') setStats((s.value as any)?.stats || null)
    else setError((s.reason as any)?.message || "Couldn't load your cases.")
    if (c.status === 'fulfilled') setCases(((c.value as any)?.cases || []).slice(0, 6))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const n = (v?: number) => (loading ? '…' : (Number(v) || 0).toLocaleString())

  return (
    <Layout requireAuth allowedRoles={['lea', 'admin']}>
      <div className="po-page po-home">
        <div className="po-title-row">
          <h1 className="po-hello">Police portal</h1>
          <button className="po-btn po-btn-ghost po-btn-sm" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw size={16} className={loading ? 'po-spin' : ''} aria-hidden="true" /></button>
        </div>

        <div className="po-big-actions po-big-actions-2">
          <Link to="/lea/device-search" className="po-big-action">
            <span className="po-big-icon is-blue"><Search size={26} aria-hidden="true" /></span>
            <strong>Search an item</strong><span>By IMEI, serial, VIN or plate</span>
          </Link>
          <Link to="/lea/cases" className="po-big-action">
            <span className="po-big-icon is-red"><FileText size={26} aria-hidden="true" /></span>
            <strong>Cases</strong><span>{stats?.open_cases ? `${stats.open_cases} new` : 'Theft and loss reports'}</span>
          </Link>
        </div>

        {error ? <p className="po-error">{error}</p> : (
          <section className="po-section">
            <h2 className="po-section-title">At a glance</h2>
            <div className="po-numbers">
              <div><strong>{n(stats?.open_cases)}</strong><span>New</span></div>
              <div><strong>{n(stats?.under_review_cases)}</strong><span>In review</span></div>
              <div><strong>{n(stats?.resolved_cases)}</strong><span>Resolved</span></div>
              <div><strong>{n(stats?.cases_24h)}</strong><span>Last 24 hours</span></div>
            </div>
          </section>
        )}

        <section className="po-section">
          <div className="po-section-head">
            <h2 className="po-section-title">Latest cases</h2>
            {cases.length > 0 && <Link to="/lea/cases" className="po-link">See all</Link>}
          </div>
          {cases.length === 0 ? (
            <div className="po-empty-simple"><p className="mb-0">{loading ? 'Loading…' : 'No cases yet.'}</p></div>
          ) : (
            <ul className="po-simple-list">
              {cases.map((c) => {
                const [label, tone] = STATUS[c.status] || [c.status, 'neutral']
                return (
                  <li key={c.case_id}>
                    <Link to={`/lea/cases/${c.case_id}`} className="po-simple-row">
                      <span className={`po-dot is-${c.priority === 'urgent' || c.priority === 'high' ? 'danger' : c.report_type === 'stolen' ? 'warning' : 'info'}`} aria-hidden="true" />
                      <span className="po-simple-main">
                        <strong>{[c.device_brand, c.device_model].filter(Boolean).join(' ') || 'Item'} — {c.report_type}</strong>
                        <span>{c.case_id} · {new Date(c.created_at).toLocaleDateString()}{c.location ? ` · ${c.location}` : ''}</span>
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
          <h2 className="po-section-title">More</h2>
          <div className="po-shortcuts">
            <Link to="/lea/alerts" className="po-shortcut"><Bell size={22} aria-hidden="true" /><span>Alerts</span></Link>
            <Link to="/lea/recovery" className="po-shortcut"><RotateCcw size={22} aria-hidden="true" /><span>Recoveries</span></Link>
            <Link to="/lea/communication" className="po-shortcut"><MessageSquare size={22} aria-hidden="true" /><span>Messages</span></Link>
            <Link to="/lea/transfers" className="po-shortcut"><ArrowLeftRight size={22} aria-hidden="true" /><span>Transfers</span></Link>
            <Link to="/lea/settings" className="po-shortcut"><Settings size={22} aria-hidden="true" /><span>Settings</span></Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}
