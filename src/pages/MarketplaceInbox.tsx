import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Inbox,
  ChevronRight, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUserInitials } from '../utils/userHelpers'
import { apiClient } from '../lib/apiClient'

interface InboxMessage {
  id: string
  deviceId?: string
  deviceTitle?: string
  fromName: string
  fromContact?: string
  subject: string
  message: string
  status: 'unread' | 'read'
  createdAt: string
  online?: boolean
}

export default function MarketplaceInbox() {
  const [items, setItems] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState('')
  const { toasts, removeToast, showError } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadInbox()
  }, [])

  const loadInbox = async () => {
    try {
      setLoading(true)
      setError(null)
      const data: any = await apiClient.marketplace.getInbox()
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setItems(rows.map((r: any) => ({
        id: r.id,
        deviceId: r.deviceId || r.device_id || null,
        deviceTitle: r.deviceTitle || r.device_title || null,
        fromName: r.fromName || r.from_name || 'Unknown',
        fromContact: r.fromContact || r.from_contact || '',
        subject: r.subject || r.deviceTitle || 'No subject',
        message: r.message || '',
        status: r.status === 'unread' ? 'unread' : 'read',
        createdAt: r.createdAt || r.created_at || new Date().toISOString(),
        online: r.online || false,
      })))
    } catch (err: any) {
      setError(err?.message || 'Failed to load inbox')
      showError('Load Failed', err?.message || 'Could not load inbox')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    let list = items
    if (filter !== 'all') list = list.filter(i => i.status === filter)
    if (s) list = list.filter(i => [i.subject, i.message, i.deviceTitle || '', i.fromName].some(v => v.toLowerCase().includes(s)))
    return list
  }, [items, filter, search])

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
  }

  return (
    <Layout requireAuth>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container-fluid" style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h1>Inbox</h1>
              <p>Manage buyer inquiries and messages</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  className="modern-input"
                  style={{ paddingLeft: 36, paddingTop: 8, paddingBottom: 8, fontSize: 14, width: 220 }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search messages..."
                />
              </div>
              <select
                className="modern-select"
                style={{ width: 140, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="modern-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-title" style={{ width: '30%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="modern-card" style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ color: 'var(--danger-500)' }}>{error}</p>
            <button className="btn-ghost mt-2" onClick={loadInbox}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={28} />
            </div>
            <h3>No messages yet</h3>
            <p>When buyers message you about your listings, they'll appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {filtered.map(m => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="modern-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    borderLeft: m.status === 'unread' ? '3px solid var(--primary-500)' : '3px solid transparent',
                    background: m.status === 'unread' ? 'rgba(34, 197, 94, 0.02)' : undefined,
                  }}
                  onClick={() => navigate(m.deviceId ? `/marketplace/${m.deviceId}` : '#')}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative' }}>
                      <div
                        className="avatar"
                        style={{
                          width: 52, height: 52, fontSize: 18,
                          background: m.online ? 'var(--primary-500)' : 'var(--gray-400)',
                        }}
                      >
                        {getUserInitials({ name: m.fromName })}
                      </div>
                      {m.online && (
                        <span
                          style={{
                            position: 'absolute', bottom: 0, right: 0, width: 14, height: 14,
                            borderRadius: '50%', background: 'var(--success-500)',
                            border: '3px solid var(--bg-primary)',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{m.fromName}</span>
                          {m.online && (
                            <span style={{ fontSize: 12, color: 'var(--success-500)' }}>Online</span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {timeAgo(m.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: m.status === 'unread' ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 2 }}>
                        {m.subject}
                      </div>
                      <p style={{
                        fontSize: 13, color: 'var(--text-tertiary)', margin: 0,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {m.message}
                      </p>
                      {m.deviceTitle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                            {m.deviceTitle}
                          </span>
                          {m.status === 'unread' && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--primary-500)', color: '#fff' }}>
                              New
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 16 }} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  )
}
