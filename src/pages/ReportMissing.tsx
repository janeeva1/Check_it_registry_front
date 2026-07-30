import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Smartphone, MapPin, Clock, Loader2, Send, CheckCircle, ArrowLeft, Info } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate } from 'react-router-dom'

const MISSING_TYPES = ['stolen', 'lost', 'misplaced'] as const

export default function ReportMissing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [type, setType] = useState<string>('stolen')
  const [form, setForm] = useState({ model: '', imei: '', serial: '', location: '', date: '', description: '', policeReport: '', contactEmail: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, type, userId: user?.id, reportType: 'missing' }),
      })
      if (!res.ok) throw new Error('Failed to submit report')
      setSubmitted(true)
      showSuccess('Report submitted successfully')
    } catch (err: any) { showError(err.message) }
    finally { setSubmitting(false) }
  }

  if (submitted) {
    return (
      <Layout requireAuth>
        <div className="container-fluid">
          <div className="row justify-content-center py-4">
            <div className="col-lg-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--success-50)' }}><CheckCircle size={48} style={{ color: 'var(--success-500)' }} /></div>
                  <h3>Report Filed</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your report has been submitted. We will notify you of any updates.</p>
                  <div className="d-flex gap-3 justify-content-center mt-4">
                    <button className="btn-gradient-primary" onClick={() => navigate('/reports')}>View Reports</button>
                    <button className="btn-outline-primary" onClick={() => navigate('/my-devices')}>My Devices</button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const typeColors: Record<string, string> = { stolen: 'var(--danger-500)', lost: 'var(--warning-500)', misplaced: 'var(--info-500)' }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--danger-500), var(--danger-700))' }}>
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <h1>Report Missing Device</h1>
                  <p>Report your device as stolen, lost, or misplaced</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <form onSubmit={handleSubmit}>
              <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4">Incident Type</h5>
                <div className="d-flex flex-wrap gap-3">
                  {MISSING_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={`px-4 py-3 rounded-3 border d-flex align-items-center gap-2 text-capitalize ${type === t ? 'border-primary' : ''}`}
                      style={{ background: type === t ? 'var(--primary-50)' : 'var(--gray-50)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <AlertTriangle size={18} style={{ color: type === t ? typeColors[t] : 'var(--text-secondary)' }} />
                      <span className="fw-medium">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4 d-flex align-items-center gap-2"><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /> Device Details</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Device Model *</label>
                    <input className="modern-input" placeholder="e.g. iPhone 14 Pro Max" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">IMEI <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                    <input className="modern-input" placeholder="15-digit IMEI" value={form.imei} onChange={e => setForm(p => ({ ...p, imei: e.target.value.replace(/\D/g, '').slice(0, 15) }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Serial Number <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                    <input className="modern-input" placeholder="Serial number" value={form.serial} onChange={e => setForm(p => ({ ...p, serial: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Police Report # <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                    <input className="modern-input" placeholder="If filed" value={form.policeReport} onChange={e => setForm(p => ({ ...p, policeReport: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4 d-flex align-items-center gap-2"><MapPin size={20} style={{ color: 'var(--danger-500)' }} /> Incident Location & Time</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Location *</label>
                    <textarea className="modern-textarea" rows={2} placeholder="Where did the incident occur?" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label d-flex align-items-center gap-2"><Clock size={14} /> Date & Time <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                    <input type="datetime-local" className="modern-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description *</label>
                    <textarea className="modern-textarea" rows={3} placeholder="Detailed description of what happened" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
                  </div>
                </div>
              </div>

              <div className="modern-card p-4">
                <div className="d-flex align-items-start gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: 'var(--warning-50)' }}>
                  <Info size={18} style={{ color: 'var(--warning-600)' }} className="flex-shrink-0 mt-0.5" />
                  <p style={{ fontSize: 13, color: 'var(--warning-700)', margin: 0 }}>Filing a false report may result in account suspension. Only submit accurate information.</p>
                </div>
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                  <button type="submit" className="btn-gradient-danger d-flex align-items-center gap-2" disabled={submitting}>
                    {submitting ? <Loader2 size={18} className="spinner-border" /> : <Send size={18} />}
                    {submitting ? 'Submitting...' : `Submit ${type.charAt(0).toUpperCase() + type.slice(1)} Report`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
