import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'
import { Users, Loader2, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BusinessOnboardings() {
  const navigate = useNavigate()
  const { showError, toasts, removeToast } = useToast()
  const [onboardings, setOnboardings] = useState<any[]>([])
  const [stats, setStats] = useState<{ total_onboardings: number; total_commission: number; total_fees: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData() }, [page])

  const loadData = async () => {
    setLoading(true)
    try {
      const [listData, statsData] = await Promise.all([
        apiClient.business.onboardings({ page, limit: 20 }),
        apiClient.business.onboardingStats(),
      ])
      setOnboardings(listData?.data || [])
      setTotalPages(listData?.pagination?.totalPages || 1)
      setStats(statsData)
    } catch {
      showError('Failed to load onboardings')
    } finally {
      setLoading(false)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} style={{ color: 'var(--success)' }} />
      case 'cancelled': return <XCircle size={16} style={{ color: 'var(--danger)' }} />
      default: return <Clock size={16} style={{ color: 'var(--warning)' }} />
    }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header">
            <div className="d-flex align-items-center gap-3">
              <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#fff" />
              </div>
              <div>
                <h1>Customer Onboardings</h1>
                <p>View your onboarded customers and commissions</p>
              </div>
            </div>
          </div>

          {stats && (
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="modern-card p-3 text-center">
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Total Onboarded</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total_onboardings}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="modern-card p-3 text-center">
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Total Fees Collected</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-600)' }}>₦{stats.total_fees.toLocaleString()}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="modern-card p-3 text-center">
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Your Commission</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success-500)' }}>₦{stats.total_commission.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center py-5"><Loader2 size={32} className="spin" /></div>
          ) : onboardings.length === 0 ? (
            <div className="modern-card p-5 text-center">
              <Users size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
              <h5>No Onboardings Yet</h5>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Start onboarding customers to earn commission</p>
              <button onClick={() => navigate('/business/onboard')} className="btn-gradient-primary mt-3">Onboard Customer</button>
            </div>
          ) : (
            <div className="modern-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Device</th>
                      <th>Fee</th>
                      <th>Commission</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onboardings.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.customer_name}</strong></td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {o.customer_email && <div>{o.customer_email}</div>}
                          {o.customer_phone && <div>{o.customer_phone}</div>}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {o.device_brand && <span>{o.device_brand} {o.device_model}</span>}
                          {o.device_imei && <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>IMEI: {o.device_imei}</div>}
                        </td>
                        <td>₦{Number(o.fee_amount).toLocaleString()}</td>
                        <td style={{ color: 'var(--success-500)', fontWeight: 600 }}>₦{Number(o.commission_amount).toLocaleString()}</td>
                        <td>{statusIcon(o.status)} <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{o.status}</span></td>
                        <td style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span className="d-flex align-items-center px-3" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </motion.div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
