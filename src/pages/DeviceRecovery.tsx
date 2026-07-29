import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { useToast, ToastContainer } from '../components/Toast'
import { PaymentGate } from '../components/PaymentGate'
import { MFAChallenge } from '../components/MFAChallenge'
import { Shield, Loader2, CheckCircle, AlertTriangle, Smartphone, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface RecoverableDevice {
  id: string
  brand: string
  model: string
  imei?: string
  status: string
  case_id?: string
  reported_at?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DeviceRecovery() {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning: _showWarning, toasts, removeToast } = useToast()
  const [devices, setDevices] = useState<RecoverableDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<RecoverableDevice | null>(null)
  const [step, setStep] = useState<'list' | 'confirm' | 'processing' | 'success'>('list')
  const [showPayment, setShowPayment] = useState(false)
  const [showMfa, setShowMfa] = useState(false)
  const [_mfaToken, setMfaToken] = useState<string | null>(null)
  const [bypassToken, setBypassToken] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadRecoverableDevices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecoverableDevices = async () => {
    setLoading(true)
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
      const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/device-management?status=stolen,lost`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const json = await res.json()
      const list = Array.isArray(json) ? json : json?.data || json?.devices || []
      setDevices(list.filter((d: any) => d.status === 'stolen' || d.status === 'lost'))
    } catch {
      showError('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRecovery = (device: RecoverableDevice) => {
    setSelectedDevice(device)
    setStep('confirm')
  }

  const handlePaySuccess = (token: string) => {
    setBypassToken(token)
    setShowPayment(false)
    proceedRecovery()
  }

  const handleMfaSuccess = (token: string) => {
    setMfaToken(token)
    setShowMfa(false)
    proceedRecovery(token)
  }

  const proceedRecovery = async (mfa?: string) => {
    if (!selectedDevice) return
    setProcessing(true)
    try {
      const payload: any = {
        deviceId: selectedDevice.id,
        servicePackage: 'standard',
        bypass_payment: !!bypassToken,
      }
      if (mfa) payload.mfaToken = mfa
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/recovery-services/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.requiresPayment || err.error?.includes('fee') || err.error?.includes('payment')) {
          setShowPayment(true)
          return
        }
        if (err.requiresMfa || err.error?.includes('MFA')) {
          setShowMfa(true)
          return
        }
        throw new Error(err.error || 'Recovery request failed')
      }
      setStep('success')
      showSuccess('Recovey Request Submitted', 'Your device recovery request has been initiated')
    } catch (e: any) {
      showError(e.message || 'Failed to submit recovery request')
    } finally {
      setProcessing(false)
    }
  }

  const handleStartProceed = () => {
    setShowMfa(true)
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <Loader2 size={32} className="spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid px-0">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="page-header">
            <div className="d-flex align-items-center gap-3">
              <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
              </button>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#fff" />
              </div>
              <div>
                <h1>Device Recovery</h1>
                <p>Recover your reported stolen or lost device</p>
              </div>
            </div>
          </motion.div>

          {step === 'success' ? (
            <motion.div variants={itemVariants} className="modern-card p-5 text-center" style={{ maxWidth: 480, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={48} style={{ color: 'var(--success)' }} />
              </div>
              <h3>Recovery Initiated</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your recovery request for {selectedDevice?.brand} {selectedDevice?.model} has been submitted.
                You will be contacted with next steps.
              </p>
              <button onClick={() => { setStep('list'); setSelectedDevice(null); loadRecoverableDevices() }} className="btn-gradient-primary mt-3">
                Done
              </button>
            </motion.div>
          ) : step === 'confirm' && selectedDevice ? (
            <motion.div variants={itemVariants} className="modern-card p-4" style={{ maxWidth: 480, margin: '0 auto' }}>
              <div className="text-center mb-4">
                <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <AlertTriangle size={28} style={{ color: 'var(--warning-500)' }} />
                </div>
                <h3>Recover Device</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  You are about to request recovery of your reported device
                </p>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Device</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{selectedDevice.brand} {selectedDevice.model}</span>
                </div>
                {selectedDevice.imei && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>IMEI</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{selectedDevice.imei}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Status</span>
                  <span style={{ fontWeight: 500, color: 'var(--danger-500)', textTransform: 'capitalize' }}>{selectedDevice.status}</span>
                </div>
                {selectedDevice.reported_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Reported</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(selectedDevice.reported_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="d-flex gap-3">
                <button onClick={() => { setStep('list'); setSelectedDevice(null) }} className="btn-ghost flex-grow-1">Cancel</button>
                <button onClick={handleStartProceed} disabled={processing} className="btn-gradient-primary flex-grow-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {processing ? <Loader2 size={16} className="spin" /> : <Shield size={16} />}
                  {processing ? 'Processing...' : 'Start Recovery'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              {devices.length === 0 ? (
                <div className="modern-card p-5 text-center">
                  <Smartphone size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                  <h5 style={{ color: 'var(--text-primary)' }}>No Recoverable Devices</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    You don't have any devices currently reported as stolen or lost
                  </p>
                </div>
              ) : (
                <div className="row g-4">
                  {devices.map(device => (
                    <div key={device.id} className="col-md-6 col-lg-4">
                      <div className="modern-card p-4">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Smartphone size={22} style={{ color: 'var(--danger-500)' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{device.brand} {device.model}</div>
                            {device.imei && <small style={{ color: 'var(--text-tertiary)' }}>IMEI: {device.imei}</small>}
                          </div>
                        </div>
                        <span className={`badge ${device.status === 'stolen' ? 'bg-danger' : 'bg-warning text-dark'} mb-3`} style={{ textTransform: 'capitalize' }}>
                          {device.status}
                        </span>
                        <button onClick={() => handleStartRecovery(device)} className="btn-gradient-primary w-100">
                          <Shield size={16} /> Request Recovery
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
      <PaymentGate
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        feeType="device_recovery_fee"
        feeLabel="Device Recovery"
        description="Fee for device recovery service"
        onSuccess={handlePaySuccess}
      />
      <MFAChallenge
        isOpen={showMfa}
        onClose={() => setShowMfa(false)}
        actionType="device_recovery"
        actionLabel="Device Recovery"
        onSuccess={handleMfaSuccess}
        requiresDualOtp
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
