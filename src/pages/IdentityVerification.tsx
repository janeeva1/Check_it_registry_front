// Confirm your identity with your NIN (free). It's also asked on every
// report; this page lets people do it ahead of time. The wording is the same
// every time, and the saved NIN is never shown back.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Fingerprint, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Layout } from '../components/Layout'
import { apiClient } from '../lib/apiClient'

export default function IdentityVerification() {
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [nin, setNin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient.security.identityStatus()
      .then((s: any) => setConfirmed(!!s?.identity_confirmed))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await apiClient.security.verifyNIN({ nin })
      setConfirmed(true); setNin('')
    } catch (err: any) {
      setError(err?.message || 'We could not confirm your identity.')
    } finally { setBusy(false) }
  }

  return (
    <Layout requireAuth>
      <div className="po-page po-single" style={{ maxWidth: 560 }}>
        <h1 className="po-hello">Your identity</h1>
        {loading ? <div className="po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div>
          : confirmed ? (
            <section className="po-card po-center-card" data-testid="identity-confirmed">
              <CheckCircle2 size={48} className="po-text-success" aria-hidden="true" />
              <h2 className="po-card-title">Your identity is confirmed</h2>
              <p className="po-card-text">Your name is now locked to your NIN; contact support if it needs correcting. You'll still enter your NIN each time you file a report.</p>
              <Link to="/my-devices" className="po-btn po-btn-primary">Go to My items</Link>
            </section>
          ) : (
            <form className="po-card" onSubmit={submit}>
              <div className="d-flex align-items-center gap-3">
                <Fingerprint size={28} className="po-text-success" aria-hidden="true" />
                <div>
                  <h2 className="po-card-title mb-0">Confirm your identity</h2>
                  <p className="po-muted mb-0">Enter your 11-digit National Identification Number (NIN). We check it against the name on your account.</p>
                </div>
              </div>
              <label className="po-label" htmlFor="id-nin">NIN</label>
              <input id="id-nin" className="modern-input po-mono" inputMode="numeric" autoComplete="off" maxLength={11} placeholder="11 digits"
                value={nin} onChange={(e) => { setNin(e.target.value.replace(/\D/g, '').slice(0, 11)); setError('') }} />
              {error && <p className="po-error mb-0" role="alert">{error}</p>}
              <p className="po-help mb-0"><ShieldCheck size={14} aria-hidden="true" /> Make sure the name on your account is exactly the name on your NIN. Your NIN is stored encrypted and never shown to anyone.</p>
              <button type="submit" className="po-btn po-btn-primary" disabled={busy || nin.length !== 11}>
                {busy ? <Loader2 size={18} className="po-spin" aria-hidden="true" /> : null} Confirm
              </button>
            </form>
          )}
      </div>
    </Layout>
  )
}
