import { useState, useEffect, useRef, useCallback } from 'react'
import { Layout } from '../components/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Send, BadgeCheck, Smartphone, ChevronRight, CheckCheck } from 'lucide-react'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { motion } from 'framer-motion'

type ChatMessage = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function MarketplaceThread() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toasts, removeToast, showError } = useToast()

  const [listing, setListing] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [listingLoading, setListingLoading] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!id) return
    try {
      const data = await apiClient.marketplace.getMessages(id!)
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch (err) {
      console.error(err)
    }
  }, [id])

  const fetchListing = useCallback(async () => {
    try {
      setListingLoading(true)
      const data = await apiClient.marketplace.get(id!)
      setListing(data)
    } catch (err) {
      console.error(err)
    } finally {
      setListingLoading(false)
    }
  }, [id])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([fetchListing(), fetchMessages()])
    } catch (err) {
      console.error(err)
      showError('Error', 'Failed to load chat')
    } finally {
      setLoading(false)
    }
  }, [fetchListing, fetchMessages, showError])

  useEffect(() => {
    if (!id || !user) return
    fetchData()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [id, user, fetchData, fetchMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    try {
      setSending(true)
      await apiClient.marketplace.sendMessage(id!, input)
      setInput('')
      await fetchMessages()
    } catch (err: any) {
      showError('Failed to send', err.message)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const messageGroups = messages.reduce<{ date: string; messages: ChatMessage[] }[]>((groups, msg) => {
    const date = formatDate(msg.created_at)
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ date, messages: [msg] })
    }
    return groups
  }, [])

  if (loading && !listing) {
    return (
      <Layout requireAuth>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
          <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, width: i % 2 === 0 ? '60%' : '40%', alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start' }} />
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div style={{ maxWidth: 700, margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="modern-card"
          style={{
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 0, borderRadius: '16px 16px 0 0',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: 6 }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ position: 'relative' }}>
              <div
                className="avatar"
                style={{ width: 42, height: 42, fontSize: 16, background: 'var(--primary-500)' }}
              >
                {listing?.seller_name?.[0] || 'U'}
              </div>
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: 'var(--success-500)', border: '2px solid var(--bg-primary)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{listing?.seller_name || 'Seller'}</div>
              <div style={{ fontSize: 12, color: 'var(--success-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <BadgeCheck size={12} /> {listing?.seller_verified === 'verified' ? 'Verified Seller' : 'Online'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: 6 }}>
            <MoreVertical size={20} />
          </button>
        </motion.div>

        {/* Listing Context Banner */}
        {listing && (
          <div
            className="modern-card"
            style={{
              padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderRadius: 0,
              borderBottom: '1px solid var(--border-color)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => navigate(`/marketplace/listing/${id}`)}
          >
            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-tertiary)' }}>
              <img
                src={(Array.isArray(listing.images) && listing.images[0]) || 'https://via.placeholder.com/44'}
                onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/44' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt=""
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {listing.title || 'Device Listing'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--primary-600)', fontWeight: 600 }}>
                {listing.currency} {Number(listing.price || 0).toLocaleString()}
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}

        {/* Chat Messages */}
        <div
          style={{
            flex: 1, overflow: 'auto', padding: '16px 16px 0',
            background: 'var(--bg-secondary)',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', textAlign: 'center', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={28} style={{ opacity: 0.5 }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>Start a conversation</p>
                <p style={{ fontSize: 13, margin: 0 }}>Ask the seller about this item</p>
              </div>
            </div>
          ) : (
            messageGroups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: 12 }}>{group.date}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.messages.map((m, mi) => {
                    const isMe = m.sender_id === user?.id
                    const showAvatar = mi === group.messages.length - 1 || (group.messages[mi + 1]?.sender_id !== m.sender_id)
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mi * 0.05 }}
                        style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row' }}
                      >
                        {showAvatar && !isMe ? (
                          <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: 11, background: 'var(--gray-400)', marginBottom: 4, flexShrink: 0 }}>
                            {listing?.seller_name?.[0] || 'S'}
                          </div>
                        ) : (
                          <div style={{ width: 28, flexShrink: 0 }} />
                        )}
                        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <div
                            style={{
                              padding: '10px 16px',
                              borderRadius: 16,
                              background: isMe ? 'var(--primary-500)' : 'var(--bg-primary)',
                              color: isMe ? '#fff' : 'var(--text-primary)',
                              borderBottomRightRadius: isMe ? 4 : 16,
                              borderBottomLeftRadius: isMe ? 16 : 4,
                              boxShadow: 'var(--shadow-sm)',
                              lineHeight: 1.5,
                              fontSize: 14,
                              wordBreak: 'break-word',
                            }}
                          >
                            {m.content}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '0 4px' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatTime(m.created_at)}</span>
                            {isMe && <CheckCheck size={12} style={{ color: 'var(--primary-500)' }} />}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div
          className="modern-card"
          style={{
            padding: '12px 16px',
            borderRadius: '0 0 16px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            className="modern-input"
            style={{ borderRadius: 24, padding: '10px 18px', fontSize: 14, border: '2px solid var(--border-color)' }}
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            disabled={sending}
          />
          <button
            className="btn-gradient-primary"
            style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </Layout>
  )
}
