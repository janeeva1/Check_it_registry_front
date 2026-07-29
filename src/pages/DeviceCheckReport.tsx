import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Search, MapPin, Clock, AlertTriangle,
  Info, Copy, ExternalLink, Eye, User, Smartphone, FileText,
  Activity, Monitor, Globe, Signal
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'

type CheckRecord = {
  check?: {
    id: string
    device_id?: string
    created_at?: string
    check_result?: string
    ip_address?: string
    mac_address?: string
    user_agent?: string
    device_fingerprint?: string
    browser_fingerprint?: string
    risk_score?: number
    latitude?: number
    longitude?: number
    location_accuracy?: number
  } | null
  checker?: { id?: string; name?: string; email?: string } | null
  device?: { id?: string; brand?: string; model?: string; imei?: string; serial?: string; status?: string } | null
}

export default function DeviceCheckReport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const checkId = searchParams.get('checkId') || searchParams.get('id') || ''
  const [record, setRecord] = useState<CheckRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualCheckId, setManualCheckId] = useState('')
  const [showFonts, setShowFonts] = useState(false)
  const [showPlugins, setShowPlugins] = useState(false)
  const { toasts, removeToast, showError: _showError } = useToast()

  const parsedFingerprint = (() => {
    const raw = record?.check?.device_fingerprint
    if (!raw) return null as any
    try {
      if (typeof raw === 'string') return JSON.parse(raw)
      if (typeof raw === 'object') return raw
      return null
    } catch {
      return null
    }
  })()

  const GoogleMapPin: React.FC<{ lat: number; lon: number; accuracy?: number }> = ({ lat, lon, accuracy }) => {
    const mapRef = useRef<HTMLDivElement | null>(null)
    const [jsApiReady, setJsApiReady] = useState(false)
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined

    useEffect(() => {
      let cancelled = false
      const loadJsApi = async () => {
        if (!apiKey) return
        try {
          if ((window as any).google?.maps) { setJsApiReady(true); return }
          let script = document.querySelector('script[data-google-maps]') as HTMLScriptElement | null
          if (!script) {
            script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
            script.async = true; script.defer = true
            script.setAttribute('data-google-maps', 'true')
            document.head.appendChild(script)
          }
          await new Promise<void>((resolve, reject) => {
            script!.onload = () => resolve()
            script!.onerror = () => reject(new Error('Failed to load Google Maps JS API'))
            if ((window as any).google?.maps) resolve()
          })
          if (!cancelled) setJsApiReady(true)
        } catch { if (!cancelled) setJsApiReady(false) }
      }
      loadJsApi()
      return () => { cancelled = true }
    }, [apiKey])

    useEffect(() => {
      if (!jsApiReady || !mapRef.current) return
      try {
        const g = (window as any).google
        const center = { lat, lng: lon }
        const map = new g.maps.Map(mapRef.current, { center, zoom: 15, mapTypeId: 'roadmap' })
        new g.maps.Marker({ position: center, map })
        if (typeof accuracy === 'number' && accuracy > 0) {
          new g.maps.Circle({
            strokeColor: '#4285F4', strokeOpacity: 0.6, strokeWeight: 1,
            fillColor: '#4285F4', fillOpacity: 0.15, map, center,
            radius: Math.min(accuracy, 2000)
          })
        }
      } catch { setJsApiReady(false) }
    }, [jsApiReady, lat, lon, accuracy])

    if (!apiKey || !jsApiReady) {
      return (
        <iframe
          title="Google Map"
          src={`https://www.google.com/maps?q=${lat},${lon}&z=15&output=embed`}
          width="100%" height="260"
          style={{ border: 0, borderRadius: 8 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )
    }
    return <div ref={mapRef} style={{ width: '100%', height: 260, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }} />
  }

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true); setError(null)
        if (!checkId) { setRecord(null); return }
        const token = localStorage.getItem('auth_token')
        const _headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await apiClient.deviceChecks.get(checkId)
        const data = (res as any)?.data || res
        setRecord(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load check report')
      } finally { setLoading(false) }
    }
    fetchRecord()
  }, [checkId])

  const statusBadge = (s?: string) => {
    const st = (s || '').toLowerCase()
    if (['clean', 'verified', 'clear'].includes(st)) return <span className="status-badge status-verified">Clean</span>
    if (st === 'stolen') return <span className="status-badge status-stolen">Stolen</span>
    if (st === 'lost') return <span className="status-badge status-unverified">Lost</span>
    if (['not_found', 'unknown'].includes(st)) return <span className="status-badge status-found">Not Found</span>
    return <span className="status-badge status-found">Unknown</span>
  }

  const getRiskLevel = (score?: number) => {
    if (score == null) return { label: 'Unknown', color: 'var(--text-secondary)' }
    if (score < 30) return { label: 'Low Risk', color: 'var(--success-500)' }
    if (score < 60) return { label: 'Medium Risk', color: 'var(--warning-500)' }
    return { label: 'High Risk', color: 'var(--danger-500)' }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h1>Device Check Report</h1>
                  <p>Detailed verification report and risk assessment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modern-card p-5">
                <div className="text-center">
                  <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading check report...</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="modern-card p-4">
                <div className="alert-banner alert-banner-danger">
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {!loading && !record && !error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="modern-card p-5">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Search size={48} />
                  </div>
                  <h3>Enter a Check ID</h3>
                  <p>Paste a check ID to view the detailed report</p>
                  <div className="d-flex gap-2 w-100" style={{ maxWidth: 500 }}>
                    <input
                      type="text"
                      className="modern-input flex-grow-1"
                      placeholder="e.g. 7f8e2b54-..."
                      value={manualCheckId}
                      onChange={(e) => setManualCheckId(e.target.value)}
                    />
                    <button
                      className="btn-gradient-primary"
                      onClick={() => {
                        const id = manualCheckId.trim()
                        if (!id) return
                        const params = new URLSearchParams(searchParams)
                        params.set('checkId', id); params.delete('id')
                        setSearchParams(params)
                      }}
                    >
                      Load Report
                    </button>
                  </div>
                  <p className="mt-3" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Tip: Copy the Check ID from the Alerts page or your check history
                  </p>
                </div>
              </motion.div>
            )}

            {record && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modern-card p-4 mb-4">
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                          <Smartphone size={24} />
                        </div>
                        <div>
                          <h5 className="mb-1">{record.device?.brand || 'Unknown'} {record.device?.model || ''}</h5>
                          <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            IMEI: {record.device?.imei || '—'} &middot; Serial: {record.device?.serial || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 text-md-end">
                      {statusBadge(record.check?.check_result)}
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-lg-6">
                    <div className="modern-card p-4 h-100">
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <Activity size={20} style={{ color: 'var(--primary-600)' }} />
                        <h5 className="mb-0">Risk Assessment</h5>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }} className="mb-4">
                        Calculated using reported incidents and device fingerprint signals
                      </p>

                      <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{
                            width: 100, height: 100,
                            background: `conic-gradient(${getRiskLevel(record.check?.risk_score).color} 0deg ${(record.check?.risk_score || 0) * 3.6}deg, var(--gray-200) ${(record.check?.risk_score || 0) * 3.6}deg 360deg)`
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 70, height: 70, backgroundColor: 'var(--bg-primary)' }}>
                            <span className="h3 mb-0 fw-bold" style={{ color: getRiskLevel(record.check?.risk_score).color }}>
                              {record.check?.risk_score ?? '—'}
                            </span>
                          </div>
                        </div>
                        <p className="fw-semibold" style={{ color: getRiskLevel(record.check?.risk_score).color }}>
                          {getRiskLevel(record.check?.risk_score).label}
                        </p>
                      </div>

                      <div className="d-flex align-items-center gap-2 p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                        <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          Checked: {record.check?.created_at ? new Date(record.check.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="modern-card p-4 h-100">
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <MapPin size={20} style={{ color: 'var(--danger-500)' }} />
                        <h5 className="mb-0">Live Location</h5>
                      </div>

                      {(() => {
                        const latRaw = record.check?.latitude as any
                        const lonRaw = record.check?.longitude as any
                        const accRaw = record.check?.location_accuracy as any
                        const latNum = typeof latRaw === 'number' ? latRaw : (typeof latRaw === 'string' ? parseFloat(latRaw) : NaN)
                        const lonNum = typeof lonRaw === 'number' ? lonRaw : (typeof lonRaw === 'string' ? parseFloat(lonRaw) : NaN)
                        const accNum = typeof accRaw === 'number' ? accRaw : (typeof accRaw === 'string' ? parseFloat(accRaw) : NaN)
                        const hasCoords = Number.isFinite(latNum) && Number.isFinite(lonNum)
                        return hasCoords ? (
                          <>
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <Signal size={14} style={{ color: 'var(--success-500)' }} />
                              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                {latNum.toFixed(6)}, {lonNum.toFixed(6)} (±{Number.isFinite(accNum) ? `${Math.round(accNum)}m` : '—'})
                              </span>
                            </div>
                            <GoogleMapPin lat={latNum} lon={lonNum} accuracy={Number.isFinite(accNum) ? accNum : undefined} />
                            <a href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lonNum}`} target="_blank" rel="noreferrer" className="btn-ghost mt-2 d-inline-flex align-items-center gap-2">
                              <ExternalLink size={14} />
                              Open in Google Maps
                            </a>
                          </>
                        ) : (
                          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin size={24} className="me-2" />
                            No location data captured
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                <div className="modern-card p-4 mt-4">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <Shield size={20} style={{ color: 'var(--primary-600)' }} />
                    <h5 className="mb-0">Registry Matches</h5>
                  </div>

                  <div className="row g-4">
                    <div className="col-12 col-lg-8">
                      <div className="modern-card p-4" style={{ backgroundColor: 'var(--gray-50)' }}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <Info size={18} style={{ color: 'var(--primary-600)' }} />
                            <span className="fw-semibold">Check Details</span>
                          </div>
                          {statusBadge(record.check?.check_result)}
                        </div>
                        <div className="row g-2" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          <div className="col-6"><Globe size={12} className="me-1" />IP: {record.check?.ip_address || '—'}</div>
                          <div className="col-6"><Monitor size={12} className="me-1" />MAC: {record.check?.mac_address || '—'}</div>
                          <div className="col-12 mt-2">
                            <Eye size={12} className="me-1" />User-Agent: {parsedFingerprint?.userAgent || record.check?.user_agent || '—'}
                          </div>
                          <div className="col-6">Browser FP: {parsedFingerprint?.browserFingerprint || record.check?.browser_fingerprint || '—'}</div>
                          <div className="col-6">Screen: {parsedFingerprint?.screenResolution || '—'}</div>
                          <div className="col-6">Timezone: {parsedFingerprint?.timezone || '—'}</div>
                          <div className="col-6">Language: {parsedFingerprint?.language || '—'}</div>
                          <div className="col-6">Platform: {parsedFingerprint?.platform || '—'}</div>
                          <div className="col-6">Cookies: {parsedFingerprint?.cookieEnabled === true || parsedFingerprint?.cookieEnabled === false ? String(parsedFingerprint.cookieEnabled) : '—'}</div>
                          <div className="col-6">Do Not Track: {parsedFingerprint?.doNotTrack ?? '—'}</div>
                          <div className="col-6">Canvas: {parsedFingerprint?.canvas || '—'}</div>
                          <div className="col-6">WebGL: {parsedFingerprint?.webgl || '—'}</div>
                          <div className="col-6">
                            Fonts: {Array.isArray(parsedFingerprint?.fonts) ? parsedFingerprint.fonts.length : '—'}
                            {Array.isArray(parsedFingerprint?.fonts) && (
                              <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => setShowFonts(v => !v)}>
                                {showFonts ? 'Hide' : 'Show'}
                              </button>
                            )}
                            {showFonts && Array.isArray(parsedFingerprint?.fonts) && (
                              <div className="mt-1">{parsedFingerprint.fonts.join(', ')}</div>
                            )}
                          </div>
                          <div className="col-6">
                            Plugins: {Array.isArray(parsedFingerprint?.plugins) ? parsedFingerprint.plugins.length : '—'}
                            {Array.isArray(parsedFingerprint?.plugins) && (
                              <button className="btn btn-link btn-sm p-0 ms-1" onClick={() => setShowPlugins(v => !v)}>
                                {showPlugins ? 'Hide' : 'Show'}
                              </button>
                            )}
                            {showPlugins && Array.isArray(parsedFingerprint?.plugins) && (
                              <div className="mt-1">{parsedFingerprint.plugins.join(', ')}</div>
                            )}
                          </div>
                          <div className="col-12">Timestamp: {parsedFingerprint?.timestamp ? new Date(parsedFingerprint.timestamp).toLocaleString() : '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-4">
                      <div className="modern-card p-4" style={{ backgroundColor: 'var(--gray-50)' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <User size={18} style={{ color: 'var(--primary-600)' }} />
                          <span className="fw-semibold">Checker</span>
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))' }}>
                            {(record.checker?.name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="fw-medium mb-0">{record.checker?.name || 'Anonymous'}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{record.checker?.email || '—'}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${record.checker?.id ? 'status-verified' : 'status-found'}`}>
                          {record.checker?.id ? 'Identified' : 'Public'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-card p-4 mt-4">
                  <div className="d-flex flex-wrap gap-3 justify-content-end">
                    <Link to="/report-incident" className="btn-gradient-danger d-flex align-items-center gap-2">
                      <AlertTriangle size={18} />
                      Report Incident
                    </Link>
                    <Link to="/verification-status" className="btn-outline-primary d-flex align-items-center gap-2">
                      <Eye size={18} />
                      View Verification Status
                    </Link>
                    <button className="btn-ghost d-flex align-items-center gap-2" onClick={() => { navigator.clipboard?.writeText(checkId) }}>
                      <Copy size={16} />
                      Copy Check ID
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
