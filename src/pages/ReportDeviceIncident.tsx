import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Info,
  Smartphone,
  MapPin,
  Send,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Shield,
  Fingerprint,
  Clock,
  Hash,
  FileText,
  Eye,
  CircleDot,
  Ban,
  HelpCircle,
  Link as LinkIcon,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { PaymentGate } from '../components/PaymentGate'
import { apiClient } from '../lib/apiClient'
import { useNavigate, useSearchParams } from 'react-router-dom'

type WizardStep = 'device' | 'details' | 'kyc_payment' | 'confirmation'
type ReportType = 'stolen' | 'lost'

interface RegisteredDevice {
  id: string
  brand: string
  model: string
  imei: string
  serial_number?: string
  category?: string
  status: string
  verified_at?: string
  registration_date?: string
}

interface ReportForm {
  description: string
  location: string
  occurred_at: string
  police_report_number: string
  circumstances: string
  witness_info: string
  evidence_url: string
}

interface SubmitResponse {
  case_id?: string
  report_number?: number
  status?: string
  message?: string
  requiresPayment?: boolean
  amount?: number
  currency?: string
  invoiceId?: string
  reference?: string
  reportNumber?: number
  kycRequired?: boolean
  requiresNin?: boolean
  kycFailed?: boolean
  error?: string
}

function maskImei(imei: string): string {
  if (!imei || imei.length < 4) return imei || 'N/A'
  return '****' + imei.slice(-4)
}

const REPORT_TYPES: { value: ReportType; label: string; description: string; icon: typeof Ban }[] = [
  { value: 'stolen', label: 'Stolen', description: 'Device was taken without your consent', icon: Ban },
  { value: 'lost', label: 'Lost', description: 'Device is missing and you cannot locate it', icon: HelpCircle },
]

