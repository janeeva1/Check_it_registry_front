import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Landmark, CheckCircle, AlertTriangle, Loader2, Trash2, ArrowLeft } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate, Link } from 'react-router-dom'

type Bank = { code: string; name: string }
type BankAccount = { id: string; bankName: string; bankCode: string; accountNumber: string; accountName: string; isVerified: boolean }

export default function SellerPayoutSettings() {
  const { user: _user } = useAuth()
  const _navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const [banks, setBanks] = useState<Bank[]>([])
  const [account, setAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'view' | 'form'>('view')

  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || '/api'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        const headers = { Authorization: `Bearer ${token}` }

        const [banksRes, acctRes] = await Promise.all([
          fetch(`${API_BASE}/payments/banks`, { headers }),
          fetch(`${API_BASE}/payments/seller-bank-account`, { headers }),
        ])

        if (banksRes.ok) {
          const banksData = await banksRes.json()
          setBanks(banksData.data || [])
        }
        if (acctRes.ok) {
          const acctData = await acctRes.json()
          if (acctData.data) setAccount(acctData.data)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolveAccount = async () => {
    if (accountNumber.length !== 10 || !selectedBank) return
    try {
      setResolving(true)
      setResolved(false)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/payments/resolve-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode: selectedBank }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve')
      setAccountName(data.accountName)
      setResolved(true)
    } catch (err: any) {
      showError(err.message)
      setAccountName('')
    } finally { setResolving(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (accountNumber.length === 10 && selectedBank) resolveAccount() }, [accountNumber, selectedBank])

  const saveAccount = async () => {
    if (!selectedBank || !accountNumber || !accountName) return
    try {
      setSaving(true)
      const token = localStorage.getItem('auth_token')
      const bank = banks.find(b => b.code === selectedBank)
      const res = await fetch(`${API_BASE}/payments/seller-bank-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode: selectedBank, bankName: bank?.name || '', accountNumber, accountName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      showSuccess('Bank account saved! You can now receive payouts.')
      setAccount({ id: '', bankName: bank?.name || '', bankCode: selectedBank, accountNumber, accountName, isVerified: true })
      setStep('view')
    } catch (err: any) {
      showError(err.message)
    } finally { setSaving(false) }
  }

  const removeAccount = async () => {
    if (!confirm('Remove your bank account? You won\'t be able to receive payouts.')) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/payments/seller-bank-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to remove')
      setAccount(null)
      showSuccess('Bank account removed')
    } catch (err: any) {
      showError(err.message)
    }
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="container-fluid p-4 text-center"><Loader2 size={32} className="spinner-border" /></div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2 mb-4">
          <Link to="/business" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></Link>
          <div>
            <h3 className="mb-1" style={{ fontWeight: 600 }}>Payout Settings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Set up your bank account to receive marketplace payouts</p>
          </div>
        </div>

        {account && step === 'view' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="modern-card p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 48, height: 48, background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-500)' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h5 className="mb-1" style={{ fontWeight: 600 }}>Bank Account Verified</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                    Your account is set up to receive payouts for marketplace sales
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <Landmark size={20} style={{ color: 'var(--primary-600)' }} />
                  <div>
                    <p className="mb-0 fw-medium">{account.bankName}</p>
                    <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {account.accountName} · {account.accountNumber}
                    </p>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStep('form'); setSelectedBank(''); setAccountNumber(''); setAccountName(''); setResolved(false) }}>
                  Change Account
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={removeAccount}>
                  <Trash2 size={14} className="me-1" /> Remove
                </button>
              </div>
            </div>

            <div className="modern-card p-4 mt-3">
              <h6 className="mb-3" style={{ fontWeight: 600 }}>How Payouts Work</h6>
              <div className="d-flex flex-column gap-2" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <p className="mb-0">1. A buyer purchases your listing — payment is held in escrow</p>
                <p className="mb-0">2. Buyer confirms delivery — funds are released automatically</p>
                <p className="mb-0">3. Platform fee is deducted (configured by admin)</p>
                <p className="mb-0">4. Net amount is transferred to this bank account via Paystack</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="modern-card p-4">
              <h5 className="mb-3" style={{ fontWeight: 600 }}>Add Your Bank Account</h5>

              <div className="mb-3">
                <label className="d-block mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Select Bank</label>
                <select className="modern-select w-100" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                  <option value="">-- Select Bank --</option>
                  {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="d-block mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Account Number</label>
                <input type="text" className="modern-input w-100" maxLength={10} placeholder="0123456789"
                  value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))} />
              </div>

              {resolving && (
                <div className="d-flex align-items-center gap-2 mb-3" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Loader2 size={14} className="spinner-border" /> Resolving account...
                </div>
              )}

              {resolved && accountName && !resolving && (
                <div className="p-3 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-700)', fontSize: 14 }}>
                  <CheckCircle size={16} /> Account name: <strong>{accountName}</strong>
                </div>
              )}

              {!resolved && accountName && !resolving && (
                <div className="p-3 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-700)', fontSize: 14 }}>
                  <AlertTriangle size={16} /> Account name resolved but account number may be incorrect
                </div>
              )}

              <div className="d-flex gap-2">
                <button className="btn-gradient-primary" disabled={!resolved || saving || !accountName} onClick={saveAccount}>
                  {saving && <Loader2 size={16} className="spinner-border me-1" />}
                  {saving ? 'Saving...' : account ? 'Update Account' : 'Save Account'}
                </button>
                {account && (
                  <button className="btn-outline-secondary" onClick={() => setStep('view')}>Cancel</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
