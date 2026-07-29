import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Shield, CreditCard, Loader2, CheckCircle, AlertTriangle, ArrowLeft, MapPin } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

type Listing = { id: string; title: string; price: number; brand?: string; model?: string; images?: string[]; seller_name?: string }

declare global {
  interface Window { PaystackPop: any }
}

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

export default function Checkout() {
  const { user } = useAuth()
  const { items: cartItems, clearCart, total: cartTotal } = useCart()
  const _navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [agreed, setAgreed] = useState(false)

  const listingId = searchParams.get('listing') || ''
  const isCart = searchParams.get('cart') === 'true'

  const checkoutItems = isCart ? cartItems : (listing ? [{ ...listing, quantity: 1, image: listing.images?.[0] || '', location: '', condition: '' }] : [])
  const totalAmount = isCart ? cartTotal : (listing ? listing.price : 0)

  useEffect(() => {
    if (isCart) { setLoading(false); return }
    const fetchListing = async () => {
      try {
        setLoading(true)
        if (!listingId) return
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/listings/${listingId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Listing not found')
        const data = await res.json()
        setListing(data.data || data)
      } catch { setListing(null) } finally { setLoading(false) }
    }
    fetchListing()
  }, [listingId, isCart])

  useEffect(() => {
    if (!document.getElementById('paystack-script')) {
      const script = document.createElement('script')
      script.id = 'paystack-script'
      script.src = 'https://js.paystack.co/v1/inline.js'
      document.body.appendChild(script)
    }
  }, [])

  const handlePaystackPayment = async () => {
    if (!agreed || !user) return
    if (!isCart && !listing) return
    if (isCart && cartItems.length === 0) return
    try {
      setProcessing(true)
      const token = localStorage.getItem('auth_token')

      if (isCart) {
        const initRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/bulk-initiate-purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: cartItems.map(i => ({ listingId: i.id, quantity: i.quantity })) }),
        })
        const initData = await initRes.json()
        if (!initRes.ok) throw new Error(initData.error || 'Failed to initiate purchase')
        if (!initData.authorizationUrl) throw new Error('No payment URL returned')

        if (window.PaystackPop && PAYSTACK_KEY) {
          const popup = window.PaystackPop.setup({
            key: PAYSTACK_KEY,
            email: user.email,
            amount: Math.round(cartTotal * 100),
            reference: initData.reference,
            currency: 'NGN',
            onClose: () => { setProcessing(false); showError('Payment cancelled.') },
            callback: async (response: any) => {
              if (response.status === 'success') {
                const completeRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/bulk-complete-purchase`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ reference: response.reference }),
                })
                const completeData = await completeRes.json()
                if (!completeRes.ok) throw new Error(completeData.error || 'Failed')
                clearCart()
                setCompleted(true)
                setResult(completeData)
                showSuccess('Purchase successful! Funds held securely in escrow.')
              } else { showError('Payment was not successful') }
              setProcessing(false)
            },
          })
          popup.openIframe()
        } else {
          window.location.href = initData.authorizationUrl
        }
        return
      }

      if (!listing || !listingId) return
      const initRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/${listingId}/initiate-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error || 'Failed to initiate purchase')
      if (!initData.authorizationUrl) throw new Error('No payment URL returned')

      if (window.PaystackPop && PAYSTACK_KEY) {
        const popup = window.PaystackPop.setup({
          key: PAYSTACK_KEY,
          email: user.email,
          amount: Math.round(listing.price * 100),
          reference: initData.reference,
          currency: 'NGN',
          onClose: () => { setProcessing(false); showError('Payment cancelled.') },
          callback: async (response: any) => {
            if (response.status === 'success') {
              try {
                const completeRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/complete-purchase`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ reference: response.reference }),
                })
                const completeData = await completeRes.json()
                if (!completeRes.ok) throw new Error(completeData.error || 'Failed to complete purchase')
                setCompleted(true)
                setResult(completeData)
                showSuccess('Purchase successful! Funds held securely in escrow.')
              } catch (err: any) { showError(err.message) }
            } else { showError('Payment was not successful') }
            setProcessing(false)
          },
        })
        popup.openIframe()
      } else {
        window.location.href = initData.authorizationUrl
      }
    } catch (err: any) {
      showError(err.message)
      setProcessing(false)
    }
  }

  if (!listingId && !isCart) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="modern-card p-5 text-center">
                <div className="empty-state">
                  <div className="empty-state-icon"><ShoppingCart size={48} /></div>
                  <h3>Nothing to Checkout</h3>
                  <p>Browse the marketplace to find a device you'd like to purchase</p>
                  <Link to="/marketplace/browse" className="btn-gradient-primary mt-3">Browse Marketplace</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="d-flex justify-content-center py-5">
                <Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (completed) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--success-50)' }}>
                    <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
                  </div>
                  <h3>Purchase Complete!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your order has been placed successfully.</p>
                  {result?.escrowId && (
                    <div className="alert alert-info mx-auto" style={{ maxWidth: 450 }}>
                      <Shield size={16} className="me-2" />
                      <strong>Escrow Protection Active</strong>
                      <p className="mb-0 mt-1" style={{ fontSize: 13 }}>
                        Your payment of <strong>₦{Number(totalAmount || 0).toLocaleString()}</strong> is held in escrow.
                        Funds will be released to sellers only after you confirm delivery.
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Track your orders from My Orders.</p>
                  <div className="d-flex gap-3 justify-content-center mt-4">
                    <Link to="/orders" className="btn-gradient-primary">View My Orders</Link>
                    <Link to="/marketplace/browse" className="btn-outline-primary">Continue Shopping</Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!listing && !isCart) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="modern-card p-5 text-center">
                <div className="empty-state">
                  <div className="empty-state-icon"><AlertTriangle size={48} /></div>
                  <h3>Listing Not Found</h3>
                  <p>This listing may have been removed or is no longer available</p>
                  <Link to="/marketplace/browse" className="btn-gradient-primary mt-3">Browse Marketplace</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        {isCart && (
          <div style={{ marginBottom: 16 }}>
            <Link to="/cart" className="btn btn-ghost" style={{ padding: '6px 12px', fontWeight: 500 }}>
              <ArrowLeft size={16} /> Back to Cart
            </Link>
          </div>
        )}
        <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <Shield size={14} /> Escrow protected — your payment is held securely until delivery is confirmed
        </div>
        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">
            <div className="modern-card p-4">
              <h4 className="mb-4" style={{ fontWeight: 600 }}>Order Summary {isCart ? `(${cartItems.length} item${cartItems.length > 1 ? 's' : ''})` : ''}</h4>
              {checkoutItems.map((item: any) => (
                <div key={item.id} className="d-flex gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex-shrink-0" style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: 'var(--gray-100)' }}>
                    {item.image || item.images?.[0] ? (
                      <img src={item.image || item.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100"><ShoppingCart size={28} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} /></div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1" style={{ fontWeight: 600 }}>{item.title}</h6>
                    <p className="mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {item.seller_name || 'Verified Seller'} {item.location ? <><MapPin size={12} /> {item.location}</> : ''}
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-600)' }}>
                        ₦{Number(item.price * (item.quantity || 1)).toLocaleString()}
                      </p>
                      {item.quantity > 1 && <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Qty: {item.quantity}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-top pt-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span>₦{Number(totalAmount).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Platform Fee (2.5%)</span>
                  <span style={{ color: 'var(--success-600)' }}>Included — paid by seller</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top" style={{ borderColor: 'var(--border-color)', fontSize: 16, fontWeight: 600 }}>
                  <span>Total Charged</span>
                  <span style={{ color: 'var(--primary-600)' }}>₦{Number(totalAmount).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <div className="d-flex align-items-start gap-2">
                  <Shield size={16} style={{ color: '#6366f1', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="mb-1 fw-medium" style={{ fontSize: 13 }}>Paystack Secure Payment</p>
                    <p className="mb-0" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      You'll be redirected to Paystack's secure checkout to complete payment via card, bank transfer, or USSD.
                    </p>
                  </div>
                </div>
              </div>
              <div className="form-check mt-3">
                <input className="form-check-input" type="checkbox" id="agree" checked={agreed}
                  onChange={e => setAgreed(e.target.checked)} />
                <label className="form-check-label" htmlFor="agree" style={{ fontSize: 13 }}>
                  I agree to the <Link to="/terms" style={{ color: 'var(--primary-600)' }}>Terms of Service</Link> and understand that payment will be held in escrow until delivery is confirmed.
                </label>
              </div>
              <button className="btn-gradient-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                disabled={!agreed || processing || checkoutItems.length === 0} onClick={handlePaystackPayment}>
                {processing ? (
                  <><Loader2 size={18} className="spinner-border" /> Processing...</>
                ) : (
                  <><CreditCard size={18} /> Pay ₦{Number(totalAmount).toLocaleString()} with Paystack</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
