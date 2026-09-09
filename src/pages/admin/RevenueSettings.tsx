import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../../components/Layout'
import { useToast, ToastContainer } from '../../components/Toast'
import { apiClient } from '../../lib/apiClient'
import { DollarSign, RefreshCw, TrendingUp, CreditCard, Building2, Smartphone, Search, Shield, IdCard, Percent, Edit3, X, Check, Users } from 'lucide-react'

interface FeeConfig {
  setting_key: string
  setting_value: string
  updated_at?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const FEE_LABELS: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  nin_verification_fee: { label: 'NIN Verification', icon: <IdCard size={16} />, desc: 'Fee for NIN identity verification' },
  report_verification_fee: { label: 'Report Verification', icon: <Search size={16} />, desc: 'Fee for device report verification' },
  device_check_fee: { label: 'Device Check', icon: <Smartphone size={16} />, desc: 'Fee per device check after free tier' },
  business_verification_fee: { label: 'Business (CAC) Verify', icon: <Building2 size={16} />, desc: 'Fee for CAC business verification' },
  marketplace_commission_percent: { label: 'Marketplace Commission %', icon: <Percent size={16} />, desc: 'Percentage commission on marketplace sales' },
  device_recovery_fee: { label: 'Device Recovery', icon: <Shield size={16} />, desc: 'Fee for device recovery service' },
  business_onboarding_fee: { label: 'Customer Onboarding', icon: <Users size={16} />, desc: 'Fee for business customer onboarding' },
  business_onboarding_commission_percent: { label: 'Onboarding Commission %', icon: <Percent size={16} />, desc: 'Commission percent for each onboarding' },
}

const PROVIDER_OPTIONS = ['prembly', 'dojah', 'verifyng', 'smileid']

