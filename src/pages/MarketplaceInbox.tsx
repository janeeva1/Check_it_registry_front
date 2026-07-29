import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Inbox,
  ChevronRight, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface InboxMessage {
  id: string
  device_id?: string
  device_title?: string
  from_name: string
  from_contact?: string
  subject: string
  message: string
  status: 'unread' | 'read'
  created_at: string
  online?: boolean
}

export default function MarketplaceInbox() {
  const [items, setItems] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, _setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState('')
  const { toasts: _toasts, removeToast: _removeToast, showError: _showError } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const sample: InboxMessage[] = [
      {
        id: 'msg_1',
        device_id: 'dev_123',
        device_title: 'Samsung S22 - Blue',
        from_name: 'Jane Doe',
        from_contact: '+233 555 123 456',
        subject: 'Interested in your device',
        message: 'Hi, is this device still available? Can we meet at Accra Mall?',
        status: 'unread',
        created_at: new Date().toISOString(),
        online: true,
      },
      {
        id: 'msg_2',
        device_id: 'dev_987',
        device_title: 'iPhone 12 - Black',
        from_name: 'Kofi Mensah',
        subject: 'Can you share more photos?',
        message: 'Please send additional photos and battery health.',
        status: 'read',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        online: false,
      },
      {
        id: 'msg_3',
        device_id: 'dev_456',
        device_title: 'Tecno Camon 18',
        from_name: 'Ama Serwaa',
        subject: 'Price negotiation',
        message: 'Would you consider ₦450,000? I can pick it up today.',
        status: 'unread',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        online: true,
      },
    ]
    setItems(sample)
    setLoading(false)
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    let list = items
    if (filter !== 'all') list = list.filter(i => i.status === filter)
    if (s) list = list.filter(i => [i.subject, i.message, i.device_title || '', i.from_name].some(v => v.toLowerCase().includes(s)))
    return list
  }, [items, filter, search])

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    return ((parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')).toUpperCase() || '?'
  }

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
                  onClick={() => navigate(`/marketplace-inbox/${m.id}`)}
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
                        {getInitials(m.from_name)}
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
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{m.from_name}</span>
                          {m.online && (
                            <span style={{ fontSize: 12, color: 'var(--success-500)' }}>Online</span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {timeAgo(m.created_at)}
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
                      {m.device_title && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                            {m.device_title}
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
