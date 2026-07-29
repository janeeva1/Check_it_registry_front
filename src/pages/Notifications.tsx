import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Shield, Smartphone, Clock, CheckCheck, Loader2, Trash2, RefreshCw, Eye } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { Link } from 'react-router-dom'

type Notification = {
  id: string
  type: 'alert' | 'verification' | 'transfer' | 'report' | 'system'
  title: string
  message: string
  read: boolean
  link?: string
  created_at: string
}

export default function Notifications() {
  const { user: _user } = useAuth()
  const { toasts, removeToast, showSuccess, showError: _showError } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setNotifications(data.data || [])
    } catch {
      setNotifications([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications

  const markRead = async (id: string) => {
    const token = localStorage.getItem('auth_token')
    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const token = localStorage.getItem('auth_token')
    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    setNotifications(p => p.map(n => ({ ...n, read: true })))
    showSuccess('All marked as read')
  }

  const deleteNotification = async (id: string) => {
    const token = localStorage.getItem('auth_token')
    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setNotifications(p => p.filter(n => n.id !== id))
  }

  const typeIcon = (type: string) => {
    const map: Record<string, { icon: any; color: string; bg: string }> = {
      alert: { icon: AlertTriangle, color: 'var(--danger-500)', bg: 'var(--danger-50)' },
      verification: { icon: Shield, color: 'var(--primary-600)', bg: 'var(--primary-50)' },
      transfer: { icon: Smartphone, color: 'var(--warning-500)', bg: 'var(--warning-50)' },
      report: { icon: Clock, color: 'var(--info-500)', bg: 'var(--info-50)' },
      system: { icon: Bell, color: 'var(--text-secondary)', bg: 'var(--gray-100)' },
    }
    return map[type] || map.system
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Bell size={24} className="text-white" />
                </div>
                <div>
                  <h1>Notifications</h1>
                  <p>Stay updated on your devices and reports</p>
                </div>
                <div className="ms-md-auto d-flex gap-2">
                  {unreadCount > 0 && (
                    <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={markAllRead}>
                      <CheckCheck size={16} /> Mark All Read
                    </button>
                  )}
                  <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={fetchNotifications}>
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modern-card p-3 mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-2 rounded-3 border ${filter === 'all' ? 'border-primary' : ''}`} style={{ background: filter === 'all' ? 'var(--primary-50)' : 'var(--gray-50)', fontSize: 13, cursor: 'pointer' }}>
                All {filter === 'all' && `(${notifications.length})`}
              </button>
              <button onClick={() => setFilter('unread')} className={`px-3 py-2 rounded-3 border ${filter === 'unread' ? 'border-primary' : ''}`} style={{ background: filter === 'unread' ? 'var(--primary-50)' : 'var(--gray-50)', fontSize: 13, cursor: 'pointer' }}>
                Unread {filter === 'unread' && `(${unreadCount})`}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" style={{ color: 'var(--primary-600)' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="modern-card p-5 text-center">
            <div className="empty-state">
              <div className="empty-state-icon"><Bell size={48} /></div>
              <h3>No Notifications</h3>
              <p>{filter === 'unread' ? 'All caught up!' : 'No notifications yet'}</p>
            </div>
          </div>
        ) : (
          <div className="row g-2">
            <AnimatePresence>
              {filtered.map((n, _i) => {
                const ti = typeIcon(n.type)
                const Icon = ti.icon
                return (
                  <motion.div key={n.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} layout>
                    <div className={`modern-card p-3 ${!n.read ? 'border-primary' : ''}`} style={{ background: !n.read ? 'var(--primary-50)' : '' }}>
                      <div className="row g-3 align-items-start">
                        <div className="col-auto">
                          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 40, height: 40, background: ti.bg }}>
                            <Icon size={20} style={{ color: ti.color }} />
                          </div>
                        </div>
                        <div className="col" style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <p className="fw-medium mb-0" style={{ fontSize: 14 }}>{n.title}</p>
                            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-600)', flexShrink: 0 }} />}
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{n.message}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        <div className="col-auto d-flex flex-column gap-1">
                          {n.link && <Link to={n.link} className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}><Eye size={14} /></Link>}
                          {!n.read && <button className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }} onClick={() => markRead(n.id)}><CheckCheck size={14} /></button>}
                          <button className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--danger-500)' }} onClick={() => deleteNotification(n.id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}


