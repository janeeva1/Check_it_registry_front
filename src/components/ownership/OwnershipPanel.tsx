// "Proof of ownership" on the item page: one line saying where the owner
// stands, one button to add proof, and the history folded away.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck, ShieldAlert, Loader2, CheckCircle2, XCircle, Clock, X } from 'lucide-react'
import { apiClient, type DeviceOwnership } from '../../lib/apiClient'
import { useToast } from '../Toast'
import OwnershipBadge from './OwnershipBadge'
import ProofPicker from './ProofPicker'
import PrivateFile from './PrivateFile'

const SUMMARY: Record<string, string> = {
  registered: 'Add one document that shows this item is yours. Verified owners are trusted by buyers and can sell.',
  proof_submitted: "We're checking your proof. You'll get an email.",
  verified_owner: 'You are the verified owner.',
}

export default function OwnershipPanel({ deviceId, highlight = false, onLevelChange }: { deviceId: string; highlight?: boolean; onLevelChange?: (level: string) => void }) {
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<DeviceOwnership | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(highlight)
  const levelCb = useRef(onLevelChange)
  levelCb.current = onLevelChange

  const load = useCallback(async () => {
    try {
      setFailed(false)
      const d = await apiClient.ownership.forDevice(deviceId)
      setData(d)
      levelCb.current?.(d.level)
    } catch { setFailed(true) } finally { setLoading(false) }
  }, [deviceId])

  useEffect(() => { load() }, [load])

  if (loading) return <section className="po-card"><Loader2 className="po-spin" size={20} aria-label="Loading" /></section>
  if (failed || !data) {
    return (
      <section className="po-card">
        <p className="po-muted mb-2">Couldn't load proof of ownership.</p>
        <button className="po-btn po-btn-secondary po-btn-sm" onClick={() => { setLoading(true); load() }}>Try again</button>
      </section>
    )
  }

  const level = data.level
  const disputed = !!data.openDispute
  const canUpload = level !== 'verified_owner' || disputed

  const send = async ({ proofType, file, note }: { proofType: string; file: File; note?: string }) => {
    setBusy(true)
    try {
      await apiClient.ownership.submitProof(deviceId, { proofType, file, note })
      showSuccess('Proof sent', "We'll email you when it's checked.")
      setOpen(false)
      await load()
      return true
    } catch (e: any) {
      showError('Could not send proof', e?.message)
      return false
    } finally { setBusy(false) }
  }

  return (
    <section id="ownership" className={`po-card ${highlight || disputed ? 'is-highlighted' : ''}`} aria-labelledby="po-own-title">
      <div className="po-card-head">
        <h2 id="po-own-title" className="po-card-title">
          {disputed ? <ShieldAlert size={20} aria-hidden="true" /> : <ShieldCheck size={20} aria-hidden="true" />} Proof of ownership
        </h2>
        <OwnershipBadge level={level} compact />
      </div>

      <p className="po-card-text">
        {disputed ? 'Someone has claimed this item. If it is yours, send your proof — a receipt or papers in your name work best.' : SUMMARY[level] || SUMMARY.registered}
      </p>
      {level === 'registered' && data.proofs[0]?.status === 'rejected' && (
        <p className="po-error">Your last proof wasn't accepted: {data.proofs[0].review_note}</p>
      )}

      {canUpload && (open || disputed ? (
        <div className="po-proof-box">
          {!disputed && (
            <button type="button" className="po-icon-btn po-proof-close" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
          )}
          <ProofPicker types={data.proofTypes} busy={busy} onSubmit={send} submitLabel="Send for review" />
        </div>
      ) : (
        <button className="po-btn po-btn-primary" onClick={() => setOpen(true)}>
          {level === 'proof_submitted' ? 'Add more proof' : 'Add proof'}
        </button>
      ))}

      {data.proofs.length > 0 && (
        <details className="po-history">
          <summary>Sent so far ({data.proofs.length})</summary>
          <ul>
            {data.proofs.map((p) => (
              <li key={p.id} className="po-history-item">
                <PrivateFile fileUrl={p.file_url} label={p.proof_label} height={56} />
                <div>
                  <strong>{p.proof_label}</strong>
                  <span className={`po-status po-status-${p.status}`}>
                    {p.status === 'approved' ? <CheckCircle2 size={14} aria-hidden="true" /> : p.status === 'rejected' ? <XCircle size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
                    {p.status === 'approved' ? 'Accepted' : p.status === 'rejected' ? 'Not accepted' : 'Waiting'}
                  </span>
                  {p.review_note && <p className="po-muted">{p.review_note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
