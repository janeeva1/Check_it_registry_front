// One theft / loss report: status, item, police contact, history.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Phone, Mail } from 'lucide-react'
import { Layout } from '../components/Layout'
import { REPORT_STATUS } from './ReportsV2'

const API = import.meta.env.VITE_API_URL || '/api'

export default function ReportDetails() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!caseId) return
    fetch(`${API}/user-portal/reports/${encodeURIComponent(caseId)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } })
      .then(async (r) => { const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'Report not found'); return b })
      .then((b) => setData(b?.data || null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  const r = data?.report
  const [label, tone] = r ? (REPORT_STATUS[r.status] || [r.status, 'neutral']) : ['', 'neutral']

  return (
    <Layout requireAuth>
      <div className="po-page po-single">
        <button className="po-back" onClick={() => navigate(-1)}><ArrowLeft size={18} aria-hidden="true" /> Back</button>
        {loading ? <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div>
          : error || !r ? (
            <div className="po-card"><p className="po-error">{error || 'Report not found'}</p><Link to="/reports" className="po-link">All my reports</Link></div>
          ) : (
            <>
              <h1 className="po-hello" style={{ marginBottom: 6 }}>{[r.brand, r.model].filter(Boolean).join(' ') || 'Item'} — {r.report_type}</h1>
              <p className="mb-3"><span className={`po-badge po-badge-${tone}`}>{label}</span></p>

              <section className="po-card">
                <dl className="po-rows">
                  <div><dt>Case number</dt><dd className="po-mono">{r.case_id}</dd></div>
                  {r.imei && <div><dt>IMEI</dt><dd className="po-mono">{r.imei}</dd></div>}
                  {r.serial && <div><dt>Serial</dt><dd className="po-mono">{r.serial}</dd></div>}
                  {r.occurred_at && <div><dt>When it happened</dt><dd>{new Date(r.occurred_at).toLocaleDateString()}</dd></div>}
                  {r.location && <div><dt>Where</dt><dd>{r.location}</dd></div>}
                  <div><dt>Reported</dt><dd>{new Date(r.created_at).toLocaleString()}</dd></div>
                </dl>
                {r.description && <p className="po-card-text">{r.description}</p>}
              </section>

              {r.agency_name && (
                <section className="po-card">
                  <h2 className="po-card-title">Police handling this</h2>
                  <p className="po-card-text"><strong>{r.agency_name}</strong>{r.lea_address ? <><br />{r.lea_address}</> : null}</p>
                  <div className="po-quiet-links">
                    {r.lea_phone && <a href={`tel:${r.lea_phone}`}><Phone size={15} aria-hidden="true" /> {r.lea_phone}</a>}
                    {r.lea_email && <a href={`mailto:${r.lea_email}`}><Mail size={15} aria-hidden="true" /> {r.lea_email}</a>}
                  </div>
                </section>
              )}

              {(data.timeline || []).length > 0 && (
                <section className="po-card">
                  <h2 className="po-card-title">History</h2>
                  <ul className="po-list w-100">
                    {data.timeline.map((t: any, i: number) => (
                      <li key={i} className="po-list-row">
                        <div className="po-list-main">
                          <strong>{String(t.action || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}</strong>
                          <span className="po-muted">{new Date(t.created_at).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
      </div>
    </Layout>
  )
}
