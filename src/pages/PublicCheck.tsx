import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Smartphone, Shield, AlertTriangle, CheckCircle, Loader2, MapPin, Copy, ExternalLink } from 'lucide-react'
import Navbar from '../components/Navbar'

type CheckResult = {
  status: string
  brand?: string
  model?: string
  imei?: string
  serial?: string
  reported?: boolean
  reportType?: string
  riskScore?: number
  latitude?: number
  longitude?: number
  locationAccuracy?: number
}

const GoogleMapPin: React.FC<{ lat: number; lon: number; accuracy?: number }> = ({ lat, lon, accuracy: _accuracy }) => {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`} target="_blank" rel="noreferrer" className="btn-ghost d-inline-flex align-items-center gap-2">
        <ExternalLink size={16} /> Open in Google Maps
      </a>
    )
  }
  return (
    <iframe
      title="Location"
      src={`https://www.google.com/maps?q=${lat},${lon}&z=15&output=embed`}
      width="100%" height="220"
      style={{ border: 0, borderRadius: 8 }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export default function PublicCheck() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    const q = query.trim()
    if (!q) return
    try {
      setLoading(true); setError(null); setResult(null); setSearched(false)
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/check?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Device not found in registry')
      const data = await res.json()
      setResult(data.data || data)
    } catch (err: any) { setError(err.message || 'Lookup failed') }
    finally { setLoading(false); setSearched(true) }
  }

  const statusDisplay = (s?: string) => {
    const st = (s || '').toLowerCase()
    if (['clean', 'verified', 'clear'].includes(st)) return { label: 'No Reports Found', color: 'var(--success-500)', icon: CheckCircle, badge: 'status-verified' }
    if (st === 'stolen') return { label: 'Reported Stolen', color: 'var(--danger-500)', icon: AlertTriangle, badge: 'status-stolen' }
    if (st === 'lost') return { label: 'Reported Lost', color: 'var(--warning-500)', icon: AlertTriangle, badge: 'status-unverified' }
    return { label: 'Unknown Status', color: 'var(--text-secondary)', icon: Shield, badge: 'status-found' }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleCheck() }

  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row justify-content-center py-5">
          <div className="col-lg-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-5">
                <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 72, height: 72, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Shield size={36} className="text-white" />
                </div>
                <h1>Public Device Check</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
                  Check if a device has been reported as stolen or lost before buying.
                </p>
              </div>

              <div className="modern-card p-4 p-md-5 mb-4">
                <div className="d-flex gap-2">
                  <div className="d-flex align-items-center gap-2 flex-grow-1 modern-input" style={{ padding: '0 16px' }}>
                    <Search size={20} style={{ color: 'var(--text-secondary)' }} />
                    <input ref={inputRef} type="text" className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '14px 0', fontSize: 16 }} placeholder="Enter IMEI, serial number, or device model..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
                  </div>
                  <button className="btn-gradient-primary px-4" disabled={loading || !query.trim()} onClick={handleCheck}>
                    {loading ? <Loader2 size={20} className="spinner-border" /> : 'Check'}
                  </button>
                </div>
                <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  This check is free and anonymous. No account required.
                </p>
              </div>

              {loading && (
                <div className="modern-card p-5 text-center">
                  <Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} />
                  <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Looking up device...</p>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="modern-card p-4">
                  <div className="alert-banner alert-banner-warning d-flex align-items-center gap-2">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="modern-card p-4 mb-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="avatar avatar-lg" style={{ background: 'var(--primary-50)' }}>
                        <Smartphone size={24} style={{ color: 'var(--primary-600)' }} />
                      </div>
                      <div>
                        <h4 className="mb-1">{result.brand || 'Device'} {result.model || ''}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {result.imei && <>IMEI: {result.imei}</>}
                          {result.serial && <> &middot; Serial: {result.serial}</>}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const sd = statusDisplay(result.status)
                      const Icon = sd.icon
                      return (
                        <div className="p-4 rounded-3 text-center" style={{ backgroundColor: sd.color === 'var(--success-500)' ? 'var(--success-50)' : sd.color === 'var(--danger-500)' ? 'var(--danger-50)' : 'var(--gray-50)' }}>
                          <Icon size={40} style={{ color: sd.color }} />
                          <h5 className="mt-2 mb-0" style={{ color: sd.color }}>{sd.label}</h5>
                          {result.reported && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }} className="mt-1">Type: {result.reportType || 'Stolen'}</p>}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <div className="modern-card p-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <Shield size={18} style={{ color: 'var(--primary-600)' }} />
                          <span className="fw-semibold">Risk Score</span>
                        </div>
                        <div className="text-center">
                          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2" style={{ width: 80, height: 80, background: 'conic-gradient(var(--success-500) 0deg 360deg, var(--gray-200) 360deg)' }}>
                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 56, height: 56, backgroundColor: 'var(--bg-primary)' }}>
                              <span className="h4 mb-0 fw-bold" style={{ color: 'var(--success-500)' }}>{result.riskScore ?? 0}</span>
                            </div>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Low Risk</p>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }} className="text-center mb-0">
                          No reported incidents for this device.
                        </p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="modern-card p-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <MapPin size={18} style={{ color: 'var(--danger-500)' }} />
                          <span className="fw-semibold">Last Known Location</span>
                        </div>
                        {result.latitude && result.longitude ? (
                          <>
                            <GoogleMapPin lat={result.latitude} lon={result.longitude} accuracy={result.locationAccuracy} />
                            <p className="mt-2 mb-0" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                              {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                            </p>
                          </>
                        ) : (
                          <div className="d-flex align-items-center justify-content-center py-4" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin size={24} className="me-2" />
                            No location data
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modern-card p-3 mt-4">
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                      <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => { navigator.clipboard?.writeText(query); (window as any).__toast?.showSuccess?.('Copied!') }}>
                        <Copy size={16} /> Copy Query
                      </button>
                      <button className="btn-outline-primary d-inline-flex align-items-center gap-2" onClick={() => { setQuery(''); setResult(null); setSearched(false); setError(null); inputRef.current?.focus() }}>
                        <Search size={16} /> Check Another
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {searched && !result && !error && !loading && (
                <div className="modern-card p-5 text-center">
                  <div className="empty-state">
                    <div className="empty-state-icon"><Search size={48} /></div>
                    <h3>No Results</h3>
                    <p>No device found matching your search. Try a different IMEI or serial number.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
