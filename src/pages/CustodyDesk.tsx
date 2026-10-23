// Admin and police: items Prove Ownership is holding after a stolen/lost
// report. Mark one found, hand it back once the owner has paid the release
// fee, or (admin only) waive the fee.
import { useEffect, useState } from 'react'
import { Loader2, Landmark } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { formatNaira } from '../utils/categories'

const API = import.meta.env.VITE_API_URL || '/api'
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`, 'Content-Type': 'application/json' })
const STATE: Record<string, [string, string]> = {
  held: ['Held', 'warning'], found: ['Found — waiting for release fee', 'info'], release_paid: ['Paid — hand it back', 'success'],
  released: ['Released', 'neutral'], closed: ['Closed', 'neutral'],
}

export default function CustodyDesk() {
  const { user } = useAuth()
  const isAdmin = ['admin', 'super_admin'].includes(user?.role || '')
  const [tab, setTab] = useState('open')
  const [items, setItems] = useState<any[]>([])
  const [fee, setFee] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`${API}/custody/desk?status=${tab}`, { headers: auth() }).then((r) => r.json())
      .then((b) => { setItems(b.items || []); setFee(Number(b.release_fee) || 0) })
      .catch(() => setErr('Could not load held items'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (id: string, action: 'found' | 'handover' | 'waive') => {
    let note = ''
    if (action === 'found') note = window.prompt('Where was it found? (optional)') || ''
    setBusy(id + action); setErr('')
    try {
      const r = await fetch(`${API}/custody/${id}/${action}`, { method: 'POST', headers: auth(), body: JSON.stringify({ note }) })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(b.error || 'That did not work')
      load()
    } catch (e: any) { setErr(e.message) } finally { setBusy('') }
  }

  return (
    <Layout requireAuth>
      <div className="po-page">
        <h1 className="po-hello">Held items</h1>
        <p className="po-muted" style={{ marginTop: -12 }}>Items reported stolen or lost are held by Prove Ownership. The owner pays the release fee ({formatNaira(fee)}) to get one back.</p>
        <div className="po-chip-row po-scroll-x mb-3" role="tablist">
          {[['open', 'Open'], ['released', 'Released'], ['closed', 'Closed']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`po-chip ${tab === k ? 'is-selected' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {err && <p className="po-error" role="alert">{err}</p>}
        {loading ? <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div>
          : items.length === 0 ? <div className="po-empty-simple"><Landmark size={32} aria-hidden="true" /><p>Nothing here.</p></div>
          : (
            <ul className="po-simple-list" data-testid="custody-desk">
              {items.map((c) => {
                const [label, tone] = STATE[c.status] || [c.status, 'neutral']
                const owner = [c.owner_first_name, c.owner_last_name].filter(Boolean).join(' ') || c.owner_name
                return (
                  <li key={c.id} className="po-card" style={{ marginBottom: 10 }}>
                    <div className="d-flex flex-wrap justify-content-between gap-2 w-100">
                      <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                        <strong>{[c.brand, c.model].filter(Boolean).join(' ')}</strong> <span className={`po-badge po-badge-${tone}`}>{label}</span>
                        <div className="po-muted">{c.imei || c.serial || c.vin} · case {c.case_id || '—'} · reported {c.report_type}</div>
                        <div className="po-muted">Owner: {owner}{c.owner_phone ? ` · ${c.owner_phone}` : ''}{c.owner_email ? ` · ${c.owner_email}` : ''}</div>
                        {c.found_note && <div className="po-muted">Found: {c.found_note}</div>}
                      </div>
                      <div className="d-flex flex-wrap gap-2 align-items-start">
                        {c.status === 'held' && <button className="po-btn po-btn-secondary" disabled={!!busy} onClick={() => act(c.id, 'found')}>Mark found</button>}
                        {c.status === 'release_paid' && <button className="po-btn po-btn-primary" disabled={!!busy} onClick={() => act(c.id, 'handover')}>Handed back to owner</button>}
                        {isAdmin && ['held', 'found'].includes(c.status) && <button className="po-btn po-btn-ghost" disabled={!!busy} onClick={() => act(c.id, 'waive')}>Waive fee</button>}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
      </div>
    </Layout>
  )
}
