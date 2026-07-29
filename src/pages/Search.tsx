import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, Smartphone, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

type SearchResult = {
  id: string
  brand: string
  model: string
  imei: string
  serial: string
  status: string
  category: string
  created_at: string
}

type QuickCheckResult = {
  status: string
  brand?: string
  model?: string
  imei?: string
  riskScore?: number
}

export default function Search() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { user: _user } = useAuth()
  const { toasts, removeToast, showSuccess: _showSuccess, showError: _showError } = useToast()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'all' | 'devices' | 'quick'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [quickResult, setQuickResult] = useState<QuickCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    if (mode === 'quick') {
      await quickCheck(q)
      return
    }
    try {
      setLoading(true); setSearched(true); setResults([])
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/search?q=${encodeURIComponent(q)}&type=${mode}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.data || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const quickCheck = async (q: string) => {
    try {
      setLoading(true); setSearched(true); setQuickResult(null)
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/devices/check?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setQuickResult(data.data || data)
    } catch { setQuickResult(null) }
    finally { setLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }

  const statusBadge = (s?: string) => {
    const st = (s || '').toLowerCase()
    if (['clean', 'verified', 'clear'].includes(st)) return <span className="status-badge status-verified">Clean</span>
    if (st === 'stolen') return <span className="status-badge status-stolen">Stolen</span>
    if (st === 'lost') return <span className="status-badge status-unverified">Lost</span>
    return <span className="status-badge status-found">Unknown</span>
  }

  const quickStatusDisplay = (s?: string) => {
    const st = (s || '').toLowerCase()
    if (['clean', 'verified', 'clear'].includes(st)) return { label: 'Clean', color: 'var(--success-500)', bg: 'var(--success-50)', icon: CheckCircle }
    if (st === 'stolen') return { label: 'Reported Stolen', color: 'var(--danger-500)', bg: 'var(--danger-50)', icon: AlertTriangle }
    if (st === 'lost') return { label: 'Reported Lost', color: 'var(--warning-500)', bg: 'var(--warning-50)', icon: AlertTriangle }
    return { label: 'Unknown', color: 'var(--text-secondary)', bg: 'var(--gray-50)', icon: Shield }
  }

  const modes = [
    { value: 'all', label: 'All' },
    { value: 'devices', label: 'Devices' },
    { value: 'quick', label: 'Quick Check' },
  ] as const

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <SearchIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1>Search</h1>
                  <p>Search devices or check device status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center mb-4">
          <div className="col-lg-8">
            <div className="modern-card p-4">
              <div className="d-flex gap-2 mb-3">
                {modes.map(m => (
                  <button key={m.value} onClick={() => { setMode(m.value); setResults([]); setQuickResult(null); setSearched(false) }}
                    className={`px-3 py-2 rounded-3 border ${mode === m.value ? 'border-primary' : ''}`}
                    style={{ background: mode === m.value ? 'var(--primary-50)' : 'var(--gray-50)', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="d-flex gap-2">
                <div className="d-flex align-items-center gap-2 flex-grow-1 modern-input" style={{ padding: '0 16px' }}>
                  <SearchIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                  <input ref={inputRef} type="text" className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0' }}
                    placeholder={mode === 'quick' ? 'Enter IMEI or serial for quick check...' : 'Search by IMEI, serial, brand, model...'}
                    value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
                </div>
                <button className="btn-gradient-primary px-4" disabled={loading || !query.trim()} onClick={handleSearch}>
                  {loading ? <Loader2 size={20} className="spinner-border" /> : 'Search'}
                </button>
              </div>

              {mode === 'quick' && (
                <p className="mt-2 mb-0" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  Public device check - no login required for IMEI/serial lookups
                </p>
              )}
            </div>
          </div>
        </div>

        {searched && mode === 'quick' && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {loading ? (
                <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
              ) : quickResult ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="modern-card p-4 mb-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="avatar avatar-lg" style={{ background: 'var(--primary-50)' }}>
                        <Smartphone size={24} style={{ color: 'var(--primary-600)' }} />
                      </div>
                      <div>
                        <h5 className="mb-1">{quickResult.brand || 'Device'} {quickResult.model || ''}</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>IMEI: {quickResult.imei || query}</p>
                      </div>
                    </div>
                    {(() => {
                      const qd = quickStatusDisplay(quickResult.status)
                      const Icon = qd.icon
                      return <div className="p-4 rounded-3 text-center" style={{ backgroundColor: qd.bg }}><Icon size={36} style={{ color: qd.color }} /><h5 className="mt-2 mb-0" style={{ color: qd.color }}>{qd.label}</h5></div>
                    })()}
                  </div>
                </motion.div>
              ) : (
                <div className="modern-card p-5 text-center">
                  <div className="empty-state"><div className="empty-state-icon"><SearchIcon size={48} /></div><h3>No Results</h3><p>No device found matching your query</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {searched && mode !== 'quick' && (
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {loading ? (
                <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
              ) : results.length === 0 ? (
                <div className="modern-card p-5 text-center">
                  <div className="empty-state"><div className="empty-state-icon"><SearchIcon size={48} /></div><h3>No Devices Found</h3><p>Try a different search term</p></div>
                </div>
              ) : (
                <div className="row g-3">
                  <AnimatePresence>
                    {results.map((d, i) => (
                      <motion.div key={d.id} className="col-12 col-md-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                        <Link to={`/device-details/${d.id}`} className="text-decoration-none">
                          <div className="modern-card p-3">
                            <div className="d-flex align-items-start gap-3">
                              <div className="avatar" style={{ background: 'var(--primary-50)' }}><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /></div>
                              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <p className="fw-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.brand} {d.model}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }} className="text-truncate">
                                  {d.category} &middot; IMEI: {d.imei || '—'} &middot; SN: {d.serial || '—'}
                                </p>
                                <div className="mt-2">{statusBadge(d.status)}</div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
