import { useState, useEffect } from 'react'
import { Plus, Package, Info, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'

type MyDevice = { id: string; brand: string; model: string; imei: string; serial: string; category: string }

type FormData = { deviceId: string; title: string; description: string; price: string; condition: string; images: File[] }

export default function CreateListing() {
  const { user: _user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [devices, setDevices] = useState<MyDevice[]>([])
  const [form, setForm] = useState<FormData>({ deviceId: '', title: '', description: '', price: '', condition: 'excellent', images: [] })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setDevices(data.data || [])
        }
      } catch { /* ignore */ } finally { setLoading(false) }
    }
    fetchDevices()
  }, [])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setForm(p => ({ ...p, images: [...p.images, ...files].slice(0, 10) }))
  }

  const removeImage = (idx: number) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.deviceId) { showError('Title, price, and device are required'); return }
    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('price', form.price)
      fd.append('condition', form.condition)
      fd.append('deviceId', form.deviceId)
      form.images.forEach(img => fd.append('images', img))

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/marketplace/listings`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to create listing') }
      showSuccess('Listing created successfully!')
      setForm({ deviceId: '', title: '', description: '', price: '', condition: 'excellent', images: [] })
    } catch (err: any) { showError(err.message) } finally { setSubmitting(false) }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h1>Create Listing</h1>
                  <p>Sell a device on the marketplace</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <form onSubmit={handleSubmit}>
              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4 d-flex align-items-center gap-2">
                  <Package size={20} style={{ color: 'var(--primary-600)' }} />
                  Device Information
                </h5>
                <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Select Device *</label>
                    {loading ? (
                      <div className="modern-input d-flex align-items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Loader2 size={16} className="spinner-border" /> Loading devices...
                      </div>
                    ) : (
                      <select className="modern-select" value={form.deviceId} onChange={e => setForm(p => ({ ...p, deviceId: e.target.value }))} required>
                        <option value="">Choose a registered device</option>
                        {devices.map(d => <option key={d.id} value={d.id}>{d.brand} {d.model} ({d.imei || d.serial || d.id.slice(0, 8)})</option>)}
                      </select>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Listing Title *</label>
                    <input className="modern-input" placeholder="e.g. iPhone 14 Pro Max - Like New" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                    <textarea className="modern-textarea" rows={4} placeholder="Describe the device's condition, accessories, reason for selling, etc." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Price ($) *</label>
                    <input type="number" className="modern-input" placeholder="0.00" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Condition <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                    <select className="modern-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="parts">For Parts / Not Working</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modern-card p-4 mb-4">
                <h5 className="mb-4 d-flex align-items-center gap-2">
                  <ImageIcon size={20} style={{ color: 'var(--primary-600)' }} />
                  Images (up to 10)
                </h5>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="position-relative" style={{ width: 100, height: 100 }}>
                      <img src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      <button type="button" className="btn btn-sm position-absolute top-0 end-0" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: 2 }} onClick={() => removeImage(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 10 && (
                    <label className="d-flex align-items-center justify-content-center" style={{ width: 100, height: 100, border: '2px dashed var(--border-color)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <Plus size={24} />
                      <input type="file" accept="image/*" multiple onChange={handleImage} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>

              <div className="modern-card p-4">
                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 40, height: 40, background: 'var(--primary-50)' }}>
                    <Info size={20} style={{ color: 'var(--primary-600)' }} />
                  </div>
                  <div>
                    <p className="fw-semibold mb-1">Marketplace Fee</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>A 5% transaction fee will be deducted from the final sale price.</p>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-3">
                  <button type="button" className="btn-ghost" onClick={() => window.history.back()}>Cancel</button>
                  <button type="submit" className="btn-gradient-primary d-flex align-items-center gap-2" disabled={submitting}>
                    {submitting ? <Loader2 size={18} className="spinner-border" /> : <Plus size={18} />}
                    {submitting ? 'Creating...' : 'Create Listing'}
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
