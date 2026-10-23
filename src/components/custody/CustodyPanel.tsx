// On an item's page: while an item is reported stolen or lost, Prove
// Ownership is its temporary holder. When it's found, or the owner has it
// back, the owner pays the release fee (set by the admin) to get it back.
import { useEffect, useState } from 'react'
import { Landmark, Loader2, CheckCircle2, PackageSearch } from 'lucide-react'
import { PaymentGate } from '../PaymentGate'
import { formatNaira } from '../../utils/categories'

const API = import.meta.env.VITE_API_URL || '/api'
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`, 'Content-Type': 'application/json' })

type Custody = { id: string; status: 'held' | 'found' | 'release_paid'; held_since?: string; found_at?: string; release_paid_at?: string }

export default function CustodyPanel({ deviceId, onReleased }: { deviceId: string; onReleased?: () => void }) {
  const [c, setC] = useState<Custody | null>(null)
  const [fee, setFee] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [pay, setPay] = useState(false)

  const load = () => fetch(`${API}/custody/device/${deviceId}`, { headers: auth() })
    .then((r) => r.json()).then((b) => { setC(b.custody || null); setFee(Number(b.release_fee) || 0) }).catch(() => {})
  useEffect(() => { load() }, [deviceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const release = async (ref?: string) => {
    if (!c) return
    setBusy(true); setErr('')
    try {
      const r = await fetch(`${API}/custody/${c.id}/release`, { method: 'POST', headers: auth(), body: JSON.stringify({ pay_by_pass: ref }) })
      const b = await r.json().catch(() => ({}))
      if (b.requiresPayment) { setPay(true); return }
      if (!r.ok) throw new Error(b.error || 'Could not release the item')
      setMsg(b.message || 'Done')
      if (b.status === 'released') onReleased?.()
      load()
    } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }

  if (!c) return null
  const since = c.held_since ? new Date(c.held_since).toLocaleDateString() : ''
  return (
    <section className="po-card is-highlighted" aria-labelledby="custody-title" data-testid="custody-panel">
      <div className="d-flex align-items-start gap-3">
        {c.status === 'found' ? <PackageSearch size={26} aria-hidden="true" /> : <Landmark size={26} aria-hidden="true" />}
        <div className="flex-grow-1">
          <h2 id="custody-title" className="po-card-title mb-1">
            {c.status === 'held' && 'Held by Prove Ownership'}
            {c.status === 'found' && 'Your item has been found'}
            {c.status === 'release_paid' && 'Release fee paid'}
          </h2>
          <p className="po-card-text mb-0">
            {c.status === 'held' && <>Since you reported it{since ? ` on ${since}` : ''}, Prove Ownership is its temporary holder. Nobody can sell, transfer or register it, and anyone who checks it is told it's held. You stay the owner on record.</>}
            {c.status === 'found' && <>To get it back, pay the release fee{fee ? ` of ${formatNaira(fee)}` : ''}. The police or our team will then hand it back to you.</>}
            {c.status === 'release_paid' && <>The police or our team will contact you to hand it back. Bring an ID that matches your account.</>}
          </p>
          {msg && <p className="po-text-success mb-0 mt-2"><CheckCircle2 size={15} aria-hidden="true" /> {msg}</p>}
          {err && <p className="po-error mb-0 mt-2" role="alert">{err}</p>}
          <div className="po-actions po-actions-start mt-3">
            {c.status === 'found' && <button className="po-btn po-btn-primary" disabled={busy} onClick={() => release()}>{busy && <Loader2 size={16} className="po-spin" aria-hidden="true" />} Pay release fee{fee ? ` (${formatNaira(fee)})` : ''}</button>}
            {c.status === 'held' && <button className="po-btn po-btn-secondary" disabled={busy} onClick={() => release()}>I have it back{fee ? ` — pay release fee (${formatNaira(fee)})` : ''}</button>}
          </div>
        </div>
      </div>
      <PaymentGate isOpen={pay} onClose={() => setPay(false)} feeType="device_release_fee" feeLabel="Release fee"
        description="Fee to release your item from Prove Ownership's hold" onSuccess={(ref) => { setPay(false); release(ref) }} />
    </section>
  )
}
