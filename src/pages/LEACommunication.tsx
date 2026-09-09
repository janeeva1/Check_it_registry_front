import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'
import {
  MessageSquare, Send, Paperclip, Shield, Search,
  CheckCircle, FileText, Plus,
  Building, Lock, RefreshCw
} from 'lucide-react'

type Thread = {
  id: string
  subject: string
  status: string
  createdAt: string
  updatedAt: string
  lastMessage?: { content: string; createdAt: string; senderId: string } | null
  unreadCount: number
  participants: { id: string; userId: string; role: string; name: string }[]
}
type Message = { id: string; threadId: string; senderId: string; content: string; createdAt: string; senderName?: string }

export default function LEACommunication() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toasts, removeToast, showError } = useToast()

  useEffect(() => { loadThreads() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  const loadThreads = async () => {
    try {
      setLoading(true)
      const data: any = await apiClient.leaPortal.getThreads()
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setThreads(rows)
      if (rows.length > 0 && !activeId) setActiveId(rows[0].id)
    } catch (err: any) {
      showError('Load Failed', err?.message || 'Could not load conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      setLoadingMessages(true)
      const data: any = await apiClient.leaPortal.getThreadMessages(threadId)
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setMessages(rows.map((r: any) => ({
        id: r.id,
        threadId: r.threadId || r.thread_id,
        senderId: r.senderId || r.sender_id,
        content: r.content,
        createdAt: r.createdAt || r.created_at,
        senderName: r.senderName || '',
      })))
    } catch (err: any) {
      showError('Load Failed', err?.message || 'Could not load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const activeThread = threads.find(t => t.id === activeId)
  const activeMessages = messages.filter(m => m.threadId === activeId)

  const filteredThreads = useMemo(() => {
    return threads.filter(t =>
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [threads, searchTerm])

  const send = async () => {
    if (!draft.trim() || !activeId) return
    setSending(true)
    try {
      const result: any = await apiClient.leaPortal.sendThreadMessage(activeId, draft.trim())
      const newMsg: Message = {
        id: result?.id || `temp-${Date.now()}`,
        threadId: activeId,
        senderId: 'me',
        content: draft.trim(),
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, newMsg])
      setDraft('')
    } catch (err: any) {
      showError('Send Failed', err?.message || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  const formatTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getThreadPreview = (t: Thread) => {
    return t.lastMessage?.content?.slice(0, 40) || 'No messages'
  }

  const getThreadAgency = (t: Thread) => {
    if (t.participants.length > 0) return t.participants.map(p => p.name).join(', ')
    return t.subject || 'Conversation'
  }

  return (
    <Layout requireAuth allowedRoles={['lea']}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <motion.div className="container-fluid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={childVariants} className="page-header">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={24} color="white" />
            </div>
            <div>
              <h1>Secure Communications</h1>
              <p>End-to-end encrypted messaging with law enforcement agencies</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <div className="text-center">
              <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading conversations...</p>
            </div>
          </div>
        ) : (
          <motion.div variants={childVariants} className="row g-3" style={{ minHeight: 'calc(100vh - 280px)' }}>
            <div className="col-12 col-lg-4 col-xl-3">
              <div className="modern-card d-flex flex-column h-100">
                <div className="p-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <strong className="d-flex align-items-center gap-2"><Building size={16} /> Conversations</strong>
                    <span className="status-badge status-active">{threads.length}</span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text"><Search size={14} /></span>
                    <input className="form-control form-control-sm" placeholder="Search conversations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="list-group list-group-flush flex-grow-1" style={{ overflow: 'auto' }}>
                  {filteredThreads.map(t => (
                    <button
                      key={t.id}
                      className={`list-group-item list-group-item-action border-0 d-flex align-items-center gap-3 p-3 ${activeId === t.id ? 'active' : ''}`}
                      onClick={() => setActiveId(t.id)}
                      style={{ borderRadius: 0, borderBottom: '1px solid var(--border-color) !important' }}
                    >
                      <div className="avatar" style={{ background: activeId === t.id ? 'rgba(255,255,255,0.2)' : 'var(--primary-100)', color: activeId === t.id ? 'white' : 'var(--primary-600)', width: 42, height: 42, fontSize: 14 }}>
                        {getThreadAgency(t).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold small text-truncate">{t.subject}</span>
                          <small className="text-muted text-nowrap ms-2">{t.updatedAt ? formatTime(t.updatedAt) : ''}</small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted text-truncate">{getThreadPreview(t)}</small>
                          {t.unreadCount > 0 && (
                            <span className="badge rounded-pill" style={{ background: 'var(--danger-500)' }}>{t.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredThreads.length === 0 && (
                    <div className="p-4 text-center text-muted small">No conversations found</div>
                  )}
                </div>
                <div className="p-3 border-top">
                  <button className="btn-ghost w-100 d-flex align-items-center justify-content-center gap-2" onClick={loadThreads}>
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-8 col-xl-9">
              <div className="modern-card d-flex flex-column h-100">
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                  <div>
                    <strong className="d-flex align-items-center gap-2">
                      {activeThread?.subject || 'Select a conversation'}
                      {activeThread && (
                        <span className={`status-badge ${activeThread.status === 'active' ? 'status-active' : 'status-pending'}`}>
                          {activeThread.status}
                        </span>
                      )}
                    </strong>
                    <div className="text-muted small d-flex align-items-center gap-2 mt-1">
                      <Lock size={12} /> Secure channel &bull; End-to-end encrypted
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn-ghost"><FileText size={16} /></button>
                    <button className="btn-ghost"><Shield size={16} /></button>
                  </div>
                </div>

                <div className="flex-grow-1 p-3" style={{ overflow: 'auto', background: 'var(--bg-tertiary)' }}>
                  {!activeId ? (
                    <div className="empty-state">
                      <div className="empty-state-icon"><MessageSquare size={32} /></div>
                      <h3>Select a conversation</h3>
                      <p>Choose a conversation from the list to view messages.</p>
                    </div>
                  ) : loadingMessages ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                      <div className="spinner-border" style={{ color: 'var(--primary-600)' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon"><MessageSquare size={32} /></div>
                      <h3>No messages yet</h3>
                      <p>Start the conversation by sending a message below.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {activeMessages.map(m => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`d-flex ${m.senderId === 'me' ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          <div
                            className="p-3"
                            style={{
                              maxWidth: '75%',
                              borderRadius: 16,
                              background: m.senderId === 'me' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' : 'var(--bg-primary)',
                              color: m.senderId === 'me' ? 'white' : 'var(--text-primary)',
                              boxShadow: 'var(--shadow-sm)',
                              border: m.senderId === 'me' ? 'none' : '1px solid var(--border-color)'
                            }}
                          >
                            {m.senderId !== 'me' && m.senderName && (
                              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--primary-600)' }}>{m.senderName}</div>
                            )}
                            <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                            <div className={`d-flex align-items-center gap-1 mt-2 ${m.senderId === 'me' ? 'justify-content-end' : 'justify-content-start'}`}>
                              <small style={{ opacity: 0.7, fontSize: 11 }}>{formatTime(m.createdAt)}</small>
                              {m.senderId === 'me' && <CheckCircle size={10} style={{ opacity: 0.7 }} />}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-3 border-top">
                  <div className="d-flex gap-2">
                    <button className="btn-ghost"><Paperclip size={18} /></button>
                    <div className="flex-grow-1">
                      <input
                        className="modern-input"
                        placeholder="Type your secure message..."
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!activeId || sending}
                      />
                    </div>
                    <button
                      className="btn-gradient-primary"
                      onClick={send}
                      disabled={!draft.trim() || !activeId || sending}
                      style={{ opacity: draft.trim() && activeId ? 1 : 0.5 }}
                    >
                      {sending ? <RefreshCw size={18} className="spinner" /> : <Send size={18} />}
                    </button>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn-ghost" style={{ fontSize: 12 }}>
                      <Paperclip size={12} /> Attach File
                    </button>
                    <button className="btn-ghost" style={{ fontSize: 12 }}>
                      <FileText size={12} /> Request Evidence
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  )
}
