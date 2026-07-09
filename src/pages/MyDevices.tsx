import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { Device, DeviceStatus } from '../types/database'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Smartphone, Search, Filter, RefreshCw, Plus, Eye, CheckCircle, AlertTriangle } from 'lucide-react'
import { SegmentedControl } from '../components/mobile/SegmentedControl'
import { StatsRow } from '../components/mobile/StatsRow'
import { SectionHeader } from '../components/mobile/SectionHeader'

interface DeviceListItem extends Device {
  verified_by_name?: string
  verified_by_email?: string
  days_registered?: number
  report_count?: number
  last_report_date?: string
}

export default function MyDevices() {
  const [devices, setDevices] = useState<DeviceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<DeviceStatus | ''>('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<{ key: string; label: string }[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [limit] = useState(12)
  const { toasts, removeToast, showError, showSuccess } = useToast()

  // Unified API base
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

  useEffect(() => {
    loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, brand, page])

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No authentication token found')

      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (brand) params.append('brand', brand)
      if (search) params.append('search', search)
      params.append('page', String(page))
      params.append('limit', String(limit))

      const res = await fetch(`${API_URL}/user-portal/devices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch devices')
      const json = await res.json()
      const list: DeviceListItem[] = json?.data?.devices || []
      const pg = json?.data?.pagination?.pages || 1
      setDevices(list)
      setPages(pg)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error loading devices'
      setError(msg)
      showError('Loading Error', msg)
    } finally {
      setLoading(false)
    }
  }

  // Load categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return
        const res = await fetch(`${API_URL}/device-management/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        const opts = Array.isArray(data) ? data : []
        setCategories(opts)
      } catch { /* fetch may fail silently */ }
    }
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    let list = devices
    if (category) {
      list = list.filter(d => (d as any).category === category)
    }
    if (!s) return list
    return list.filter(d => (
      [d.brand, d.model, d.imei || '', d.serial || '']
        .some(v => v?.toLowerCase().includes(s))
    ))
  }, [devices, search, category])

  const resetFilters = () => {
    setStatus('')
    setBrand('')
    setSearch('')
    setCategory('')
    setPage(1)
    showSuccess('Filters Reset', 'Showing all your devices')
    loadDevices()
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
          <SectionHeader
            title="My Devices"
            subtitle="Manage your registered devices"
            actions={
              <div className="d-flex gap-2">
                <Link to="/register-device" className="btn-gradient-primary d-flex align-items-center gap-2">
                  <Plus size={18} /> Register New
                </Link>
                <Link to="/report-missing" className="btn-gradient-danger d-flex align-items-center gap-2">
                  <Smartphone size={18} /> Report Issue
                </Link>
              </div>
            }
          />
        </motion.div>

        {/* Quick stats row inspired by mobile designs */}
        <div className="modern-card p-3 mb-3">
          <StatsRow
            items={[
              { label: 'Total', value: devices.length, icon: <Smartphone size={16} style={{ color: 'var(--primary-600)' }} /> },
              { label: 'Verified', value: devices.filter(d => d.status === 'verified').length, icon: <CheckCircle size={16} style={{ color: 'var(--success-500)' }} /> },
              { label: 'Issues', value: devices.filter(d => ['stolen','lost'].includes(d.status)).length, icon: <AlertTriangle size={16} style={{ color: 'var(--warning-500)' }} /> },
              { label: 'Unverified', value: devices.filter(d => d.status === 'unverified').length, icon: <Smartphone size={16} style={{ color: 'var(--text-secondary)' }} /> },
            ]}
          />
        </div>

        {/* Mobile-style segmented filters + search */}
        <div className="modern-card p-3 mb-3">
          <div className="d-flex flex-column gap-3">
            <SegmentedControl
              options={[
                { key: 'all', label: 'All' },
                { key: 'verified', label: 'Verified' },
                { key: 'unverified', label: 'Unverified' },
                { key: 'stolen', label: 'Stolen' },
                { key: 'lost', label: 'Lost' },
                { key: 'found', label: 'Found' },
                { key: 'pending_transfer', label: 'Transfer' },
              ]}
              value={status || 'all'}
              onChange={(key) => setStatus(key === 'all' ? '' : (key as DeviceStatus))}
            />
            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Search</label>
                <div className="input-group">
                  <span className="input-group-text"><Search size={16} /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)} className="form-control" placeholder="Brand, model, IMEI, serial" />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Brand</label>
                <input value={brand} onChange={e => setBrand(e.target.value)} className="form-control" placeholder="e.g. Samsung" />
              </div>
              <div className="col-md-2">
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">All</option>
                  {categories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button onClick={loadDevices} className="btn btn-outline-primary d-flex align-items-center gap-2"><Filter size={16} /> Apply</button>
                <button onClick={resetFilters} className="btn btn-outline-secondary d-flex align-items-center gap-2"><RefreshCw size={16} /> Reset</button>
              </div>
            </div>
          </div>
        </div>

        {/* Device list inspired by mobile_app/my_devices_list_page */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--primary-600)' }} />
            <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading devices…</p>
          </div>
        ) : error ? (
          <div className="modern-card p-4 text-center" style={{ color: 'var(--danger-500)' }}>{error}</div>
        ) : (
          <div className="modern-card p-2">
            {filtered.map(device => (
              <div key={device.id} className="p-3 d-flex align-items-center gap-3 rounded position-relative" style={{ transition: 'box-shadow 0.2s', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                {/* Left accent bar */}
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 6, height: 24, borderTopRightRadius: 6, borderBottomRightRadius: 6, background: device.status === 'verified' ? 'var(--success-500)' : ['stolen','lost'].includes(device.status) ? 'var(--warning-500)' : 'var(--border-color)' }} />
                <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 44, height: 44, backgroundColor: 'var(--bg-tertiary)' }}>
                  <Smartphone size={22} style={{ color: 'var(--primary-600)' }} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <p className="mb-1 fw-semibold" style={{ color: 'var(--text-primary)' }}>{device.brand} {device.model}</p>
                    <span className={`badge ${device.status === 'verified' ? 'status-verified' : device.status === 'unverified' ? 'status-unverified' : ['stolen','lost'].includes(device.status) ? 'status-stolen' : 'status-found'}`}>{device.status}</span>
                  </div>
                  <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>IMEI: {device.imei || '—'} | Serial: {device.serial || '—'}</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Link to={`/device/${device.id}`} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"><Eye size={14} /> Details</Link>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>No devices match your filters.</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-outline-secondary">Prev</button>
            <span style={{ color: 'var(--text-secondary)' }}>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="btn btn-outline-secondary">Next</button>
          </div>
        )}

        {/* Floating Action Button inspired by mobile_app */}
        <Link to="/register-device" className="d-inline-flex align-items-center justify-content-center" style={{ position: 'fixed', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 16, background: 'var(--primary-600)', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <Plus size={22} />
        </Link>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}