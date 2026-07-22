import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, Download, Trash2, CheckCircle, AlertTriangle, Loader2, Info, Eye, Plus } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'

type PreviewRow = { brand: string; model: string; imei: string; serial: string; category: string; color: string; storage: string }

export default function BulkDeviceRegistration() {
  const { user } = useAuth()
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const downloadTemplate = () => {
    const csv = 'brand,model,imei,serial,category,color,storage\nApple,iPhone 14,123456789012345,SN001234,smartphone,Space Gray,128GB\nSamsung,Galaxy S23,987654321098765,SN005678,smartphone,Phantom Black,256GB'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'device_registration_template.csv'; a.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) { showWarning('Please upload a CSV file'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) { showError('CSV must have a header row and at least one data row'); return }
      const header = lines[0].split(',').map(h => h.trim().toLowerCase())
      const required = ['brand', 'model']
      const missing = required.filter(r => !header.includes(r))
      if (missing.length) { showError(`Missing required columns: ${missing.join(', ')}`); return }
      const parsed: PreviewRow[] = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim())
        return { brand: vals[header.indexOf('brand')] || '', model: vals[header.indexOf('model')] || '', imei: vals[header.indexOf('imei')] || '', serial: vals[header.indexOf('serial')] || '', category: vals[header.indexOf('category')] || 'smartphone', color: vals[header.indexOf('color')] || '', storage: vals[header.indexOf('storage')] || '' }
      }).filter(r => r.brand && r.model)
      if (!parsed.length) { showError('No valid rows found'); return }
      setRows(parsed); setStep('preview')
    }
    reader.readAsText(file)
  }

  const submitAll = async () => {
    try {
      setSubmitting(true)
      const token = localStorage.getItem('auth_token')
      let success = 0; let failed = 0; const errors: string[] = []
      for (let i = 0; i < rows.length; i++) {
        try {
          await apiClient.devices.create({ ...rows[i], userId: user?.id })
          success++
        } catch (err: any) {
          failed++
          errors.push(`Row ${i + 2}: ${err?.message || 'Unknown error'}`)
        }
      }
      setResults({ success, failed, errors }); setStep('result')
      if (success > 0) showSuccess(`${success} device(s) registered`)
      if (failed > 0) showError(`${failed} device(s) failed`)
    } finally { setSubmitting(false) }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Upload size={24} className="text-white" />
                </div>
                <div>
                  <h1>Bulk Device Registration</h1>
                  <p>Register multiple devices via CSV upload</p>
                </div>
                <div className="ms-md-auto">
                  <button className="btn-outline-primary d-inline-flex align-items-center gap-2" onClick={downloadTemplate}>
                    <Download size={16} />
                    Download CSV Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            {step === 'upload' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-5 text-center">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FileSpreadsheet size={48} />
                    </div>
                    <h3>Upload CSV File</h3>
                    <p>Prepare a CSV with columns: brand, model, imei, serial, category, color, storage</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Brand and Model are required. Category defaults to 'smartphone' if omitted.
                    </p>
                    <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
                    <button className="btn-gradient-primary d-inline-flex align-items-center gap-2 mt-3" onClick={() => fileRef.current?.click()}>
                      <Upload size={18} />
                      Select CSV File
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-4 mb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <FileSpreadsheet size={24} style={{ color: 'var(--primary-600)' }} />
                      <div>
                        <h5 className="mb-1">{rows.length} Device(s) Loaded</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Review the data before submitting</p>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => { setStep('upload'); setRows([]) }}>
                        <Trash2 size={16} />
                        Clear
                      </button>
                      <button className="btn-gradient-primary d-inline-flex align-items-center gap-2" disabled={submitting} onClick={submitAll}>
                        {submitting ? <Loader2 size={18} className="spinner-border" /> : <Plus size={18} />}
                        {submitting ? 'Registering...' : `Register All (${rows.length})`}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modern-card p-0" style={{ overflowX: 'auto' }}>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Brand</th><th>Model</th><th>IMEI</th><th>Serial</th><th>Category</th><th>Color</th><th>Storage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                          <td className="fw-medium">{r.brand}</td>
                          <td>{r.model}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.imei || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.serial || '—'}</td>
                          <td>{r.category}</td>
                          <td>{r.color || '—'}</td>
                          <td>{r.storage || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {step === 'result' && results && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-4">
                  <h4 className="mb-4">Registration Complete</h4>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="stat-card">
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'var(--success-50)' }}>
                            <CheckCircle size={24} style={{ color: 'var(--success-500)' }} />
                          </div>
                          <div>
                            <p className="stat-label">Registered</p>
                            <p className="stat-value" style={{ color: 'var(--success-500)' }}>{results.success}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="stat-card">
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'var(--danger-50)' }}>
                            <AlertTriangle size={24} style={{ color: 'var(--danger-500)' }} />
                          </div>
                          <div>
                            <p className="stat-label">Failed</p>
                            <p className="stat-value" style={{ color: 'var(--danger-500)' }}>{results.failed}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {results.errors.length > 0 && (
                    <div className="modern-card p-3" style={{ backgroundColor: 'var(--danger-50)' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Info size={16} style={{ color: 'var(--danger-500)' }} />
                        <span className="fw-semibold" style={{ color: 'var(--danger-700)' }}>Errors</span>
                      </div>
                      <ul className="mb-0" style={{ fontSize: 13 }}>
                        {results.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 d-flex gap-2">
                    <button className="btn-gradient-primary d-inline-flex align-items-center gap-2" onClick={() => { setStep('upload'); setRows([]); setResults(null) }}>
                      <Upload size={16} />
                      Upload Another File
                    </button>
                    <button className="btn-outline-primary d-inline-flex align-items-center gap-2" onClick={() => window.location.href = '/my-devices'}>
                      <Eye size={16} />
                      View My Devices
                    </button>
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
