import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import {
  MessageSquare, Send, Paperclip, Shield, Search,
  CheckCircle, FileText, Plus,
  Building, Lock
} from 'lucide-react'

type Thread = { id: string; agency: string; unread: number; last: string; status?: string }
type Message = { id: string; threadId: string; from: 'lea' | 'me'; text: string; time: string }

const threadsData: Thread[] = [
  { id: 'T-001', agency: 'Lagos State Police', unread: 2, last: '2025-05-02T10:24:00Z', status: 'active' },
  { id: 'T-002', agency: 'Abuja FCT Police', unread: 0, last: '2025-05-01T14:12:00Z', status: 'active' },
  { id: 'T-003', agency: 'Interpol Nigeria', unread: 1, last: '2025-04-28T09:00:00Z', status: 'active' },
  { id: 'T-004', agency: 'Rivers State Command', unread: 0, last: '2025-04-25T11:30:00Z', status: 'pending' },
]

const initialMessages: Message[] = [
  { id: 'M-1', threadId: 'T-001', from: 'lea', text: 'We received your device verification request. Please find the attached preliminary report.', time: '2025-05-02T10:10:00Z' },
  { id: 'M-2', threadId: 'T-001', from: 'me', text: 'Thank you. Do you need additional documentation from the complainant?', time: '2025-05-02T10:20:00Z' },
  { id: 'M-3', threadId: 'T-001', from: 'lea', text: 'Yes, please upload proof of purchase and a government-issued ID for verification purposes.', time: '2025-05-02T10:24:00Z' },
  { id: 'M-4', threadId: 'T-002', from: 'lea', text: 'Your incident report #IR-2025-0842 has been acknowledged and assigned to Officer Adebayo.', time: '2025-05-01T14:12:00Z' },
  { id: 'M-5', threadId: 'T-003', from: 'lea', text: 'Global registry check is ongoing. Current status: matching IMEI against international database. ETA: 48 hours.', time: '2025-04-28T09:00:00Z' },
  { id: 'M-6', threadId: 'T-003', from: 'me', text: 'Requesting priority processing. This involves a high-value asset.', time: '2025-04-28T10:15:00Z' },
]

export default function LEACommunication() {
  const threads = useMemo(() => threadsData, [])
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [activeId, setActiveId] = useState('T-001')
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeThread = threads.find(t => t.id === activeId)
  const activeMessages = messages.filter(m => m.threadId === activeId)

  const filteredThreads = threads.filter(t =>
    t.agency.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  const send = () => {
    if (!draft.trim()) return
    const msg: Message = {
      id: `M-${Date.now()}`,
      threadId: activeId,
      from: 'me',
      text: draft.trim(),
      time: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    setDraft('')
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
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Layout requireAuth allowedRoles={['lea']}>
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
                  <input className="form-control form-control-sm" placeholder="Search agencies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                      {t.agency.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold small text-truncate">{t.agency}</span>
                        <small className="text-muted text-nowrap ms-2">{formatTime(t.last)}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted text-truncate">
                          {messages.filter(m => m.threadId === t.id).slice(-1)[0]?.text?.slice(0, 30) || 'No messages'}
                        </small>
                        {t.unread > 0 && (
                          <span className="badge rounded-pill" style={{ background: 'var(--danger-500)' }}>{t.unread}</span>
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
                <button className="btn-ghost w-100 d-flex align-items-center justify-content-center gap-2">
                  <Plus size={16} /> New Conversation
                </button>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8 col-xl-9">
            <div className="modern-card d-flex flex-column h-100">
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                <div>
                  <strong className="d-flex align-items-center gap-2">
                    {activeThread?.agency}
                    <span className={`status-badge ${activeThread?.status === 'active' ? 'status-active' : 'status-pending'}`}>
                      {activeThread?.status || 'active'}
                    </span>
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
                {activeMessages.length === 0 ? (
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
                        className={`d-flex ${m.from === 'me' ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div
                          className="p-3"
                          style={{
                            maxWidth: '75%',
                            borderRadius: 16,
                            background: m.from === 'me' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' : 'var(--bg-primary)',
                            color: m.from === 'me' ? 'white' : 'var(--text-primary)',
                            boxShadow: 'var(--shadow-sm)',
                            border: m.from === 'me' ? 'none' : '1px solid var(--border-color)'
                          }}
                        >
                          <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                          <div className={`d-flex align-items-center gap-1 mt-2 ${m.from === 'me' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <small style={{ opacity: 0.7, fontSize: 11 }}>{formatTime(m.time)}</small>
                            {m.from === 'me' && <CheckCircle size={10} style={{ opacity: 0.7 }} />}
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
                    />
                  </div>
                  <button
                    className="btn-gradient-primary"
                    onClick={send}
                    disabled={!draft.trim()}
                    style={{ opacity: draft.trim() ? 1 : 0.5 }}
                  >
                    <Send size={18} />
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
      </motion.div>
    </Layout>
  )
}
