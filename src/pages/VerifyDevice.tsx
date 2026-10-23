// Opened from the "confirm your item" email: confirms the registration with
// the link's token. (It used to call an address that did not exist.)
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react'
import { Layout } from '../components/Layout'

const API = import.meta.env.VITE_API_URL || '/api'

export default function VerifyDevice() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'failed'>(token ? 'working' : 'idle')
  const [message, setMessage] = useState('')
  const [device, setDevice] = useState<{ id: string; brand: string; model: string } | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API}/device-management/verify-device-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const b = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(b.error || 'This link did not work')
        setDevice(b.device || null)
        setMessage(b.message || '')
        setState('done')
      })
      .catch((e) => { setMessage(e.message); setState('failed') })
  }, [token])

  return (
    <Layout>
      <div className="po-page po-single" style={{ maxWidth: 520 }}>
        <section className="po-card po-center-card">
          {state === 'working' && <><Loader2 size={40} className="po-spin" aria-hidden="true" /><h1 className="po-card-title">Confirming your item…</h1></>}
          {state === 'done' && (
            <>
              <CheckCircle2 size={48} className="po-text-success" aria-hidden="true" />
              <h1 className="po-card-title">{device ? `${device.brand} ${device.model} is confirmed` : 'Item confirmed'}</h1>
              <p className="po-card-text">It's now active in your name. Next, add proof of ownership so buyers see you as the verified owner.</p>
              <Link to={device ? `/device/${device.id}` : '/my-devices'} className="po-btn po-btn-primary">Open the item</Link>
            </>
          )}
          {state === 'failed' && (
            <>
              <XCircle size={48} style={{ color: 'var(--po-danger-fg)' }} aria-hidden="true" />
              <h1 className="po-card-title">This link didn't work</h1>
              <p className="po-card-text">{message} Links expire after 24 hours. Open the item from My items and choose "Email me a code" to confirm it another way.</p>
              <Link to="/my-devices" className="po-btn po-btn-primary">Go to My items</Link>
            </>
          )}
          {state === 'idle' && (
            <>
              <MailCheck size={44} className="po-text-success" aria-hidden="true" />
              <h1 className="po-card-title">Confirm an item</h1>
              <p className="po-card-text">Open the link in the email we sent when you registered. No email? Open the item from My items and choose "Email me a code".</p>
              <Link to="/my-devices" className="po-btn po-btn-primary">Go to My items</Link>
            </>
          )}
        </section>
      </div>
    </Layout>
  )
}
