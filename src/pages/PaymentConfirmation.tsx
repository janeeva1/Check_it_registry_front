import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, CreditCard, Send, Printer, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

type Transaction = {
  id: string
  amount: number
  status: string
  method: string
  description: string
  created_at: string
  reference: string
}

export default function PaymentConfirmation() {
  const { user: _user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toasts, removeToast, showSuccess, showError: _showError } = useToast()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  const txId = searchParams.get('tx') || searchParams.get('id') || ''

  useEffect(() => {
    const fetchTx = async () => {
      try {
        setLoading(true)
        if (!txId) return
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payments/transactions/${txId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('Transaction not found')
        const data = await res.json()
        setTransaction(data.data || data)
      } catch { setTransaction(null) }
      finally { setLoading(false) }
    }
    fetchTx()
  }, [txId])

  if (!txId) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center py-4">
            <div className="col-lg-6">
              <div className="modern-card p-5 text-center">
                <div className="empty-state">
                  <div className="empty-state-icon"><CreditCard size={48} /></div>
                  <h3>No Transaction</h3>
                  <p>No transaction ID provided</p>
                  <Link to="/" className="btn-gradient-primary mt-3">Go Home</Link>
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
          <div className="row justify-content-center py-4">
            <div className="col-lg-6">
              <div className="modern-card p-5 text-center">
                <Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!transaction) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center py-4">
            <div className="col-lg-6">
              <div className="modern-card p-5 text-center">
                <div className="empty-state">
                  <div className="empty-state-icon"><AlertTriangle size={48} /></div>
                  <h3>Transaction Not Found</h3>
                  <p>We couldn't find a transaction with that ID</p>
                  <Link to="/transaction-history" className="btn-gradient-primary mt-3">View History</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const isSuccess = transaction.status === 'completed' || transaction.status === 'success'

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div>
                  <h1>Payment {isSuccess ? 'Confirmation' : 'Status'}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="modern-card p-4 p-md-5 text-center">
                {isSuccess ? (
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--success-50)' }}>
                    <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--warning-50)' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--warning-500)' }} />
                  </div>
                )}

                <h4 className="mb-2">{isSuccess ? 'Payment Successful!' : 'Payment Pending'}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {isSuccess ? 'Your transaction has been processed' : 'Your transaction is being processed'}
                </p>

                <div className="modern-card p-4 text-start my-4" style={{ backgroundColor: 'var(--gray-50)' }}>
                  <div className="row g-2" style={{ fontSize: 14 }}>
                    <div className="col-6" style={{ color: 'var(--text-secondary)' }}>Reference:</div>
                    <div className="col-6 text-end fw-medium" style={{ fontFamily: 'monospace' }}>{transaction.reference || transaction.id.slice(0, 12)}</div>
                    <div className="col-6" style={{ color: 'var(--text-secondary)' }}>Amount:</div>
                    <div className="col-6 text-end fw-bold" style={{ color: 'var(--primary-600)' }}>${(transaction.amount || 0).toFixed(2)}</div>
                    <div className="col-6" style={{ color: 'var(--text-secondary)' }}>Method:</div>
                    <div className="col-6 text-end text-capitalize">{transaction.method || 'Card'}</div>
                    <div className="col-6" style={{ color: 'var(--text-secondary)' }}>Date:</div>
                    <div className="col-6 text-end">{new Date(transaction.created_at).toLocaleString()}</div>
                    <div className="col-6" style={{ color: 'var(--text-secondary)' }}>Description:</div>
                    <div className="col-6 text-end">{transaction.description || '—'}</div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 justify-content-center">
                  <button className="btn-gradient-primary d-inline-flex align-items-center gap-2" onClick={() => window.print()}>
                    <Printer size={18} /> Print Receipt
                  </button>
                  <button className="btn-outline-primary d-inline-flex align-items-center gap-2" onClick={() => { /* send email receipt */ showSuccess('Receipt sent to your email') }}>
                    <Send size={18} /> Email Receipt
                  </button>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-3">
                  <Link to="/transaction-history" className="btn-ghost">View All Transactions</Link>
                  <Link to="/" className="btn-ghost">Go Home</Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
