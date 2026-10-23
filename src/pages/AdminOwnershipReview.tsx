// Admin queue: check ownership proofs and decide ownership disputes.
import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, Scale, Loader2, Check, X, RefreshCw, Inbox } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { apiClient } from '../lib/apiClient'
import PrivateFile from '../components/ownership/PrivateFile'
import { CategoryIcon, categoryLabel } from '../utils/categories'

type Proof = {
  id: string; proof_type: string; proof_label: string; file_url: string; note?: string; created_at: string; status: string; review_note?: string
  device_id: string; brand: string; model: string; category: string; imei?: string; serial?: string; vin?: string; license_plate?: string; device_status: string
  owner_id: string; owner_name: string; owner_email: string; owner_kyc?: string
}
type DisputeProof = { id: string; user_id: string; proof_label: string; file_url: string; note?: string; status: string; created_at: string; side: 'claimant' | 'owner' }
type Dispute = {
  id: string; status: string; statement: string; created_at: string; resolution_note?: string
  device_id: string; brand: string; model: string; category: string; imei?: string; serial?: string; vin?: string
  claimant_name: string; claimant_email: string; claimant_kyc?: string
  owner_name: string; owner_email: string; owner_kyc?: string
  proofs: DisputeProof[]
}

const REJECT_REASONS = [
  'The photo is unclear — please send a sharper one',
  "The name on the document doesn't match your account",
  "The numbers on the document don't match this item",
  "This document doesn't show ownership",
]

const ids = (d: { imei?: string; serial?: string; vin?: string; license_plate?: string }) =>
  [d.imei && `IMEI ${d.imei}`, d.serial && `Serial ${d.serial}`, d.vin && `VIN ${d.vin}`, d.license_plate && `Plate ${d.license_plate}`].filter(Boolean).join(' · ')

const kyc = (s?: string) => <span className={`po-badge po-badge-${s === 'verified' ? 'success' : 'neutral'}`}>{s === 'verified' ? 'ID verified' : 'ID not verified'}</span>

function ProofCard({ p, onDone }: { p: Proof; onDone: () => void }) {
  const { showSuccess, showError } = useToast()
  const [mode, setMode] = useState<'idle' | 'reject'>('idle')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const decide = async (decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !note.trim()) return
    setBusy(true)
    try {
      await apiClient.ownership.reviewProof(p.id, decision, note.trim() || undefined)
      showSuccess(decision === 'approve' ? 'Owner verified' : 'Proof rejected', decision === 'approve' ? `${p.owner_name} is now the verified owner.` : 'The owner has been told why.')
      onDone()
    } catch (e: any) { showError('Could not save', e?.message) } finally { setBusy(false) }
  }

  return (
    <article className="modern-card po-review-card">
      <PrivateFile fileUrl={p.file_url} label={p.proof_label} height={220} />
      <div className="po-review-body">
        <div className="po-review-head">
          <CategoryIcon category={p.category} size={20} />
          <div>
            <h3>{p.brand} {p.model}</h3>
            <p className="po-muted po-mono">{categoryLabel(p.category)}{ids(p) ? ` · ${ids(p)}` : ''}</p>
          </div>
        </div>
        <dl className="po-dl po-dl-compact">
          <div><dt>Proof</dt><dd><strong>{p.proof_label}</strong></dd></div>
          <div><dt>Owner</dt><dd>{p.owner_name}<br /><span className="po-muted">{p.owner_email}</span></dd></div>
          <div><dt>Identity</dt><dd>{kyc(p.owner_kyc)}</dd></div>
          <div><dt>Sent</dt><dd>{new Date(p.created_at).toLocaleString()}</dd></div>
        </dl>
        {p.note && <p className="po-quote">“{p.note}”</p>}
        <p className="po-help">Check that the document names this person (or matches their ID) and shows the same IMEI / serial / VIN.</p>

        {p.status !== 'pending' ? (
          <p className="po-muted">{p.status === 'approved' ? 'Approved' : `Rejected: ${p.review_note || ''}`}</p>
        ) : mode === 'reject' ? (
          <div className="po-field">
            <span className="po-label">Why? The owner will see this.</span>
            <div className="po-chip-row">
              {REJECT_REASONS.map((r) => <button key={r} type="button" className={`po-chip ${note === r ? 'is-selected' : ''}`} onClick={() => setNote(r)}>{r}</button>)}
            </div>
            <textarea className="modern-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Or write a reason" aria-label="Reason for rejecting" />
            <div className="po-actions">
              <button className="po-btn po-btn-secondary" onClick={() => { setMode('idle'); setNote('') }}>Back</button>
              <button className="po-btn po-btn-danger" onClick={() => decide('reject')} disabled={busy || !note.trim()}>{busy && <Loader2 size={16} className="po-spin" aria-hidden="true" />} Reject proof</button>
            </div>
          </div>
        ) : (
          <div className="po-actions">
            <button className="po-btn po-btn-secondary" onClick={() => setMode('reject')} disabled={busy}><X size={16} aria-hidden="true" /> Reject</button>
            <button className="po-btn po-btn-primary" onClick={() => decide('approve')} disabled={busy}>{busy ? <Loader2 size={16} className="po-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />} Approve owner</button>
          </div>
        )}
      </div>
    </article>
  )
}

