// "This item is mine": claim an item registered to another account.
// Reached from registration (when the number is already taken), from a
// check result, or from the menu.
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Scale, Search, Loader2, ShieldAlert, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { apiClient, type ClaimableItem } from '../lib/apiClient'
import ProofPicker from '../components/ownership/ProofPicker'
import { CategoryIcon, categoryLabel } from '../utils/categories'

type Claim = { id: string; status: string; created_at: string; resolved_at?: string; resolution_note?: string; brand: string; model: string; category: string }

const CLAIM_STATUS: Record<string, { label: string; icon: typeof Clock; tone: string }> = {
  open: { label: 'Under review', icon: Clock, tone: 'info' },
  awarded_claimant: { label: 'Accepted — now yours', icon: CheckCircle2, tone: 'success' },
  rejected: { label: 'Not accepted', icon: XCircle, tone: 'danger' },
}

export default function ClaimOwnership() {
  const [params] = useSearchParams()
  const { showSuccess, showError } = useToast()
  const [identifier, setIdentifier] = useState(params.get('identifier') || '')
  const [item, setItem] = useState<ClaimableItem | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [looking, setLooking] = useState(false)
  const [statement, setStatement] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [claims, setClaims] = useState<Claim[]>([])

  const loadClaims = () => apiClient.ownership.myClaims().then((r: any) => setClaims(r?.claims || [])).catch(() => {})

  const lookup = async (value = identifier) => {
    const v = value.trim()
    if (!v) { setLookupError('Enter the IMEI, serial number or VIN.'); return }
    setLooking(true); setLookupError(''); setItem(null)
    try { setItem(await apiClient.ownership.lookupClaim(v)) } catch (e: any) { setLookupError(e?.message || 'Could not look up this number') } finally { setLooking(false) }
  }

  useEffect(() => {
    loadClaims()
    if (params.get('identifier')) lookup(params.get('identifier') || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async ({ proofType, file }: { proofType: string; file: File }) => {
    if (statement.trim().length < 20) { showError('Tell us a bit more', 'Explain in a sentence or two how you got this item (at least 20 characters).'); return false }
    setBusy(true)
    try {
      await apiClient.ownership.fileClaim({ identifier: identifier.trim(), statement: statement.trim(), proofType, file })
      setDone(true)
      showSuccess('Claim sent', 'Our team will review it and email you.')
      loadClaims()
      return true
    } catch (e: any) { showError('Could not send your claim', e?.message); return false } finally { setBusy(false) }
  }

  return (
    <Layout requireAuth>
      <div className="po-page po-narrow">
        <header className="po-page-head">
          <span className="po-item-icon"><Scale size={24} aria-hidden="true" /></span>
          <div>
            <h1>Claim an item that's yours</h1>
            <p className="po-muted">If someone else registered your item, send us proof. We review both sides and the item stays marked as disputed until we decide.</p>
          </div>
        </header>

        {done ? (
          <section className="modern-card p-4 po-panel text-center">
            <CheckCircle2 size={40} className="po-text-success" aria-hidden="true" />
            <h2 className="po-panel-title justify-content-center">Your claim is in</h2>
            <p className="po-muted">We've told the current owner and asked for their proof. Most claims are decided within 7 days. You'll get an email either way.</p>
            <div className="po-actions justify-content-center">
              <Link to="/dashboard" className="po-btn po-btn-secondary">Back to home</Link>
              <button className="po-btn po-btn-primary" onClick={() => { setDone(false); setItem(null); setIdentifier(''); setStatement('') }}>Claim another item</button>
            </div>
          </section>
        ) : (
          <section className="modern-card p-4 po-panel">
            <form className="po-field" onSubmit={(e) => { e.preventDefault(); lookup() }}>
              <label className="po-label" htmlFor="claim-id">IMEI, serial number or VIN</label>
              <div className="po-inline-form">
                <input id="claim-id" className="modern-input" autoComplete="off" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setItem(null) }} placeholder="e.g. 356938035643809" />
                <button className="po-btn po-btn-primary" type="submit" disabled={looking}>
                  {looking ? <Loader2 size={16} className="po-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />} Find
                </button>
              </div>
              {lookupError && <p className="po-error" role="alert">{lookupError} {lookupError.includes('register it') && <Link to="/register-device">Register it</Link>}</p>}
            </form>

            {item && (
              <>
                <div className="po-found">
                  <CategoryIcon category={item.category} size={22} />
                  <div>
                    <strong>{item.brand} {item.model}</strong>
                    <span className="po-muted">{categoryLabel(item.category)} · registered to another account</span>
                  </div>
                </div>
                <div className="po-callout po-callout-warning">
                  <ShieldAlert size={20} aria-hidden="true" />
                  <p>Only claim items that are really yours. False claims are logged and can get your account suspended.</p>
                </div>
                <ProofPicker types={item.proofTypes} busy={busy} onSubmit={submit} submitLabel="Send claim" canSubmit={statement.trim().length >= 20}>
                  <div className="po-field">
                    <label className="po-label" htmlFor="claim-statement">3. How did you get this item?</label>
                    <textarea id="claim-statement" className="modern-textarea" rows={4} maxLength={2000} value={statement} onChange={(e) => setStatement(e.target.value)}
                      placeholder="e.g. I bought it new at Slot, Ikeja in March 2025. It was stolen from my car in June." />
                    <p className="po-help">{statement.trim().length < 20 ? `At least 20 characters (${statement.trim().length}/20)` : 'Thanks — this helps our team.'}</p>
                  </div>
                </ProofPicker>
              </>
            )}
          </section>
        )}

        {claims.length > 0 && (
          <section className="modern-card p-4 po-panel" aria-labelledby="my-claims">
            <h2 id="my-claims" className="po-panel-title">Your claims</h2>
            <ul className="po-list">
              {claims.map((c) => {
                const s = CLAIM_STATUS[c.status] || CLAIM_STATUS.open
                const Icon = s.icon
                return (
                  <li key={c.id} className="po-list-row">
                    <CategoryIcon category={c.category} size={20} />
                    <div className="po-list-main">
                      <strong>{c.brand} {c.model}</strong>
                      <span className="po-muted">Sent {new Date(c.created_at).toLocaleDateString()}{c.resolution_note ? ` · ${c.resolution_note}` : ''}</span>
                    </div>
                    <span className={`po-badge po-badge-${s.tone}`}><Icon size={14} aria-hidden="true" /> {s.label}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </Layout>
  )
}
