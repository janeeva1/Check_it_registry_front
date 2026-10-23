// Admin: switch parts of the app on and off, and choose who holds
// marketplace payments until delivery. Every other payment uses Paystack.
import { useEffect, useState } from 'react'
import { Loader2, Power, Landmark, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useModules } from '../contexts/ModulesContext'

const API = import.meta.env.VITE_API_URL || '/api'
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`, 'Content-Type': 'application/json' })

type Mod = { name: string; label: string; description: string; on: boolean }
type Prov = { name: string; label: string; ready: boolean; configured: boolean; holdsFunds: boolean; active: boolean }

export default function AdminModules() {
  const { refresh } = useModules()
  const [mods, setMods] = useState<Mod[]>([])
  const [provs, setProvs] = useState<Prov[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => fetch(`${API}/modules/admin`, { headers: auth() }).then((r) => r.json())
    .then((b) => { setMods(b.modules || []); setProvs(b.escrowProviders || []) })
    .catch(() => setErr('Could not load the settings'))
    .finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggle = async (m: Mod) => {
    setBusy(m.name); setErr(''); setMsg('')
    try {
      const r = await fetch(`${API}/modules/admin/${m.name}`, { method: 'PUT', headers: auth(), body: JSON.stringify({ on: !m.on }) })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(b.error || 'Could not change it')
      setMsg(`${m.label} is now ${b.on ? 'on' : 'off'}.`); refresh(); load()
    } catch (e: any) { setErr(e.message) } finally { setBusy('') }
  }

  const choose = async (p: Prov) => {
    setBusy(p.name); setErr(''); setMsg('')
    try {
      const r = await fetch(`${API}/modules/admin/escrow/provider`, { method: 'PUT', headers: auth(), body: JSON.stringify({ provider: p.name }) })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(b.error || 'Could not change it')
      setMsg(`New marketplace sales will use ${p.label}. Sales already paid stay with the provider that took them.`); load()
    } catch (e: any) { setErr(e.message) } finally { setBusy('') }
  }

  return (
    <Layout requireAuth>
      <div className="po-page po-single" style={{ maxWidth: 760 }}>
        <h1 className="po-hello">Modules & payments</h1>
        {msg && <p className="po-text-success" role="status"><CheckCircle2 size={16} aria-hidden="true" /> {msg}</p>}
        {err && <p className="po-error" role="alert">{err}</p>}
        {loading ? <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div> : (
          <>
            <section className="po-card" data-testid="modules">
              <h2 className="po-card-title"><Power size={18} aria-hidden="true" /> Modules</h2>
              <p className="po-muted mb-0">Switch a part of the app off while it isn't ready. Customers then see "coming soon"; admins can still use it to prepare.</p>
              <ul className="po-simple-list w-100">
                {mods.map((m) => (
                  <li key={m.name} className="po-simple-row" style={{ cursor: 'default' }}>
                    <span className="po-simple-main"><strong>{m.label}</strong><span>{m.description}</span></span>
                    <span className={`po-badge po-badge-${m.on ? 'success' : 'neutral'}`}>{m.on ? 'On' : 'Off'}</span>
                    <button className={`po-btn ${m.on ? 'po-btn-secondary' : 'po-btn-primary'}`} disabled={!!busy} onClick={() => toggle(m)} aria-label={`${m.on ? 'Switch off' : 'Switch on'} ${m.label}`}>
                      {busy === m.name && <Loader2 size={16} className="po-spin" aria-hidden="true" />} {m.on ? 'Switch off' : 'Switch on'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="po-card" data-testid="escrow-providers">
              <h2 className="po-card-title"><Landmark size={18} aria-hidden="true" /> Marketplace escrow</h2>
              <p className="po-muted mb-0">Who holds a buyer's money until they confirm delivery. Report, release, check and verification fees always use Paystack.</p>
              <ul className="po-simple-list w-100">
                {provs.map((p) => (
                  <li key={p.name} className="po-simple-row" style={{ cursor: 'default' }}>
                    <span className="po-simple-main">
                      <strong>{p.label}</strong>
                      <span>
                        {!p.ready ? 'Not ready: needs its API documentation to finish the connection.'
                          : !p.configured ? 'API keys not set on the server yet.'
                          : p.holdsFunds ? 'Ready. The provider holds the money.' : 'Ready. The money waits in our account with this provider.'}
                      </span>
                    </span>
                    {p.active ? <span className="po-badge po-badge-success">In use</span>
                      : !p.configured && p.ready ? <span className="po-badge po-badge-warning"><AlertTriangle size={12} aria-hidden="true" /> No keys</span> : null}
                    {!p.active && (
                      <button className="po-btn po-btn-secondary" disabled={!!busy || !p.ready} onClick={() => choose(p)} aria-label={`Use ${p.label}`}>
                        {busy === p.name && <Loader2 size={16} className="po-spin" aria-hidden="true" />} Use this
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}