function DisputeCard({ d, onDone }: { d: Dispute; onDone: () => void }) {
  const { showSuccess, showError } = useToast()
  const confirm = useConfirm()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const side = (s: 'claimant' | 'owner') => d.proofs.filter((p) => p.side === s)

  const resolve = async (decision: 'claimant' | 'owner') => {
    if (!note.trim()) { showError('Add a reason first', 'Both people will see it.'); return }
    const ok = await confirm({
      title: decision === 'claimant' ? `Give the item to ${d.claimant_name}?` : `Keep the item with ${d.owner_name}?`,
      message: decision === 'claimant'
        ? 'The item moves to the claimant as verified owner. Any listing or transfer by the current owner is cancelled.'
        : 'The claim is closed and the item goes back to its previous state.',
      confirmLabel: 'Confirm decision', danger: decision === 'claimant',
    })
    if (!ok) return
    setBusy(true)
    try {
      await apiClient.ownership.resolveDispute(d.id, decision, note.trim())
      showSuccess('Dispute resolved')
      onDone()
    } catch (e: any) { showError('Could not resolve', e?.message) } finally { setBusy(false) }
  }

  const column = (title: string, name: string, email: string, k: string | undefined, proofs: DisputeProof[], extra?: React.ReactNode) => (
    <div className="po-side">
      <h4>{title}</h4>
      <p className="mb-1"><strong>{name}</strong></p>
      <p className="po-muted mb-2">{email}</p>
      {kyc(k)}
      {extra}
      <div className="po-side-proofs">
        {proofs.length === 0 ? <p className="po-muted">No proof sent yet.</p> : proofs.map((p) => (
          <figure key={p.id}>
            <PrivateFile fileUrl={p.file_url} label={p.proof_label} height={140} />
            <figcaption>{p.proof_label}{p.note ? ` — ${p.note}` : ''}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )

  return (
    <article className="modern-card po-dispute-card">
      <div className="po-review-head">
        <CategoryIcon category={d.category} size={20} />
        <div>
          <h3>{d.brand} {d.model}</h3>
          <p className="po-muted po-mono">{categoryLabel(d.category)}{ids(d) ? ` · ${ids(d)}` : ''} · opened {new Date(d.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="po-sides">
        {column('Claimant', d.claimant_name, d.claimant_email, d.claimant_kyc, side('claimant'), <p className="po-quote">“{d.statement}”</p>)}
        {column('Registered owner', d.owner_name, d.owner_email, d.owner_kyc, side('owner'))}
      </div>
      {d.status === 'open' ? (
        <div className="po-field">
          <label className="po-label" htmlFor={`note-${d.id}`}>Decision reason (both people will see this)</label>
          <textarea id={`note-${d.id}`} className="modern-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="po-actions">
            <button className="po-btn po-btn-secondary" onClick={() => resolve('owner')} disabled={busy}>Keep with owner</button>
            <button className="po-btn po-btn-primary" onClick={() => resolve('claimant')} disabled={busy}>Give to claimant</button>
          </div>
        </div>
      ) : <p className="po-muted">{d.status === 'awarded_claimant' ? 'Given to claimant' : 'Kept with owner'} — {d.resolution_note}</p>}
    </article>
  )
}

export default function AdminOwnershipReview() {
  const [tab, setTab] = useState<'proofs' | 'disputes'>('proofs')
  const [status, setStatus] = useState('pending')
  const [proofs, setProofs] = useState<Proof[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      if (tab === 'proofs') setProofs(((await apiClient.ownership.adminProofs(status)) as any)?.proofs || [])
      else setDisputes(((await apiClient.ownership.adminDisputes(status === 'pending' ? 'open' : status)) as any)?.disputes || [])
    } catch (e: any) { setError(e?.message || 'Could not load') } finally { setLoading(false) }
  }, [tab, status])

  useEffect(() => { load() }, [load])

  const filters = tab === 'proofs'
    ? [['pending', 'To check'], ['approved', 'Approved'], ['rejected', 'Rejected']]
    : [['pending', 'Open'], ['awarded_claimant', 'Given to claimant'], ['rejected', 'Kept with owner']]
  const list = tab === 'proofs' ? proofs : disputes

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="po-page">
        <header className="po-page-head">
          <span className="po-item-icon"><ShieldCheck size={24} aria-hidden="true" /></span>
          <div>
            <h1>Ownership review</h1>
            <p className="po-muted">Approve proofs so owners show as verified, and decide claims between two people.</p>
          </div>
          <button className="po-btn po-btn-ghost ms-auto" onClick={load} aria-label="Refresh"><RefreshCw size={18} aria-hidden="true" /></button>
        </header>

        <div className="po-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'proofs'} className={tab === 'proofs' ? 'is-active' : ''} onClick={() => { setTab('proofs'); setStatus('pending') }}><ShieldCheck size={16} aria-hidden="true" /> Proofs</button>
          <button role="tab" aria-selected={tab === 'disputes'} className={tab === 'disputes' ? 'is-active' : ''} onClick={() => { setTab('disputes'); setStatus('pending') }}><Scale size={16} aria-hidden="true" /> Disputes</button>
        </div>
        <div className="po-chip-row mb-3">
          {filters.map(([k, label]) => <button key={k} className={`po-chip ${status === k ? 'is-selected' : ''}`} onClick={() => setStatus(k)}>{label}</button>)}
        </div>

        {loading ? (
          <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div>
        ) : error ? (
          <div className="modern-card p-4"><p className="po-error">{error}</p><button className="po-btn po-btn-secondary" onClick={load}>Try again</button></div>
        ) : list.length === 0 ? (
          <div className="modern-card p-5 text-center po-muted"><Inbox size={36} aria-hidden="true" /><p className="mt-2 mb-0">Nothing here. Nice work.</p></div>
        ) : tab === 'proofs' ? (
          <div className="po-review-grid">{proofs.map((p) => <ProofCard key={p.id} p={p} onDone={load} />)}</div>
        ) : (
          <div className="po-stack">{disputes.map((d) => <DisputeCard key={d.id} d={d} onDone={load} />)}</div>
        )}
      </div>
    </Layout>
  )
}
