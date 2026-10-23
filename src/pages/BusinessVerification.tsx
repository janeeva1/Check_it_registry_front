// Verify the business with its CAC registration number. The business
// verification fee is paid once; an attempt that fails keeps the payment for
// the next try. The account holder must be one of the company's directors,
// or confirm their own NIN first.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, Loader2, CreditCard } from 'lucide-react'
import { Layout } from '../components/Layout'
import { PaymentGate } from '../components/PaymentGate'
import { apiClient } from '../lib/apiClient'

const PAID_KEY = 'po_business_payment'

export default function BusinessVerification() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<any>(null)
  const [rc, setRc] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [paid, setPaid] = useState<string>(() => { try { return sessionStorage.getItem(PAID_KEY) || '' } catch { return '' } })
  const remember = (ref: string) => { setPaid(ref); try { ref ? sessionStorage.setItem(PAID_KEY, ref) : sessionStorage.removeItem(PAID_KEY) } catch { /* blocked */ } }

  const load = () => apiClient.security.getVerificationStatus()
    .then((s: any) => { setStatus(s); if (s?.rcNumber && !rc) setRc(String(s.rcNumber).toUpperCase()) })
    .catch(() => setStatus(null))
    .finally(() => setLoading(false))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async (ref = paid) => {
    setBusy(true); setError('')
    try {
      const r: any = await apiClient.security.verifyCAC({ rcNumber: rc, pay_by_pass: ref || undefined } as any)
      if (r?.requiresPayment) { remember(''); setShowPay(true); return }
      remember('')
      await load()
    } catch (err: any) {
      const d = err?.data || {}
      if (d.requiresPayment) { remember(''); setShowPay(true); return }
      setError(err?.message || 'We could not verify this business.')
    } finally { setBusy(false) }
  }

  const verified = status?.verificationStatus === 'verified'
  if (loading) return <Layout requireAuth><div className="po-page po-center py-5"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div></Layout>

  return (
    <Layout requireAuth>
      <div className="po-page po-single" style={{ maxWidth: 600 }}>
        <h1 className="po-hello">Business verification</h1>
        {!status?.profileId ? (
          <section className="po-card">
            <p className="po-card-text">Add your business details first.</p>
            <Link to="/business-register" className="po-btn po-btn-primary">Add business details</Link>
          </section>
        ) : verified ? (
          <section className="po-card po-center-card" data-testid="business-verified">
            <CheckCircle2 size={48} className="po-text-success" aria-hidden="true" />
            <h2 className="po-card-title">{status.businessName} is verified</h2>
            <p className="po-card-text">Your business name and registration number are now locked. Contact support if they need correcting.</p>
            <Link to="/business" className="po-btn po-btn-primary">Go to your business home</Link>
          </section>
        ) : (
          <form className="po-card" onSubmit={(e) => { e.preventDefault(); verify() }}>
            <div className="d-flex align-items-center gap-3">
              <Building2 size={28} className="po-text-success" aria-hidden="true" />
              <div>
                <h2 className="po-card-title mb-0">{status.businessName}</h2>
                <p className="po-muted mb-0">We check your registration with the Corporate Affairs Commission (CAC). You must be one of the company's directors, or <Link to="/identity-verification">confirm your own NIN</Link> first.</p>
              </div>
            </div>
            <label className="po-label" htmlFor="biz-rc">Registration number (RC or BN)</label>
            <input id="biz-rc" className="modern-input po-mono" autoComplete="off" placeholder="e.g. RC1234567" value={rc}
              onChange={(e) => { setRc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)); setError('') }} />
            {paid && <p className="po-help mb-0"><CreditCard size={14} aria-hidden="true" /> Fee paid. It's kept until your business is verified.</p>}
            {error && <p className="po-error mb-0" role="alert">{error}</p>}
            <button type="submit" className="po-btn po-btn-primary" disabled={busy || rc.length < 5}>
              {busy ? <Loader2 size={18} className="po-spin" aria-hidden="true" /> : null} {paid ? 'Verify business' : 'Pay and verify'}
            </button>
          </form>
        )}
      </div>
      <PaymentGate isOpen={showPay} onClose={() => setShowPay(false)} feeType="business_verification_fee" feeLabel="Business verification"
        description="One-off fee to verify your business" onSuccess={(ref) => { setShowPay(false); remember(ref); verify(ref) }} />
    </Layout>
  )
}