export default function RevenueSettings() {
  const { showSuccess, showError, toasts, removeToast } = useToast()
  const [fees, setFees] = useState<Record<string, FeeConfig>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [currentProvider, setCurrentProvider] = useState('prembly')
  const [summary, setSummary] = useState<{ total_revenue: number; total_transactions: number; period?: string } | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [txPage, setTxPage] = useState(1)
  const [txLoading, setTxLoading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [feeData, provData, summData, txData] = await Promise.all([
        apiClient.revenue.listFees(),
        apiClient.revenue.getProvider(),
        apiClient.revenue.summary(),
        apiClient.revenue.transactions({ page: 1, limit: 10 }),
      ])
      const feeMap: Record<string, FeeConfig> = {}
      const feesObj = feeData?.fees || feeData || {}
      if (Array.isArray(feesObj)) {
        feesObj.forEach((f: FeeConfig) => { feeMap[f.setting_key] = f })
      } else if (typeof feesObj === 'object') {
        Object.entries(feesObj).forEach(([key, val]) => { feeMap[key] = { setting_key: key, setting_value: String(val) } })
      }
      setFees(feeMap)
      setCurrentProvider(provData?.provider || 'prembly')
      setSummary(summData)
      setTransactions(Array.isArray(txData) ? txData : txData.data || txData.transactions || [])
    } catch {
      showError('Failed to load revenue settings')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (key: string, val: string) => {
    setEditingKey(key)
    setEditValue(val)
  }

  const saveFee = async (key: string) => {
    setSaving(key)
    try {
      const isPercent = key === 'marketplace_commission_percent'
      const amount = isPercent ? parseFloat(editValue) : parseFloat(editValue)
      if (isNaN(amount) || amount < 0) throw new Error('Invalid amount')
      if (isPercent && amount > 100) throw new Error('Commission cannot exceed 100%')
      await apiClient.revenue.setFee(key, amount)
      setFees(prev => ({ ...prev, [key]: { ...prev[key], setting_value: String(amount) } }))
      showSuccess(`${FEE_LABELS[key]?.label || key} updated`)
      setEditingKey(null)
    } catch (e: any) {
      showError(e.message || 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  const handleProviderChange = async (provider: string) => {
    try {
      await apiClient.revenue.setProvider({ provider })
      setCurrentProvider(provider)
      showSuccess('Verification provider updated')
    } catch (e: any) {
      showError(e.message || 'Failed to update provider')
    }
  }

  const loadMoreTx = async () => {
    setTxLoading(true)
    try {
      const next = txPage + 1
      const data = await apiClient.revenue.transactions({ page: next, limit: 10 })
      const txList = Array.isArray(data) ? data : data.data || data.transactions || []
      setTransactions(prev => [...prev, ...txList])
      setTxPage(next)
    } catch { /* pagination fetch failed */ } finally { setTxLoading(false) }
  }

  if (loading) {
    return (
      <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}>
          <div className="text-center">
            <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)', width: '3rem', height: '3rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading revenue settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth allowedRoles={['admin', 'super_admin']}>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', width: 52, height: 52 }}>
                  <DollarSign size={26} />
                </div>
                <div>
                  <h1>Revenue Settings</h1>
                  <p>Manage fees, providers, and view revenue</p>
                </div>
              </div>
              <button onClick={loadAll} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </motion.div>

          <div className="row g-4">
            <motion.div variants={itemVariants} className="col-lg-8">
              <div className="modern-card">
                <div className="p-4 border-bottom d-flex align-items-center gap-3">
                  <CreditCard size={20} style={{ color: 'var(--primary)' }} />
                  <h3 className="h5 mb-0">Fee Configuration</h3>
                </div>
                <div className="table-responsive">
                  <table className="modern-table mb-0">
                    <thead>
                      <tr>
                        <th>Fee</th>
                        <th>Amount</th>
                        <th style={{ width: 120 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(FEE_LABELS).map(([key, meta]) => (
                        <tr key={key}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ color: 'var(--text-secondary)' }}>{meta.icon}</span>
                              <div>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{meta.label}</div>
                                <small style={{ color: 'var(--text-tertiary)' }}>{meta.desc}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            {editingKey === key ? (
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  style={{ width: 120 }}
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  step="0.01"
                                  min="0"
                                />
                                {key !== 'marketplace_commission_percent' && (
                                  <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>NGN</span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {key === 'marketplace_commission_percent'
                                  ? `${fees[key]?.setting_value || '0'}%`
                                  : `NGN ${Number(fees[key]?.setting_value || 0).toLocaleString()}`}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingKey === key ? (
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => saveFee(key)}
                                  disabled={saving === key}
                                  className="btn btn-sm"
                                  style={{ color: 'var(--success)' }}
                                >
                                  {saving === key ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                                </button>
                                <button onClick={() => setEditingKey(null)} className="btn btn-sm" style={{ color: 'var(--text-secondary)' }}>
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(key, fees[key]?.setting_value || '0')}
                                className="btn btn-sm btn-ghost"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <motion.div variants={itemVariants} className="modern-card mt-4">
                <div className="p-4 border-bottom d-flex align-items-center gap-3">
                  <Building2 size={20} style={{ color: 'var(--primary)' }} />
                  <h3 className="h5 mb-0">Verification Provider</h3>
                </div>
                <div className="p-4">
                  <div className="d-flex flex-wrap gap-2">
                    {PROVIDER_OPTIONS.map(p => (
                      <button
                        key={p}
                        onClick={() => handleProviderChange(p)}
                        className={`btn ${currentProvider === p ? 'btn-gradient-primary' : 'btn-outline-primary'}`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="col-lg-4">
              {summary && (
                <div className="modern-card mb-4">
                  <div className="p-4 border-bottom d-flex align-items-center gap-3">
                    <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                    <h3 className="h5 mb-0">Revenue Summary</h3>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <small style={{ color: 'var(--text-tertiary)' }}>Total Revenue</small>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                        NGN {Number(summary.total_revenue || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-tertiary)' }}>Transactions</small>
                      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {summary.total_transactions || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {transactions.length > 0 && (
                <div className="modern-card">
                  <div className="p-4 border-bottom d-flex align-items-center gap-3">
                    <CreditCard size={20} style={{ color: 'var(--primary)' }} />
                    <h3 className="h5 mb-0">Recent Transactions</h3>
                  </div>
                  <div className="p-3">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {tx.fee_type || tx.type || 'Transaction'}
                          </div>
                          <small style={{ color: 'var(--text-tertiary)' }}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ''}
                          </small>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                          NGN {Number(tx.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <button onClick={loadMoreTx} disabled={txLoading} className="btn-ghost w-100 mt-2" style={{ fontSize: 13 }}>
                      {txLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
