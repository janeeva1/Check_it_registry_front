import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, Smartphone, Mail, Key, CheckCircle, ArrowLeft, Loader2, Info, X, Send, User, RefreshCw } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'

type Device = { id: string; brand: string; model: string; imei: string; serial: string; status: string }
type Transfer = {
  id: string; device_id: string; from_user_id: string; to_user_id?: string; status: string
  created_at: string; completed_at: string | null; expires_at: string | null
  brand: string; model: string; category: string; imei: string; serial: string
  seller_name: string; seller_email: string; buyer_name: string; buyer_email: string
  otp_code: string | null
}

type Tab = 'initiate' | 'sent' | 'received' | 'receive'

export default function DeviceTransfer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toasts, removeToast, showSuccess, showError, showWarning: _showWarning, showInfo } = useToast()

  // A link like /transfer?code=ABC123 (from the transfer email) opens the Receive tab
  const [tab, setTab] = useState<Tab>(searchParams.get('code') || searchParams.get('tab') === 'receive' ? 'receive' : 'initiate')

  // Receive-a-device state
  const [receiveCode, setReceiveCode] = useState((searchParams.get('code') || '').toUpperCase())
  const [receiveStep, setReceiveStep] = useState<'code' | 'otp' | 'done'>('code')
  const [receiveOtp, setReceiveOtp] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [receivedDevice, setReceivedDevice] = useState<{ brand?: string; model?: string } | null>(null)

  const requestReceiveCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const code = receiveCode.trim().toUpperCase()
    if (!code) return
    setReceiving(true)
    try {
      const res: any = await apiClient.deviceTransfer.complete({ transferCode: code })
      if (res?.requiresBuyerOtp) {
        setReceiveStep('otp')
        showInfo('Check your email', 'We sent a 6-digit code to confirm you are receiving this device.')
      }
    } catch (err: any) {
      showError('Could not use this code', err.message || 'Check the code and try again')
    } finally {
      setReceiving(false)
    }
  }

  const confirmReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(receiveOtp.trim())) {
      showError('Enter the 6-digit code from your email')
      return
    }
    setReceiving(true)
    try {
      const res: any = await apiClient.deviceTransfer.complete({ transferCode: receiveCode.trim().toUpperCase(), otpCode: receiveOtp.trim() })
      setReceivedDevice(res?.device || null)
      setReceiveStep('done')
      showSuccess('Device received', 'The device is now registered to you')
      fetchTransfers()
    } catch (err: any) {
      showError('Could not complete the transfer', err.message || 'Please try again')
    } finally {
      setReceiving(false)
    }
  }
  const [devices, setDevices] = useState<Device[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [loadingTransfers, setLoadingTransfers] = useState(true)

  const [selectedDevice, setSelectedDevice] = useState(searchParams.get('device') || '')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generatedTransferId, setGeneratedTransferId] = useState('')
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const [verifyingTransfer, setVerifyingTransfer] = useState<string | null>(null)
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true)
      const data = await apiClient.devices.list()
      setDevices((data?.data || data || []).filter((d: any) => d.status === 'verified'))
    } catch { setDevices([]) } finally { setLoadingDevices(false) }
  }

  const fetchTransfers = async () => {
    try {
      setLoadingTransfers(true)
      const data = await apiClient.deviceTransfer.myTransfers({ type: 'all' })
      setTransfers(data?.transfers || [])
    } catch { setTransfers([]) } finally { setLoadingTransfers(false) }
  }

  useEffect(() => { fetchDevices(); fetchTransfers() }, [])

  const initiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDevice) { showError('Select a device'); return }
    if (!recipientEmail) { showError('Enter recipient email'); return }
    try {
      setSubmitting(true)
      const data = await apiClient.deviceTransfer.initiate({
        deviceId: selectedDevice,
        buyerEmail: recipientEmail,
        transferReason: 'Device sale',
      })
      if (data?.transferId) {
        setGeneratedTransferId(data.transferId)
        setShowOtpDialog(true)
        showInfo('Transfer initiated! Check your email for the verification code.')
        fetchTransfers()
      }
    } catch (err: any) { showError(err.message || 'Failed to initiate transfer') }
    finally { setSubmitting(false) }
  }

  const verifyOtp = async (transferId: string) => {
    const otp = otpInput.join('')
    if (otp.length !== 6) { showError('Enter the 6-digit OTP'); return }
    try {
      setSubmitting(true)
      await apiClient.deviceTransfer.verifyOtp({ transferId, otpCode: otp })
      showSuccess('Transfer verified and activated!')
      setVerifyingTransfer(null)
      setOtpInput(['', '', '', '', '', ''])
      fetchTransfers()
    } catch (err: any) { showError(err.message || 'Invalid OTP') }
    finally { setSubmitting(false) }
  }

  const cancelTransfer = async (id: string) => {
    try {
      await apiClient.deviceTransfer.cancel(id)
      showSuccess('Transfer cancelled')
      fetchTransfers()
    } catch { showError('Failed to cancel') }
  }

  const handleResendOtp = async (transferId: string, type: 'seller' | 'buyer') => {
    setResendLoading(true)
    try {
      if (type === 'seller') {
        await apiClient.deviceTransfer.resendSellerOtp(transferId)
        showSuccess('Verification code resent to your email')
      } else {
        await apiClient.deviceTransfer.resendCode(transferId)
        showSuccess('Transfer code resent to the buyer')
      }
      setResendCooldown(60)
    } catch (err: any) {
      showError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1]
    if (!/^\d*$/.test(val)) return
    const nc = [...otpInput]; nc[idx] = val; setOtpInput(nc)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
    if (nc.every(d => d !== '') && nc.join('').length === 6) {
      setTimeout(() => {
        const otp = nc.join('')
        if (verifyingTransfer) {
          apiClient.deviceTransfer.verifyOtp({ transferId: verifyingTransfer, otpCode: otp })
            .then(() => { showSuccess('Transfer verified and activated!'); setVerifyingTransfer(null); setOtpInput(['', '', '', '', '', '']); fetchTransfers() })
            .catch((err: any) => showError(err.message || 'Invalid OTP'))
        } else if (generatedTransferId) {
          apiClient.deviceTransfer.verifyOtp({ transferId: generatedTransferId, otpCode: otp })
            .then(() => { showSuccess('Transfer verified and activated!'); setShowOtpDialog(false); setOtpInput(['', '', '', '', '', '']); fetchTransfers() })
            .catch((err: any) => showError(err.message || 'Invalid OTP'))
        }
      }, 0)
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backward' || e.key === 'Backspace') {
      if (!otpInput[idx] && idx > 0) {
        const nc = [...otpInput]; nc[idx - 1] = ''; setOtpInput(nc); otpRefs.current[idx - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      const nc = [...otpInput]
      text.split('').forEach((ch, i) => { nc[i] = ch })
      setOtpInput(nc)
      otpRefs.current[5]?.focus()
      setTimeout(() => {
        if (verifyingTransfer) {
          apiClient.deviceTransfer.verifyOtp({ transferId: verifyingTransfer, otpCode: text })
            .then(() => { showSuccess('Transfer verified and activated!'); setVerifyingTransfer(null); setOtpInput(['', '', '', '', '', '']); fetchTransfers() })
            .catch((err: any) => showError(err.message || 'Invalid OTP'))
        } else if (generatedTransferId) {
          apiClient.deviceTransfer.verifyOtp({ transferId: generatedTransferId, otpCode: text })
            .then(() => { showSuccess('Transfer verified and activated!'); setShowOtpDialog(false); setOtpInput(['', '', '', '', '', '']); fetchTransfers() })
            .catch((err: any) => showError(err.message || 'Invalid OTP'))
        }
      }, 0)
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { initiated: 'status-pending', active: 'status-pending', awaiting_buyer_otp: 'status-pending', completed: 'status-verified', cancelled: 'status-stolen', expired: 'status-unverified', rejected: 'status-unverified' }
    const label = s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return <span className={`status-badge ${map[s] || ''}`}>{label}</span>
  }

  const sentTransfers = transfers.filter(t => t.from_user_id === user?.id)
  const receivedTransfers = transfers.filter(t => t.buyer_email === user?.email)

  const tabs = [
    { key: 'initiate' as Tab, label: 'Initiate', icon: ArrowLeftRight },
    { key: 'sent' as Tab, label: 'Sent', icon: Send, count: sentTransfers.length },
    { key: 'receive' as Tab, label: 'Receive a device', icon: Key },
    { key: 'received' as Tab, label: 'Received', icon: User, count: receivedTransfers.filter(t => ['active', 'awaiting_buyer_otp'].includes(t.status)).length },
  ]

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <ArrowLeftRight size={24} className="text-white" />
                </div>
                <div>
                  <h1>Device Transfer</h1>
                  <p>Transfer ownership of your devices</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mb-4 flex-wrap" role="tablist">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-3 border d-inline-flex align-items-center gap-2 ${tab === t.key ? 'border-primary' : ''}`}
              style={{ background: tab === t.key ? 'var(--primary-50)' : 'var(--gray-50)', cursor: 'pointer', transition: 'all 0.2s', fontSize: 14 }}>
              <t.icon size={18} />
              {t.label}
              {t.count !== undefined && t.count > 0 && <span className="status-badge status-pending" style={{ fontSize: 11, padding: '0 8px' }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'initiate' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <form onSubmit={initiateTransfer}>
                  <div className="modern-card p-4 p-md-5 mb-4">
                    <h5 className="mb-4 d-flex align-items-center gap-2"><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /> Select Device</h5>
                    <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
                    <div className="mb-3">
                      <label className="form-label">Device to Transfer *</label>
                      {loadingDevices ? (
                        <div className="modern-input d-flex align-items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Loader2 size={16} className="spinner-border" /> Loading devices...</div>
                      ) : (
                        <select className="modern-select" value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} required>
                          <option value="">Choose a device</option>
                          {devices.map(d => <option key={d.id} value={d.id}>{d.brand} {d.model} ({d.imei || d.serial || d.id.slice(0, 8)})</option>)}
                        </select>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Recipient Email *</label>
                      <div className="d-flex align-items-center gap-2 modern-input" style={{ padding: '0 12px' }}>
                        <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                        <input type="email" className="flex-grow-1" style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0' }} placeholder="recipient@example.com" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="d-flex align-items-start gap-2 p-3 rounded-3 mb-3" style={{ backgroundColor: 'var(--primary-50)' }}>
                      <Info size={18} style={{ color: 'var(--primary-600)' }} className="flex-shrink-0 mt-0.5" />
                      <p style={{ fontSize: 13, color: 'var(--primary-700)', margin: 0 }}>The recipient will need to verify their identity with a one-time passcode to complete the transfer.</p>
                    </div>
                    <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={submitting || !selectedDevice || !recipientEmail}>
                      {submitting ? <Loader2 size={20} className="spinner-border" /> : <ArrowLeftRight size={20} />}
                      {submitting ? 'Initiating...' : 'Initiate Transfer'}
                    </button>
                  </div>
                </form>

                {devices.length === 0 && !loadingDevices && (
                  <div className="modern-card p-4 text-center">
                    <div className="empty-state"><div className="empty-state-icon"><Smartphone size={48} /></div><h3>No Devices</h3><p>Register a device before initiating a transfer</p><Link to="/register-device" className="btn-gradient-primary mt-3">Register Device</Link></div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'receive' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="modern-card p-4 p-md-5">
                  {/* Progress: 1 enter code, 2 confirm with email code, 3 done */}
                  <ol className="d-flex gap-2 list-unstyled mb-4" aria-label="Progress" style={{ fontSize: 13 }}>
                    {['Enter transfer code', 'Confirm with email code', 'Done'].map((label, i) => {
                      const current = receiveStep === 'code' ? 0 : receiveStep === 'otp' ? 1 : 2
                      return (
                        <li key={label} className="flex-fill text-center" aria-current={i === current ? 'step' : undefined}>
                          <div style={{ height: 4, borderRadius: 2, background: i <= current ? 'var(--primary-600)' : 'var(--gray-200, #e5e7eb)', marginBottom: 6 }} />
                          <span style={{ color: i <= current ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{label}</span>
                        </li>
                      )
                    })}
                  </ol>

                  {receiveStep === 'code' && (
                    <form onSubmit={requestReceiveCode}>
                      <h5 className="mb-2 d-flex align-items-center gap-2"><Key size={20} style={{ color: 'var(--primary-600)' }} /> Receive a device</h5>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter the transfer code the seller shared with you. It is also in the email we sent you.</p>
                      <label className="form-label" htmlFor="transfer-code">Transfer code</label>
                      <input id="transfer-code" className="modern-input w-100 mb-3" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                        value={receiveCode} onChange={e => setReceiveCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                        placeholder="e.g. AB12CD34EF56" autoComplete="off" required />
                      <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={receiving || !receiveCode.trim()}>
                        {receiving ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
                        {receiving ? 'Checking...' : 'Continue'}
                      </button>
                    </form>
                  )}

                  {receiveStep === 'otp' && (
                    <form onSubmit={confirmReceive}>
                      <h5 className="mb-2">Confirm it's you</h5>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter the 6-digit code we just emailed to {user?.email || 'you'}.</p>
                      <label className="form-label" htmlFor="receive-otp">Email code</label>
                      <input id="receive-otp" className="modern-input w-100 mb-3" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }}
                        value={receiveOtp} onChange={e => setReceiveOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                      <button type="submit" className="btn-gradient-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3" disabled={receiving || receiveOtp.length !== 6}>
                        {receiving ? <Loader2 size={20} className="spin" /> : <CheckCircle size={20} />}
                        {receiving ? 'Completing...' : 'Complete transfer'}
                      </button>
                      <button type="button" className="btn-ghost w-100 mt-2" disabled={receiving} onClick={() => requestReceiveCode()}>Send a new code</button>
                    </form>
                  )}

                  {receiveStep === 'done' && (
                    <div className="text-center">
                      <CheckCircle size={48} style={{ color: 'var(--primary-600)' }} className="mb-3" />
                      <h5>Device received</h5>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {receivedDevice?.brand ? `${receivedDevice.brand} ${receivedDevice.model || ''} is` : 'The device is'} now registered to you.
                      </p>
                      <Link to="/my-devices" className="btn-gradient-primary">View my devices</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'sent' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {loadingTransfers ? (
              <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" /></div>
            ) : sentTransfers.length === 0 ? (
              <div className="modern-card p-5 text-center">
                <div className="empty-state"><div className="empty-state-icon"><Send size={48} /></div><h3>No Transfers Sent</h3><p>Initiate a transfer above</p></div>
              </div>
            ) : (
              <div className="row g-3">
                <AnimatePresence>
                  {sentTransfers.map((t, _i) => (
                    <motion.div key={t.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
                      <div className="modern-card p-3">
                        <div className="row g-3 align-items-center">
                          <div className="col-auto"><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /></div>
                          <div className="col">
                            <p className="fw-medium mb-1">{t.brand || 'Unknown'} {t.model || ''}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>To: {t.buyer_email || t.seller_email} &middot; {new Date(t.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="col-auto d-flex align-items-center gap-2">
                            {statusBadge(t.status)}
                            {['initiated', 'active', 'awaiting_buyer_otp'].includes(t.status) && (
                              <>
                                {t.status === 'awaiting_buyer_otp' && (
                                  <button className="btn-ghost btn-sm d-inline-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--primary-600)' }}
                                    onClick={() => handleResendOtp(t.id, 'buyer')}
                                    disabled={resendLoading || resendCooldown > 0}>
                                    {resendLoading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                                    {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend code'}
                                  </button>
                                )}
                                <button className="btn-ghost d-inline-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--danger-500)' }} onClick={() => cancelTransfer(t.id)}><X size={14} /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'received' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {loadingTransfers ? (
              <div className="modern-card p-5 text-center"><Loader2 size={32} className="spinner-border" /></div>
            ) : receivedTransfers.length === 0 ? (
              <div className="modern-card p-5 text-center">
                <div className="empty-state"><div className="empty-state-icon"><User size={48} /></div><h3>No Transfers Received</h3><p>When someone transfers a device to you, it will appear here</p></div>
              </div>
            ) : (
              <div className="row g-3">
                <AnimatePresence>
                  {receivedTransfers.map((t, _i) => (
                    <motion.div key={t.id} className="col-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
                      <div className="modern-card p-3">
                        <div className="row g-3 align-items-center">
                          <div className="col-auto"><Smartphone size={20} style={{ color: 'var(--primary-600)' }} /></div>
                          <div className="col">
                            <p className="fw-medium mb-1">{t.brand || 'Unknown'} {t.model || ''}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>From: {t.seller_name || t.seller_email || 'Unknown'} &middot; {new Date(t.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="col-auto d-flex align-items-center gap-2">
                            {statusBadge(t.status)}
                            {['active', 'awaiting_buyer_otp'].includes(t.status) && (
                              <button className="btn-gradient-primary btn-sm" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => { setReceiveStep('code'); setTab('receive') }}>Receive</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {showOtpDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="modern-card p-4 p-md-5" style={{ maxWidth: 480, width: '90%' }}>
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, background: 'var(--success-50)' }}>
                    <Mail size={28} style={{ color: 'var(--success-500)' }} />
                  </div>
                  <h4>Transfer Initiated</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>A verification code has been sent to your email. Enter it below to activate the transfer.</p>
                </div>
                <div className="d-flex justify-content-center gap-2 mb-4">
                  {otpInput.map((d, idx) => (
                    <input key={idx} ref={el => { otpRefs.current[idx] = el }} type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="modern-input text-center" style={{ width: 42, height: 48, fontSize: 20, fontWeight: 700, padding: 0 }} onPaste={handlePaste} />
                  ))}
                </div>
                <div className="d-flex justify-content-center mb-4">
                  <button type="button" onClick={() => generatedTransferId && handleResendOtp(generatedTransferId, 'seller')}
                    disabled={resendLoading || resendCooldown > 0}
                    className="btn btn-link text-decoration-none p-0"
                    style={{ color: 'var(--primary-500)', fontSize: 13 }}>
                    {resendLoading ? (
                      <>
                        <RefreshCw size={14} className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      `Resend code in ${resendCooldown}s`
                    ) : (
                      <>
                        <RefreshCw size={14} className="me-1" />
                        Resend code
                      </>
                    )}
                  </button>
                </div>
                <button className="btn-gradient-primary w-100 mb-2 d-flex align-items-center justify-content-center gap-2" disabled={submitting || otpInput.join('').length !== 6}
                  onClick={async () => {
                    if (!generatedTransferId) return
                    await verifyOtp(generatedTransferId)
                    setShowOtpDialog(false)
                  }}>
                  {submitting ? <Loader2 size={18} className="spinner-border" /> : <CheckCircle size={18} />}
                  {submitting ? 'Verifying...' : 'Verify & Activate'}
                </button>
                <button className="btn-ghost w-100" onClick={() => { setShowOtpDialog(false); setTab('sent') }}>
                  Do this later
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