export default function ReportDeviceIncident() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast()

  const [step, setStep] = useState<WizardStep>('device')
  const [devices, setDevices] = useState<RegisteredDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [devicesError, setDevicesError] = useState<string | null>(null)

  const [selectedDevice, setSelectedDevice] = useState<RegisteredDevice | null>(null)
  const [searchParams] = useSearchParams()
  const [reportType, setReportType] = useState<ReportType | null>(null)

  const [form, setForm] = useState<ReportForm>({
    description: '',
    location: '',
    occurred_at: '',
    police_report_number: '',
    circumstances: '',
    witness_info: '',
    evidence_url: '',
  })

  const [submitting, setSubmitting] = useState(false)
  // Every report: pay the report fee, then confirm identity. A payment is
  // kept (also across a page reload) until a report is actually filed.
  const PAID_KEY = 'po_report_payment'
  const [paidRef, setPaidRef] = useState<string>(() => { try { return sessionStorage.getItem(PAID_KEY) || '' } catch { return '' } })
  const [idError, setIdError] = useState('')
  const [useRc, setUseRc] = useState(false)
  const [rcInput, setRcInput] = useState('')
  const isBusiness = user?.role === 'business'
  const rememberPaid = (ref: string) => { setPaidRef(ref); try { ref ? sessionStorage.setItem(PAID_KEY, ref) : sessionStorage.removeItem(PAID_KEY) } catch { /* storage blocked */ } }

  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null)
  const [paymentCurrency, setPaymentCurrency] = useState('NGN')
  const [reportNumber, setReportNumber] = useState<number | null>(null)

  const [ninInput, setNinInput] = useState('')

  const [confirmationData, setConfirmationData] = useState<{
    case_id: string
    report_number: number
    status: string
    message: string
  } | null>(null)

  useEffect(() => {
    loadDevices()
  }, [])

  // The report fee (set by the admin); 0 means no payment step
  useEffect(() => {
    if (step !== 'kyc_payment') return
    apiClient.revenue.getFee('report_verification_fee')
      .then((d: any) => { setPaymentAmount(Number(d?.amount) || 0); setPaymentCurrency(d?.currency || 'NGN') })
      .catch(() => setPaymentAmount(null))
  }, [step])

  const loadDevices = async () => {
    try {
      setDevicesLoading(true)
      setDevicesError(null)
      const data = await apiClient.reportManagement.myDevices()
      const list = Array.isArray(data) ? data : data?.devices || data?.data || []
      setDevices(list)
      // Coming from an item page (?device=...): skip straight to the details
      const pre = searchParams.get('device')
      const match = pre && list.find((d: RegisteredDevice) => d.id === pre)
      if (match) { setSelectedDevice(match); setStep('details') }
    } catch (err: any) {
      setDevicesError(err.message || 'Failed to load devices')
    } finally {
      setDevicesLoading(false)
    }
  }

  const handleDeviceSelect = (device: RegisteredDevice) => {
    setSelectedDevice(device)
    setStep('details')
  }

  const handleReportTypeSelect = (type: ReportType) => {
    setReportType(type)
  }

  const canProceedFromDetails = (): boolean => {
    return !!(
      reportType &&
      form.description.trim() &&
      form.location.trim() &&
      form.occurred_at
    )
  }

  const needsPayment = (paymentAmount ?? 0) > 0
  const idReady = useRc ? rcInput.trim().length >= 5 : ninInput.trim().length === 11
  const canSubmit = !submitting && idReady && (!needsPayment || !!paidRef)

  const handleSubmitReport = async () => {
    if (!selectedDevice || !reportType) return
    setIdError('')
    try {
      setSubmitting(true)
      const body: any = {
        device_id: selectedDevice.id,
        report_type: reportType,
        description: form.description.trim(),
        location: form.location.trim(),
        occurred_at: new Date(form.occurred_at).toISOString(),
        police_report_number: form.police_report_number.trim() || undefined,
        circumstances: form.circumstances.trim() || undefined,
        witness_info: form.witness_info.trim() || undefined,
        evidence_url: form.evidence_url.trim() || undefined,
      }
      if (useRc) body.rc_number = rcInput.trim()
      else body.nin = ninInput.trim()
      if (paidRef) body.pay_by_pass = paidRef

      const response: SubmitResponse = await apiClient.reportManagement.create(body)
      if (response.requiresPayment) {
        // Not paid yet, or that payment was already used for another report
        rememberPaid('')
        if (response.amount) setPaymentAmount(response.amount)
        setShowPayment(true)
        return
      }
      rememberPaid('') // the payment went to this report
      setNinInput(''); setRcInput('')
      setConfirmationData({
        case_id: response.case_id || 'N/A',
        report_number: response.report_number || reportNumber || 0,
        status: response.status || 'pending_review',
        message: response.message || 'Your incident report has been submitted successfully.',
      })
      setReportNumber(response.report_number || reportNumber)
      setStep('confirmation')
      showSuccess('Report submitted')
    } catch (err: any) {
      const d = err?.data || {}
      if (d.requiresPayment) { rememberPaid(''); setShowPayment(true); return }
      if (d.identityFailed || d.requiresNin) { setIdError(d.error || err.message); return }
      showError(err.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = (token: string) => {
    setShowPayment(false)
    rememberPaid(token)
    showSuccess('Payment received. Now confirm your identity and submit.')
  }

  const formatDateTime = (dt: string): string => {
    try {
      return new Date(dt).toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return dt
    }
  }

  const stepLabels = ['Select item', 'What happened', 'Pay & confirm', 'Done']

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <button className="btn-ghost d-inline-flex align-items-center gap-2" onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} /> Back
                </button>
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--danger-500), var(--danger-700))' }}
                >
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <h1>Report an Incident</h1>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Report a stolen or lost device</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Step Indicator */}
            {step !== 'confirmation' && (
              <div className="modern-card p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between" style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 40,
                      right: 40,
                      height: 3,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 2,
                      zIndex: 0,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 40,
                      width: step === 'device' ? '0%' : step === 'details' ? '33%' : step === 'kyc_payment' ? '66%' : '100%',
                      height: 3,
                      background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                      borderRadius: 2,
                      zIndex: 1,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                  {stepLabels.slice(0, 3).map((label, i) => {
                    const stepKeys: WizardStep[] = ['device', 'details', 'kyc_payment']
                    const isActive = step === stepKeys[i]
                    const isCompleted = stepKeys.indexOf(step) > i
                    return (
                      <div key={label} className="text-center" style={{ zIndex: 2, flex: 1 }}>
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: 32,
                            height: 32,
                            background: isCompleted
                              ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))'
                              : isActive
                              ? 'var(--primary-500)'
                              : 'var(--bg-tertiary)',
                            color: isCompleted || isActive ? '#fff' : 'var(--text-tertiary)',
                            fontSize: 13,
                            fontWeight: 700,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {isCompleted ? <CheckCircle size={16} /> : i + 1}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isActive || isCompleted ? 'var(--primary-600)' : 'var(--text-tertiary)', marginTop: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                          {label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ===== STEP 1: SELECT DEVICE ===== */}
              {step === 'device' && (
                <motion.div
                  key="step-device"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="modern-card p-4 p-md-5">
                    <h4 className="mb-2 d-flex align-items-center gap-2">
                      <Smartphone size={22} style={{ color: 'var(--primary-600)' }} />
                      Select a Device
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                      Choose the verified device you want to report
                    </p>

                    {devicesLoading && (
                      <div className="text-center py-5">
                        <Loader2 size={36} className="spinner-border mb-3" style={{ color: 'var(--primary-500)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Loading your devices...</p>
                      </div>
                    )}

                    {!devicesLoading && devicesError && (
                      <div className="text-center py-5">
                        <AlertTriangle size={40} style={{ color: 'var(--danger-500)' }} className="mb-3" />
                        <p style={{ color: 'var(--danger-600)', fontWeight: 600 }}>Failed to load devices</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{devicesError}</p>
                        <button className="btn-gradient-primary mt-3" onClick={loadDevices}>
                          Retry
                        </button>
                      </div>
                    )}

                    {!devicesLoading && !devicesError && devices.length === 0 && (
                      <div className="text-center py-5">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: 80, height: 80, background: 'var(--warning-50)' }}
                        >
                          <Smartphone size={40} style={{ color: 'var(--warning-500)' }} />
                        </div>
                        <h5 style={{ color: 'var(--text-primary)' }}>No Verified Devices</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 400, margin: '8px auto 20px' }}>
                          You have no verified devices. Please register and verify a device first before reporting an incident.
                        </p>
                        <button className="btn-gradient-primary" onClick={() => navigate('/register-device')}>
                          Register a Device
                        </button>
                      </div>
                    )}

                    {!devicesLoading && !devicesError && devices.length > 0 && (
                      <div className="row g-3">
                        {devices.map((device) => (
                          <div className="col-12 col-md-6" key={device.id}>
                            <button
                              type="button"
                              onClick={() => handleDeviceSelect(device)}
                              className="w-100 text-start p-4 rounded-3 border"
                              style={{
                                background: selectedDevice?.id === device.id ? 'var(--primary-50)' : 'var(--bg-primary)',
                                borderColor: selectedDevice?.id === device.id ? 'var(--primary-500)' : 'var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-400)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = selectedDevice?.id === device.id ? 'var(--primary-500)' : 'var(--border-color)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <div
                                  className="d-flex align-items-center justify-content-center rounded-3"
                                  style={{ width: 40, height: 40, background: 'var(--primary-50)' }}
                                >
                                  <Smartphone size={20} style={{ color: 'var(--primary-600)' }} />
                                </div>
                                <div>
                                  <p className="fw-semibold mb-0" style={{ fontSize: 15 }}>
                                    {device.brand} {device.model}
                                  </p>
                                  <p className="mb-0" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                    {device.category || 'Device'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2 mt-2" style={{ fontSize: 13 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  IMEI: <span style={{ fontFamily: 'var(--font-mono)' }}>{maskImei(device.imei)}</span>
                                </span>
                              </div>
                              {device.verified_at && (
                                <div className="d-flex align-items-center gap-1 mt-2" style={{ fontSize: 12, color: 'var(--success-600)' }}>
                                  <CheckCircle size={13} />
                                  Verified {formatDateTime(device.verified_at)}
                                </div>
                              )}
                              <div className="d-flex justify-content-end mt-2">
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--primary-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  Select <ArrowRight size={13} />
                                </span>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 2: INCIDENT DETAILS ===== */}
              {step === 'details' && selectedDevice && (
                <motion.div
                  key="step-details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Selected Device Card (Read-only) */}
                  <div className="modern-card p-4 mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-3"
                          style={{ width: 44, height: 44, background: 'var(--primary-50)' }}
                        >
                          <Smartphone size={22} style={{ color: 'var(--primary-600)' }} />
                        </div>
                        <div>
                          <p className="fw-bold mb-0">
                            {selectedDevice.brand} {selectedDevice.model}
                          </p>
                          <p className="mb-0" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            IMEI: <span style={{ fontFamily: 'var(--font-mono)' }}>{maskImei(selectedDevice.imei)}</span>
                            {selectedDevice.category && <span style={{ marginLeft: 12 }}>{selectedDevice.category}</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          setSelectedDevice(null)
                          setStep('device')
                        }}
                        style={{ fontSize: 13 }}
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Report Type Selection */}
                  <div className="modern-card p-4 p-md-5 mb-3">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <AlertTriangle size={18} style={{ color: 'var(--danger-500)' }} />
                      Report Type
                    </h5>
                    <div className="row g-3">
                      {REPORT_TYPES.map((rt) => {
                        const IconComp = rt.icon
                        const isSelected = reportType === rt.value
                        return (
                          <div className="col-12 col-md-6" key={rt.value}>
                            <button
                              type="button"
                              onClick={() => handleReportTypeSelect(rt.value)}
                              className="w-100 text-start p-4 rounded-3 border d-flex align-items-start gap-3"
                              style={{
                                background: isSelected ? 'var(--primary-50)' : 'var(--bg-primary)',
                                borderColor: isSelected ? 'var(--primary-500)' : 'var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              <div
                                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                style={{
                                  width: 40,
                                  height: 40,
                                  background: isSelected ? 'var(--primary-500)' : 'var(--bg-tertiary)',
                                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                                }}
                              >
                                <IconComp size={20} />
                              </div>
                              <div>
                                <p className="fw-semibold mb-1">{rt.label}</p>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                                  {rt.description}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="ms-auto flex-shrink-0">
                                  <CheckCircle size={20} style={{ color: 'var(--primary-500)' }} />
                                </div>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Incident Form */}
                  <div className="modern-card p-4 p-md-5 mb-3">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <FileText size={18} style={{ color: 'var(--primary-600)' }} />
                      Incident Information
                    </h5>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                      <span style={{ color: 'red' }}>*</span> Required fields
                    </div>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">
                          What happened? <span style={{ color: 'red' }}>*</span>
                        </label>
                        <textarea
                          className="modern-textarea"
                          rows={4}
                          placeholder="Provide a detailed description of the incident..."
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Location <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <textarea
                            className="modern-textarea"
                            rows={2}
                            placeholder="Where did this happen? (e.g., address, city, area)"
                            value={form.location}
                            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          When did it occur? <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="datetime-local"
                          className="modern-input"
                          value={form.occurred_at}
                          onChange={(e) => setForm((p) => ({ ...p, occurred_at: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          Police Report # <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <input
                          className="modern-input"
                          placeholder="If available"
                          value={form.police_report_number}
                          onChange={(e) => setForm((p) => ({ ...p, police_report_number: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Circumstances <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <textarea
                          className="modern-textarea"
                          rows={3}
                          placeholder="Any additional context about how or why this happened..."
                          value={form.circumstances}
                          onChange={(e) => setForm((p) => ({ ...p, circumstances: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Witness Information <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <textarea
                          className="modern-textarea"
                          rows={2}
                          placeholder="Names or contact info of any witnesses..."
                          value={form.witness_info}
                          onChange={(e) => setForm((p) => ({ ...p, witness_info: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Evidence URL <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="modern-input"
                            placeholder="Link to photos, screenshots, or other evidence"
                            value={form.evidence_url}
                            onChange={(e) => setForm((p) => ({ ...p, evidence_url: e.target.value }))}
                            style={{ paddingLeft: 40 }}
                          />
                          <LinkIcon
                            size={16}
                            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning + Navigation */}
                  <div className="modern-card p-4">
                    <div className="d-flex align-items-start gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: 'var(--warning-50)' }}>
                      <Info size={18} style={{ color: 'var(--warning-600)' }} className="flex-shrink-0 mt-0.5" />
                      <p style={{ fontSize: 13, color: 'var(--warning-700)', margin: 0 }}>
                        Filing a false report may result in account suspension. Provide accurate information to help recover your device.
                      </p>
                    </div>
                    <div className="d-flex justify-content-between">
                      <button type="button" className="btn-ghost" onClick={() => setStep('device')}>
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        className="btn-gradient-primary d-flex align-items-center gap-2"
                        disabled={!canProceedFromDetails()}
                        onClick={() => setStep('kyc_payment')}
                      >
                        Continue <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 3: KYC + PAYMENT ===== */}
              {step === 'kyc_payment' && selectedDevice && reportType && (
                <motion.div
                  key="step-kyc"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Summary Card */}
                  <div className="modern-card p-4 mb-3">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <Eye size={18} style={{ color: 'var(--primary-600)' }} />
                      Report Summary
                    </h5>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                            Device
                          </p>
                          <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>
                            {selectedDevice.brand} {selectedDevice.model}
                          </p>
                          <p className="mb-0" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            IMEI: {maskImei(selectedDevice.imei)}
                          </p>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                            Report Type
                          </p>
                          <p className="fw-semibold mb-0" style={{ fontSize: 14, textTransform: 'capitalize' }}>
                            {reportType}
                          </p>
                          <p className="mb-0" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Occurred {form.occurred_at ? formatDateTime(form.occurred_at) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="p-3 rounded-3" style={{ background: 'var(--bg-tertiary)' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                            Location
                          </p>
                          <p className="mb-0" style={{ fontSize: 14 }}>{form.location || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. Pay the report fee */}
                  {needsPayment && (
                    <div className="modern-card p-4 mb-3" data-testid="report-pay">
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 40, height: 40, background: paidRef ? 'var(--success-50)' : 'var(--primary-50)', flexShrink: 0 }}>
                          {paidRef ? <CheckCircle size={20} style={{ color: 'var(--success-600)' }} /> : <CreditCard size={20} style={{ color: 'var(--primary-600)' }} />}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 180 }}>
                          <h5 className="mb-0">1. Pay the report fee</h5>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                            {paidRef ? 'Paid. This payment is kept until your report is filed.' : `${paymentCurrency} ${Number(paymentAmount).toLocaleString()} for this report`}
                          </p>
                        </div>
                        {!paidRef && (
                          <button type="button" className="po-btn po-btn-primary" onClick={() => setShowPayment(true)}>
                            Pay {paymentCurrency} {Number(paymentAmount).toLocaleString()}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Confirm your identity (same wording on every report) */}
                  <div className="modern-card p-4 mb-3" data-testid="report-identity">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 40, height: 40, background: 'var(--primary-50)', flexShrink: 0 }}>
                        <Fingerprint size={20} style={{ color: 'var(--primary-600)' }} />
                      </div>
                      <div>
                        <h5 className="mb-0">{needsPayment ? '2. ' : ''}Confirm your identity</h5>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                          {isBusiness ? 'Enter your NIN, or your business registration (RC/BN) number.' : 'Enter your 11-digit National Identification Number (NIN).'} We check it against the name on your account.
                        </p>
                      </div>
                    </div>
                    {isBusiness && (
                      <div className="po-chip-row mb-2" role="tablist" aria-label="Confirm with">
                        <button type="button" role="tab" aria-selected={!useRc} className={`po-chip ${!useRc ? 'is-selected' : ''}`} onClick={() => { setUseRc(false); setIdError('') }}>NIN</button>
                        <button type="button" role="tab" aria-selected={useRc} className={`po-chip ${useRc ? 'is-selected' : ''}`} onClick={() => { setUseRc(true); setIdError('') }}>Registration number</button>
                      </div>
                    )}
                    {useRc ? (
                      <>
                        <label className="form-label" htmlFor="report-rc">Business registration number</label>
                        <input id="report-rc" className="modern-input po-mono" placeholder="e.g. RC1234567" autoComplete="off" value={rcInput}
                          onChange={(e) => { setRcInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)); setIdError('') }} />
                      </>
                    ) : (
                      <>
                        <label className="form-label" htmlFor="report-nin">NIN</label>
                        <input id="report-nin" className="modern-input po-mono" placeholder="11 digits" inputMode="numeric" autoComplete="off" maxLength={11} value={ninInput}
                          onChange={(e) => { setNinInput(e.target.value.replace(/\D/g, '').slice(0, 11)); setIdError('') }} />
                      </>
                    )}
                    {idError && <p className="po-error mt-2 mb-0" role="alert">{idError}{paidRef ? ' Your payment is kept.' : ''}</p>}
                  </div>

                  {/* Navigation */}
                  <div className="modern-card p-4">
                    <div className="d-flex justify-content-between gap-2">
                      <button type="button" className="btn-ghost" onClick={() => setStep('details')}>
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        className="btn-gradient-danger d-flex align-items-center gap-2"
                        disabled={!canSubmit}
                        onClick={() => handleSubmitReport()}
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="spinner-border" /> Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={18} /> Submit report
                          </>
                        )}
                      </button>
                    </div>
                    {needsPayment && !paidRef && <p className="po-muted mt-2 mb-0" style={{ fontSize: 13 }}>Pay the report fee first.</p>}
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 4: CONFIRMATION ===== */}
              {step === 'confirmation' && confirmationData && (
                <motion.div
                  key="step-confirmation"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="modern-card p-5 text-center">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                      style={{ width: 80, height: 80, background: 'var(--success-50)' }}
                    >
                      <CheckCircle size={48} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <h3 style={{ color: 'var(--text-primary)' }}>Report Submitted</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto' }}>
                      {confirmationData.message}
                    </p>

                    <div
                      className="mx-auto mt-4 p-4 rounded-3 text-start"
                      style={{ maxWidth: 420, background: 'var(--bg-tertiary)' }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Case ID
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {confirmationData.case_id}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Report Number
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-600)' }}>
                          #{confirmationData.report_number}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Status
                        </span>
                        <span
                          className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            background: 'var(--warning-50)',
                            color: 'var(--warning-700)',
                          }}
                        >
                          <Clock size={12} />
                          {confirmationData.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-3 mt-4 text-start" style={{ background: 'var(--info-50, #eff6ff)', border: '1px solid var(--info-200, #bfdbfe)' }}>
                      <div className="d-flex align-items-start gap-2">
                        <Info size={16} style={{ color: 'var(--info-600, #2563eb)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--info-700, #1d4ed8)', margin: '0 0 4px' }}>Next Steps</p>
                          <ul style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, paddingLeft: 16 }}>
                            <li>Your report will be reviewed by our team</li>
                            <li>You will receive updates via email and notifications</li>
                            <li>You can track the status from your reports dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 justify-content-center mt-4">
                      <button
                        className="btn-gradient-primary"
                        onClick={() => {
                          setConfirmationData(null)
                          setSelectedDevice(null)
                          setReportType(null)
                          setForm({ description: '', location: '', occurred_at: '', police_report_number: '', circumstances: '', witness_info: '', evidence_url: '' })
                          setNinInput('')
                          setPaymentAmount(null)
                          setReportNumber(null)
                          setStep('device')
                        }}
                      >
                        Report Another
                      </button>
                      <button className="btn-outline-primary" onClick={() => navigate('/reports')}>
                        View Reports
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>

      <PaymentGate
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        feeType="report_verification_fee"
        feeLabel="Report fee"
        description="Fee for this report"
        onSuccess={handlePaymentSuccess}
      />
    </Layout>
  )
}
