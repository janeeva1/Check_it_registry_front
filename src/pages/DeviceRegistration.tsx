import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Monitor, Headphones, Gamepad, Watch, Camera, Tv, Speaker, Package, Plus, Shield, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'

const DEVICE_CATEGORIES = [
  { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
  { value: 'tablet', label: 'Tablet', icon: Monitor },
  { value: 'headphones', label: 'Headphones', icon: Headphones },
  { value: 'console', label: 'Console', icon: Gamepad },
  { value: 'smartwatch', label: 'Smartwatch', icon: Watch },
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'tv', label: 'TV', icon: Tv },
  { value: 'speaker', label: 'Speaker', icon: Speaker },
  { value: 'laptop', label: 'Laptop', icon: Monitor },
  { value: 'other', label: 'Other', icon: Package },
]

type FormData = {
  brand: string
  model: string
  imei: string
  serial: string
  category: string
  color: string
  storage: string
  notes: string
  purchaseDate: string
  estimatedValue: string
}

const initialState: FormData = {
  brand: '', model: '', imei: '', serial: '', category: 'smartphone',
  color: '', storage: '', notes: '', purchaseDate: '', estimatedValue: '',
}

export default function DeviceRegistration() {
  const { user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [form, setForm] = useState<FormData>(initialState)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const update = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const _token = localStorage.getItem('auth_token')
      const payload = {
        ...form,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        purchaseDate: form.purchaseDate || null,
        userId: user?.id,
      }
      await apiClient.devices.create(payload)
      showSuccess('Device registered successfully')
      setForm(initialState); setStep(1)
    } catch (err: any) {
      showError(err?.message || 'Registration failed')
    } finally { setSubmitting(false) }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Plus size={24} className="text-white" />
                </div>
                <div>
                  <h1>Register a Device</h1>
                  <p>Add your device to the registry</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="modern-card p-4 p-md-5">
              <div className="d-flex justify-content-between mb-5">
                <div className="d-flex align-items-center gap-2" style={{ color: step >= 1 ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: step >= 1 ? 'var(--primary-600)' : 'var(--gray-200)', color: step >= 1 ? '#fff' : 'var(--text-secondary)' }}>1</div>
                  <span className="fw-medium">Category</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 2 ? 'var(--primary-600)' : 'var(--gray-200)', margin: '0 12px', alignSelf: 'center' }} />
                <div className="d-flex align-items-center gap-2" style={{ color: step >= 2 ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: step >= 2 ? 'var(--primary-600)' : 'var(--gray-200)', color: step >= 2 ? '#fff' : 'var(--text-secondary)' }}>2</div>
                  <span className="fw-medium">Details</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 3 ? 'var(--primary-600)' : 'var(--gray-200)', margin: '0 12px', alignSelf: 'center' }} />
                <div className="d-flex align-items-center gap-2" style={{ color: step >= 3 ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: step === 3 ? 'var(--primary-600)' : 'var(--gray-200)', color: step >= 3 ? '#fff' : 'var(--text-secondary)' }}>3</div>
                  <span className="fw-medium">Confirm</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h4 className="mb-4">What type of device are you registering?</h4>
                    <div className="row g-3">
                      {DEVICE_CATEGORIES.map(cat => {
                        const Icon = cat.icon
                        const active = form.category === cat.value
                        return (
                          <div className="col-6 col-md-4 col-lg-3" key={cat.value}>
                            <button type="button" onClick={() => update('category', cat.value)}
                              className={`d-flex flex-column align-items-center gap-2 w-100 p-4 rounded-3 border ${active ? 'border-primary' : ''}`}
                              style={{ background: active ? 'var(--primary-50)' : 'var(--gray-50)', transition: 'all 0.2s', cursor: 'pointer', borderColor: active ? 'var(--primary-500)' : 'var(--border-color)' }}>
                              <Icon size={32} style={{ color: active ? 'var(--primary-600)' : 'var(--text-secondary)' }} />
                              <span className="fw-medium" style={{ fontSize: 13, color: active ? 'var(--primary-700)' : 'var(--text-primary)' }}>{cat.label}</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 text-end">
                      <button type="button" className="btn-gradient-primary" onClick={() => setStep(2)}>Next Step</button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h4 className="mb-4">Device Information</h4>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Brand *</label>
                        <input className="modern-input" placeholder="e.g. Apple, Samsung" value={form.brand} onChange={e => update('brand', e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Model *</label>
                        <input className="modern-input" placeholder="e.g. iPhone 14" value={form.model} onChange={e => update('model', e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">IMEI (if applicable)</label>
                        <input className="modern-input" placeholder="15-digit IMEI" value={form.imei} onChange={e => update('imei', e.target.value.replace(/\D/g, '').slice(0, 15))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Serial Number</label>
                        <input className="modern-input" placeholder="Serial number" value={form.serial} onChange={e => update('serial', e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Color</label>
                        <input className="modern-input" placeholder="e.g. Space Gray" value={form.color} onChange={e => update('color', e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Storage</label>
                        <select className="modern-select" value={form.storage} onChange={e => update('storage', e.target.value)}>
                          <option value="">Select</option>
                          <option value="16GB">16 GB</option>
                          <option value="32GB">32 GB</option>
                          <option value="64GB">64 GB</option>
                          <option value="128GB">128 GB</option>
                          <option value="256GB">256 GB</option>
                          <option value="512GB">512 GB</option>
                          <option value="1TB">1 TB</option>
                          <option value="2TB">2 TB</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Estimated Value ($)</label>
                        <input type="number" className="modern-input" placeholder="0.00" value={form.estimatedValue} onChange={e => update('estimatedValue', e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Purchase Date</label>
                        <input type="date" className="modern-input" value={form.purchaseDate} onChange={e => update('purchaseDate', e.target.value)} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Additional Notes</label>
                        <textarea className="modern-textarea" rows={3} placeholder="Any additional details..." value={form.notes} onChange={e => update('notes', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-4 d-flex justify-content-between">
                      <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                      <button type="button" className="btn-gradient-primary" onClick={() => setStep(3)}>Review & Confirm</button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <Shield size={24} className="text-success" />
                      <h4 className="mb-0">Confirm Registration</h4>
                    </div>
                    <div className="modern-card p-4" style={{ backgroundColor: 'var(--gray-50)' }}>
                      <div className="row g-3" style={{ fontSize: 14 }}>
                        <div className="col-md-6"><strong>Category:</strong> {DEVICE_CATEGORIES.find(c => c.value === form.category)?.label || form.category}</div>
                        <div className="col-md-6"><strong>Brand:</strong> {form.brand}</div>
                        <div className="col-md-6"><strong>Model:</strong> {form.model}</div>
                        <div className="col-md-6"><strong>IMEI:</strong> {form.imei || '—'}</div>
                        <div className="col-md-6"><strong>Serial:</strong> {form.serial || '—'}</div>
                        <div className="col-md-6"><strong>Color:</strong> {form.color || '—'}</div>
                        <div className="col-md-6"><strong>Storage:</strong> {form.storage || '—'}</div>
                        <div className="col-md-6"><strong>Value:</strong> {form.estimatedValue ? `$${form.estimatedValue}` : '—'}</div>
                        <div className="col-md-6"><strong>Purchase Date:</strong> {form.purchaseDate || '—'}</div>
                        <div className="col-12"><strong>Notes:</strong> {form.notes || '—'}</div>
                      </div>
                    </div>
                    <div className="mt-4 d-flex justify-content-between">
                      <button type="button" className="btn-ghost" onClick={() => setStep(2)}>Back</button>
                      <button type="submit" className="btn-gradient-primary d-flex align-items-center gap-2" disabled={submitting}>
                        {submitting ? <Loader2 size={18} className="spinner-border" /> : <Plus size={18} />}
                        {submitting ? 'Registering...' : 'Complete Registration'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
