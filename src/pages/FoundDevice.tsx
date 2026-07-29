import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Smartphone, MapPin, MessageSquare, Send, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'

type Step = 'lookup' | 'details' | 'contact' | 'success'

export default function FoundDevice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [step, setStep] = useState<Step>('lookup')
  const [imei, setImei] = useState('')
  const [serial, setSerial] = useState('')
  const [deviceData, setDeviceData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ location: '', description: '', contactName: '', contactEmail: '', contactPhone: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleLookup = async () => {
    if (!imei && !serial) { showError('Enter an IMEI or serial number'); return }
    try {
      setLoading(true)
      const q = imei || serial
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/lookup?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Device not found in registry')
      const data = await res.json()
      setDeviceData(data.data || data)
      setStep('details')
    } catch (err: any) { showError(err.message) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = { deviceId: deviceData?.id, imei: imei || deviceData?.imei, serial: serial || deviceData?.serial, ...form, reportedBy: user?.id || 'anonymous' }
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to submit report')
      setStep('success')
      showSuccess('Thank you for reporting a found device!')
    } catch (err: any) { showError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--success-500), var(--success-700))' }}>
                  <Search size={24} className="text-white" />
                </div>
                <div>
                  <h1>Found a Device</h1>
                  <p>Help return a lost device to its owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            {step === 'lookup' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-4 p-md-5">
                  <div className="text-center mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 72, height: 72, background: 'var(--success-50)' }}>
                      <Smartphone size={36} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <h4>Look Up the Device</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>Enter the IMEI or serial number found on the device</p>
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">IMEI Number</label>
                      <input className="modern-input" placeholder="15-digit IMEI" value={imei} onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Serial Number</label>
                      <input className="modern-input" placeholder="Serial number" value={serial} onChange={e => setSerial(e.target.value)} />
                    </div>
                  </div>
                  <button className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={loading || (!imei && !serial)} onClick={handleLookup}>
                    {loading ? <Loader2 size={20} className="spinner-border" /> : <Search size={20} />}
                    {loading ? 'Looking up...' : 'Look Up Device'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'details' && deviceData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-4 mb-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="avatar" style={{ background: 'var(--success-50)' }}><Smartphone size={24} style={{ color: 'var(--success-500)' }} /></div>
                    <div>
                      <h5 className="mb-1">{deviceData.brand} {deviceData.model}</h5>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>IMEI: {deviceData.imei || imei || '—'} &middot; Serial: {deviceData.serial || serial || '—'}</p>
                    </div>
                  </div>
                  <div className="alert-banner alert-banner-info d-flex align-items-center gap-2">
                    <Smartphone size={18} />
                    <span>Device found in registry. Please provide details about where you found it.</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modern-card p-4 mb-4">
                    <h5 className="mb-4 d-flex align-items-center gap-2"><MapPin size={20} style={{ color: 'var(--success-500)' }} /> Where did you find it?</h5>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Location *</label>
                        <textarea className="modern-textarea" rows={2} placeholder="e.g. Found at Central Park, near the main entrance" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea className="modern-textarea" rows={3} placeholder="Any additional details about the device condition or circumstances" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="modern-card p-4 mb-4">
                    <h5 className="mb-4 d-flex align-items-center gap-2"><MessageSquare size={20} style={{ color: 'var(--success-500)' }} /> Your Contact Info</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }} className="mb-3">So the owner can reach you to arrange return</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Name *</label>
                        <input className="modern-input" placeholder="Your name" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input type="email" className="modern-input" placeholder="your@email.com" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input className="modern-input" placeholder="Phone number" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="modern-card p-4">
                    <div className="d-flex justify-content-between">
                      <button type="button" className="btn-ghost" onClick={() => setStep('lookup')}>Back</button>
                      <button type="submit" className="btn-gradient-primary d-flex align-items-center gap-2" disabled={submitting}>
                        {submitting ? <Loader2 size={18} className="spinner-border" /> : <Send size={18} />}
                        {submitting ? 'Submitting...' : 'Submit Found Report'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="modern-card p-5 text-center">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4" style={{ width: 80, height: 80, background: 'var(--success-50)' }}>
                    <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
                  </div>
                  <h3>Report Submitted!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Thank you for helping return this device. The owner will be notified.</p>
                  <div className="d-flex gap-3 justify-content-center mt-4">
                    <button className="btn-gradient-primary" onClick={() => { setStep('lookup'); setImei(''); setSerial(''); setDeviceData(null); setForm({ location: '', description: '', contactName: '', contactEmail: '', contactPhone: '' }) }}>
                      Report Another
                    </button>
                    <button className="btn-outline-primary" onClick={() => navigate('/')}>Go Home</button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
