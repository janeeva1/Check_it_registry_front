// Admin home: what needs a decision today, four plain numbers, recent
// reports and shortcuts. No charts.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Scale, ClipboardCheck, FileWarning, Users, Smartphone, Shield, Store, Settings, History, ChevronRight, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'

const API = (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : import.meta.env.VITE_API_URL) || '/api'
const get = async (path: string) => {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

type Stats = { users: number; items: number; stolen: number; openCases: number }
type Report = { id: string; case_id?: string; report_type?: string; brand?: string; model?: string; created_at?: string; status?: string }

const SHORTCUTS = [
  { to: '/user-management', label: 'Users', icon: Users },
  { to: '/admin/device-management', label: 'Items', icon: Smartphone },
  { to: '/admin/lea-management', label: 'Police agencies', icon: Shield },
  { to: '/admin/marketplace', label: 'Marketplace', icon: Store },
  { to: '/audit-trail', label: 'Audit trail', icon: History },
  { to: '/admin/system-settings', label: 'Settings', icon: Settings },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [counts, setCounts] = useState({ proofs: 0, disputes: 0, queue: 0 })
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    const [s, r, p, d, q] = await Promise.allSettled([
      get('/admin-dashboard/stats'),
      get('/admin-dashboard/reports?page=1&limit=5'),
      apiClient.ownership.adminProofs('pending'),
      apiClient.ownership.adminDisputes('open'),
      apiClient.security.getVerificationQueue('pending', 1),
    ])
    if (s.status === 'fulfilled') {
      const by: Record<string, number> = {}
      for (const row of s.value?.devices_by_status || []) by[row.status] = Number(row.count) || 0
      setStats({ users: Number(s.value.total_users) || 0, items: Number(s.value.total_devices) || 0, stolen: (by.stolen || 0) + (by.lost || 0), openCases: Number(s.value.active_cases) || 0 })
    } else setError("Couldn't load the numbers.")
    if (r.status === 'fulfilled') setReports(r.value?.reports || [])
    const len = (x: PromiseSettledResult<any>, k: string) => (x.status === 'fulfilled' ? (x.value?.[k] || []).length : 0)
    const qv = q.status === 'fulfilled' ? q.value : null
    setCounts({ proofs: len(p, 'proofs'), disputes: len(d, 'disputes'), queue: Number(qv?.pagination?.total ?? (qv?.items || qv?.queue || []).length) || 0 })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const todo = [
    { to: '/admin/ownership-review', icon: ShieldCheck, label: 'Ownership proofs to check', n: counts.proofs },
    { to: '/admin/ownership-review', icon: Scale, label: 'Ownership disputes', n: counts.disputes },
    { to: '/admin/verification-queue', icon: ClipboardCheck, label: 'Identity checks waiting', n: counts.queue },
    { to: '/admin/report-management', icon: FileWarning, label: 'Open theft and loss cases', n: stats?.openCases || 0 },
  ]

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="po-page po-home">
        <div className="po-title-row">
          <h1 className="po-hello">Admin</h1>
          <button className="po-btn po-btn-ghost po-btn-sm" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw size={16} className={loading ? 'po-spin' : ''} aria-hidden="true" /></button>
        </div>

        <section className="po-section">
          <h2 className="po-section-title">Needs a decision</h2>
          <ul className="po-simple-list">
            {todo.map((t) => (
              <li key={t.label}>
                <Link to={t.to} className="po-simple-row">
                  <span className="po-row-icon"><t.icon size={20} aria-hidden="true" /></span>
                  <span className="po-simple-main"><strong>{t.label}</strong></span>
                  <span className={`po-count ${t.n ? 'is-active' : ''}`}>{loading ? '…' : t.n}</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="po-section">
          <h2 className="po-section-title">At a glance</h2>
          {error ? <p className="po-error">{error}</p> : (
            <div className="po-numbers">
              <div><strong>{stats ? stats.users.toLocaleString() : '…'}</strong><span>Users</span></div>
              <div><strong>{stats ? stats.items.toLocaleString() : '…'}</strong><span>Items registered</span></div>
              <div><strong>{stats ? stats.stolen.toLocaleString() : '…'}</strong><span>Stolen or lost</span></div>
              <div><strong>{stats ? stats.openCases.toLocaleString() : '…'}</strong><span>Open cases</span></div>
            </div>
          )}
        </section>

        {reports.length > 0 && (
          <section className="po-section">
            <div className="po-section-head">
              <h2 className="po-section-title">Latest reports</h2>
              <Link to="/admin/report-management" className="po-link">See all</Link>
            </div>
            <ul className="po-simple-list">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link to={`/admin/report-management/${r.case_id || r.id}`} className="po-simple-row">
                    <span className={`po-dot is-${r.report_type === 'stolen' ? 'danger' : 'warning'}`} aria-hidden="true" />
                    <span className="po-simple-main">
                      <strong>{[r.brand, r.model].filter(Boolean).join(' ') || 'Item'} — {r.report_type || 'report'}</strong>
                      <span>{r.case_id}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ''}</span>
                    </span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="po-section">
          <h2 className="po-section-title">Manage</h2>
          <div className="po-shortcuts">
            {SHORTCUTS.map((s) => (
              <Link key={s.to} to={s.to} className="po-shortcut"><s.icon size={22} aria-hidden="true" /><span>{s.label}</span></Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}
