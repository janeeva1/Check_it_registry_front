// My reports: theft / loss reports I filed or that concern my items.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronRight, Loader2, FileText } from 'lucide-react'
import { Layout } from '../components/Layout'

type Report = { id: string; case_id: string; report_type: string; status: string; brand?: string; model?: string; location?: string; created_at: string; agency_name?: string }

export const REPORT_STATUS: Record<string, [string, string]> = {
  open: ['Open', 'warning'], pending_verification: ['Waiting for payment or ID check', 'warning'], active: ['Active', 'warning'],
  under_review: ['Police reviewing', 'info'], resolved: ['Resolved', 'success'], recovered: ['Recovered', 'success'], dismissed: ['Closed', 'neutral'], closed: ['Closed', 'neutral'],
}

const API = import.meta.env.VITE_API_URL || '/api'

export default function ReportsV2() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    fetch(`${API}/user-portal/reports${status ? `?status=${status}` : ''}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } })
      .then(async (r) => { const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'Could not load your reports'); return b })
      .then((b) => setReports(b?.data?.reports || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <Layout requireAuth>
      <div className="po-page po-single">
        <div className="po-title-row">
          <h1 className="po-hello">My reports</h1>
          <Link to="/report-incident" className="po-btn po-btn-primary"><Plus size={18} aria-hidden="true" /> <span className="po-hide-xs">New report</span></Link>
        </div>
        <div className="po-chip-row po-scroll-x mb-3" role="tablist">
          {[['', 'All'], ['open', 'Open'], ['under_review', 'With police'], ['resolved', 'Resolved']].map(([k, l]) => (
            <button key={k || 'all'} role="tab" aria-selected={status === k} className={`po-chip ${status === k ? 'is-selected' : ''}`} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
        {loading ? <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div>
          : error ? <div className="po-card"><p className="po-error">{error}</p></div>
          : reports.length === 0 ? (
            <div className="po-empty-simple"><FileText size={32} aria-hidden="true" /><p>No reports.</p><Link to="/report-incident" className="po-btn po-btn-secondary">Report an item stolen or lost</Link></div>
          ) : (
            <ul className="po-simple-list">
              {reports.map((r) => {
                const [label, tone] = REPORT_STATUS[r.status] || [r.status, 'neutral']
                return (
                  <li key={r.id}>
                    <Link to={`/reports/${r.case_id}`} className="po-simple-row">
                      <span className={`po-dot is-${r.report_type === 'stolen' ? 'danger' : 'warning'}`} aria-hidden="true" />
                      <span className="po-simple-main">
                        <strong>{[r.brand, r.model].filter(Boolean).join(' ') || 'Item'} — {r.report_type}</strong>
                        <span>{r.case_id} · {new Date(r.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className={`po-badge po-badge-${tone}`}>{label}</span>
                      <ChevronRight size={18} aria-hidden="true" />
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
