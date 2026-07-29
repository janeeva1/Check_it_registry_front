import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import {
  Search, Smartphone, Hash, Calendar,
  SlidersHorizontal, Eye, Shield, AlertTriangle, Download,
  Filter, Clock, MapPin, User
} from 'lucide-react'

interface SearchResult {
  id: string
  brand: string
  model: string
  imei?: string
  serial?: string
  status: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  owner_region?: string
  created_at: string
  last_check_at?: string
  report_count?: number
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'status-active',
    stolen: 'status-stolen',
    recovered: 'status-recovered',
    pending: 'status-pending',
    under_review: 'status-pending',
    resolved: 'status-verified',
    found: 'status-found',
    lost: 'status-pending'
  }
  const cls = map[status] || 'status-pending'
  return <span className={`status-badge ${cls}`}>{status.replace(/_/g, ' ')}</span>
}

export default function LEADeviceSearch() {
  const [imei, setImei] = useState('')
  const [serial, setSerial] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setSearched(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      if (imei.trim()) params.append('imei', imei.trim())
      if (serial.trim()) params.append('serial', serial.trim())
      if (brand.trim()) params.append('brand', brand.trim())
      if (model.trim()) params.append('model', model.trim())
      if (ownerName.trim()) params.append('owner_name', ownerName.trim())
      if (ownerEmail.trim()) params.append('owner_email', ownerEmail.trim())
      if (region.trim()) params.append('region', region.trim())
      if (status !== 'all') params.append('status', status)
      params.append('limit', '50')

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/lea-portal/device-search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      const json = await res.json()
      setResults(json.devices || json.results || [])
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally { setLoading(false) }
  }

  const handleClear = () => {
    setImei(''); setSerial(''); setBrand(''); setModel('')
    setOwnerName(''); setOwnerEmail(''); setRegion(''); setStatus('all')
    setResults([]); setSearched(false); setError(null)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  return (
    <Layout requireAuth allowedRoles={['lea']}>
      <motion.div className="container-fluid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={childVariants} className="page-header">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={24} color="white" />
            </div>
            <div>
              <h1>Device Search</h1>
              <p>Advanced search across registered and reported devices</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="modern-card p-4 mb-4">
          <form onSubmit={handleSearch}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <SlidersHorizontal size={18} />
              <span className="fw-semibold">Search Filters</span>
            </div>
            <div className="row g-3">
              <div className="col-md-4 col-lg-3">
                <label className="form-label"><Hash size={14} className="me-1" />IMEI</label>
                <input className="modern-input" placeholder="IMEI number" value={imei} onChange={e => setImei(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label">Serial</label>
                <input className="modern-input" placeholder="Serial number" value={serial} onChange={e => setSerial(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label"><Smartphone size={14} className="me-1" />Brand</label>
                <input className="modern-input" placeholder="e.g. Apple, Samsung" value={brand} onChange={e => setBrand(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label">Model</label>
                <input className="modern-input" placeholder="e.g. iPhone 14" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label"><User size={14} className="me-1" />Owner Name</label>
                <input className="modern-input" placeholder="Owner name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label">Owner Email</label>
                <input className="modern-input" placeholder="Email address" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label"><MapPin size={14} className="me-1" />Region</label>
                <input className="modern-input" placeholder="Region / state" value={region} onChange={e => setRegion(e.target.value)} />
              </div>
              <div className="col-md-4 col-lg-3">
                <label className="form-label"><Shield size={14} className="me-1" />Status</label>
                <select className="modern-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="stolen">Stolen</option>
                  <option value="recovered">Recovered</option>
                  <option value="pending">Pending</option>
                  <option value="found">Found</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn-gradient-primary">
                <Search size={18} /> Search Devices
              </button>
              <button type="button" className="btn-ghost" onClick={handleClear}>
                <Filter size={16} /> Clear Filters
              </button>
            </div>
          </form>
        </motion.div>

        {error && (
          <motion.div variants={childVariants} className="alert-banner alert-banner-danger mb-4">
            <AlertTriangle size={20} />
            <div>
              <strong>Search Error</strong>
              <div className="small">{error}</div>
            </div>
          </motion.div>
        )}

        <motion.div variants={childVariants} className="modern-card p-0">
          {loading ? (
            <div className="p-5 text-center">
              <div className="spinner-border text-primary mb-3" role="status" />
              <div className="text-muted small">Searching devices...</div>
            </div>
          ) : !searched ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={32} /></div>
              <h3>Search Devices</h3>
              <p>Use the filters above to search across all registered and reported devices. You can search by IMEI, serial, owner details, or device specifications.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Smartphone size={32} /></div>
              <h3>No results found</h3>
              <p>No devices match your search criteria. Try broadening your search terms.</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold">Search Results</span>
                  <span className="status-badge status-active">{results.length} devices</span>
                </div>
                <button className="btn-ghost"><Download size={16} /> Export</button>
              </div>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>IMEI / Serial</th>
                      <th>Owner</th>
                      <th>Region</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Last Check</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <motion.tr key={r.id} variants={childVariants} initial="hidden" animate="visible" layout>
                        <td className="fw-semibold">{r.brand} {r.model}</td>
                        <td><code className="small">{r.imei || r.serial || '-'}</code></td>
                        <td>
                          <div className="small fw-medium">{r.owner_name || '—'}</div>
                          <div className="text-muted small">{r.owner_email || ''}</div>
                        </td>
                        <td>{r.owner_region || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          {r.last_check_at ? (
                            <div className="d-flex align-items-center gap-1 text-secondary small">
                              <Clock size={12} /> {new Date(r.last_check_at).toLocaleDateString()}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="text-end">
                          <a href={`/lea/devices/${r.id}`} className="btn-ghost">
                            <Eye size={16} /> View
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  )
}
