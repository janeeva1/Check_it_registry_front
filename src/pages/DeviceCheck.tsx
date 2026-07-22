import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Smartphone, 
  Barcode, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  Calendar,
  Info,
  Camera,
  Wifi,
  QrCode,
  ShieldAlert,
  Eye,
  Phone,
  MapPin
} from 'lucide-react'
import { CheckResult } from '../types/database'
import { apiClient } from '../lib/apiClient'
import { locationService } from '../services/LocationService'
import { deviceFingerprintService } from '../services/DeviceFingerprintService'
import { useToast, ToastContainer } from '../components/Toast'
import { Layout } from '../components/Layout'
import { PaymentGate } from '../components/PaymentGate'
import { MobileDeviceCheck } from '../components/mobile/MobileDeviceCheck'
import { mobileIntegrationService } from '../services/MobileIntegrationService'

export default function DeviceCheck() {
  const [imei, setImei] = useState('')
  const [serial, setSerial] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMobileFeatures, setShowMobileFeatures] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [enhancedData, setEnhancedData] = useState<any>(null)
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast()
  const navigate = useNavigate()
  const [showRiskAck, setShowRiskAck] = useState(false)
  const [riskAckChecked, setRiskAckChecked] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentBypass, setPaymentBypass] = useState<string | null>(null)

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = async () => {
      const capabilities = await mobileIntegrationService.detectCapabilities();
      setIsMobile(capabilities.isMobile || capabilities.isTablet);
    };
    checkMobile();
  }, []);

  const validateInput = () => {
    if (!imei.trim() && !serial.trim()) {
      setError('Please enter either an IMEI or serial number')
      return false
    }

    if (imei && imei.length < 10) {
      setError('IMEI must be at least 10 digits')
      return false
    }

    if (serial && serial.length < 3) {
      setError('Serial number must be at least 3 characters')
      return false
    }

    return true
  }

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setEnhancedData(null)

    if (!validateInput()) {
      return
    }

    setLoading(true)

    try {
      // Ensure location services are supported and permitted
      if (!locationService.isSupported()) {
        throw new Error('Location services are not supported by your browser')
      }

      const permission = await locationService.requestPermission()
      if (permission === 'denied') {
        throw new Error('Location access is required to perform device checks')
      }

      const locationData = await locationService.getLocationWithRetry(3)

      // Generate device fingerprint and network info
      const fingerprint = await deviceFingerprintService.generateFingerprint()
      const networkInfo = await deviceFingerprintService.getNetworkInfo()
      const securityMetadata = await deviceFingerprintService.getSecurityMetadata()
      const fallbackIp = (networkInfo && networkInfo.ipAddress) ? networkInfo.ipAddress : '0.0.0.0'
      const enrichedNetworkInfo = { 
        ...networkInfo, 
        ipAddress: fallbackIp,
        ip: fallbackIp,
        macAddress: securityMetadata.macAddress,
        mac: securityMetadata.macAddress
      }

      const payload: any = {
        deviceIdentifier: imei.trim() || serial.trim(),
        checkerLocation: locationData,
        deviceFingerprint: {
          ...fingerprint,
          macAddress: securityMetadata.macAddress
        },
        networkInfo: enrichedNetworkInfo,
        checkReason: 'purchase_check'
      }
      if (paymentBypass) payload.paymentBypass = paymentBypass

      const checkResult = await apiClient.publicCheckEnhanced(payload) 
      setEnhancedData(checkResult)

      // Map enhanced result to existing UI model
      const mapStatus = (s: string) => {
        if (s === 'legitimate') return 'verified'
        if (s === 'stolen') return 'stolen'
        if (s === 'lost') return 'lost'
        if (s === 'not_found') return 'not_found'
        return 'unknown'
      }

      const mapped: CheckResult = {
        status: mapStatus(checkResult.deviceStatus || ''),
        message: checkResult.success ? 'Enhanced check completed' : (checkResult.error || 'Check failed'),
        recovery_instructions: checkResult.deviceStatus === 'stolen' || checkResult.deviceStatus === 'lost'
          ? 'Please contact local law enforcement immediately. Do not proceed with purchase.'
          : undefined
      }

      setResult(mapped)

      if (mapped.status === 'stolen' || mapped.status === 'lost') {
        showWarning('Device Alert', 'This device has been reported as stolen or lost')
      } else if (mapped.status === 'verified') {
        showSuccess('Device Verified', 'This device is registered and verified')
      } else if (mapped.status === 'not_found') {
        showWarning('Not Registered', 'This device is not registered on this system')
      }
    } catch (err) {
      console.error('Check error:', err)
      const msg = (err && typeof err === 'object' && (err as any).message)
        ? String((err as any).message)
        : (err instanceof Error ? err.message : 'Failed to check device')
      if (msg.toLowerCase().includes('payment') || msg.toLowerCase().includes('fee')) {
        setShowPayment(true)
      } else {
        setError(msg)
        showError('Check Failed', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMobileDeviceIdentified = (identifier: string, method: string) => {
    // Determine if it's IMEI or serial based on format
    if (/^\d{15}$/.test(identifier)) {
      setImei(identifier);
      setSerial('');
    } else {
      setSerial(identifier);
      setImei('');
    }
    
    showSuccess('Device Identified', `Device identified via ${method.replace('_', ' ')}`);
    setShowMobileFeatures(false);
  };

  const handleLocationUpdate = (location: any) => {
    console.log('Location updated:', location);
    // Location data is automatically captured during device checks
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'var(--success-500)'
      case 'stolen': case 'lost': return 'var(--danger-500)'
      case 'found': return 'var(--primary-500)'
      default: return 'var(--warning-500)'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle
      case 'stolen': case 'lost': return AlertTriangle
      case 'found': return Shield
      default: return HelpCircle
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'verified': return 'This device is registered and verified as legitimate'
      case 'stolen': return 'This device has been reported as stolen'
      case 'lost': return 'This device has been reported as lost'
      case 'found': return 'This device has been reported as found'
      case 'not_found': return 'This device is not registered on this system'
      default: return 'Device status could not be determined'
    }
  }

  const getStatusAdvice = (status: string) => {
    switch (status) {
      case 'verified': 
        return {
          title: 'Safe to Purchase',
          message: 'This device is legitimate and safe to buy. The owner has properly registered it.',
          action: 'You can proceed with confidence.'
        }
      case 'stolen': 
        return {
          title: 'Do Not Purchase',
          message: 'This device has been reported stolen. Purchasing it may be illegal.',
          action: 'Contact local authorities if you have information about this device.'
        }
      case 'lost': 
        return {
          title: 'Exercise Caution',
          message: 'This device has been reported lost by its owner.',
          action: 'Contact the owner or authorities to return the device.'
        }
      case 'found': 
        return {
          title: 'Device Located',
          message: 'This device was previously reported as lost but has been found.',
          action: 'Verify with the owner before proceeding.'
        }
      case 'not_found':
        return {
          title: 'Not Registered',
          message: 'This device is not registered on this system. If you are the owner, register it to help prevent uncertainties and aid recovery if lost.',
          action: 'Ask the seller to verify registration or avoid purchase.'
        }
      default: 
        return {
          title: 'Unknown Status',
          message: 'We could not determine the status of this device.',
          action: 'Proceed with caution and verify with the seller.'
        }
    }
  }

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="row mb-5"
        >
          <div className="col-12">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="d-inline-flex align-items-center justify-content-center mb-4 rounded-4"
                style={{ 
                  width: '80px', 
                  height: '80px',
                  background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)'
                }}
              >
                <Search size={40} className="text-white" />
              </motion.div>
              <h1 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Device Verification</h1>
              <p className="lead mb-0" style={{ color: 'var(--text-secondary)' }}>
                Verify device status and check for theft reports
              </p>
            </div>
          </div>
        </motion.div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            {/* Security Notice */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="modern-card p-4 mb-4"
              style={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              <div className="d-flex align-items-start gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <ShieldAlert size={20} style={{ color: 'var(--danger-500)' }} />
                </div>
                <div>
                  <h4 className="h6 mb-2 fw-bold" style={{ color: 'var(--danger-600)' }}>
                    Important Security Notice
                  </h4>
                  <p className="mb-0" style={{ color: 'var(--danger-700)', fontSize: '14px' }}>
                    Always verify device status before purchasing. Buying stolen devices is illegal and supports criminal activity. 
                    Use this tool to protect yourself and help recover stolen property.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Search Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="modern-card p-4 p-md-5 mb-5"
            >
              <form onSubmit={handleCheck}>
                <div className="text-center mb-4">
                  <h2 className="h4 mb-2" style={{ color: 'var(--text-primary)' }}>Check Device Status</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Enter IMEI or serial number to verify device</p>
                </div>

                {/* IMEI Input with QR Scanner */}
                <div className="mb-4">
                  <label htmlFor="imei" className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Smartphone size={16} />
                    IMEI Number
                  </label>
                  <div className="position-relative">
                    <input
                      id="imei"
                      type="text"
                      className="modern-input pe-5"
                      placeholder="Enter 15-digit IMEI number"
                      value={imei}
                      onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-2"
                      onClick={() => setShowMobileFeatures(!showMobileFeatures)}
                      title="Scan QR Code"
                    >
                      <QrCode size={20} style={{ color: 'var(--primary-500)' }} />
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Usually found in Settings → About Phone or by dialing *#06#
                  </small>
                </div>

                {/* OR Divider */}
                <div className="position-relative mb-4">
                  <hr style={{ borderColor: 'var(--border-color)' }} />
                  <span 
                    className="position-absolute top-50 start-50 translate-middle px-3"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                  >
                    OR
                  </span>
                </div>

                {/* Serial Number Input with QR Scanner */}
                <div className="mb-4">
                  <label htmlFor="serial" className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Barcode size={16} />
                    Serial Number
                  </label>
                  <div className="position-relative">
                    <input
                      id="serial"
                      type="text"
                      className="modern-input pe-5"
                      placeholder="Enter device serial number"
                      value={serial}
                      onChange={(e) => setSerial(e.target.value.trim())}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-2"
                      onClick={() => setShowMobileFeatures(!showMobileFeatures)}
                      title="Scan QR Code"
                    >
                      <QrCode size={20} style={{ color: 'var(--primary-500)' }} />
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Found on device label, box, or in device settings
                  </small>
                </div>

                {/* Error Display */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="alert alert-danger d-flex align-items-center mb-4"
                  >
                    <AlertTriangle size={18} className="me-2" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Submit Button - Enhanced Design */}
                <div className="d-grid">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || (!imei.trim() && !serial.trim())}
                    className="btn-gradient-primary btn-lg d-flex align-items-center justify-content-center gap-2 py-3"
                    style={{ fontSize: '16px', fontWeight: '600' }}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Scanning & Verifying Device...
                      </>
                    ) : (
                      <>
                        <Search size={20} />
                        Scan & Verify Device
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>

            {/* Mobile Features */}
            {showMobileFeatures && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="modern-card p-4 p-md-5 mb-5"
              >
                <div className="text-center mb-4">
                  <h3 className="h4 mb-2" style={{ color: 'var(--text-primary)' }}>
                    <Camera size={24} className="me-2" />
                    QR Code Scanner
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Use your device's camera to scan QR codes or barcodes
                  </p>
                </div>
                
                {isMobile ? (
                  <MobileDeviceCheck
                    onDeviceIdentified={handleMobileDeviceIdentified}
                    onLocationUpdate={handleLocationUpdate}
                  />
                ) : (
                  <div className="text-center py-4">
                    <Camera size={48} style={{ color: 'var(--text-secondary)' }} className="mb-3" />
                    <p style={{ color: 'var(--text-secondary)' }}>
                      QR code scanning is available on mobile devices. Please use a mobile device to access this feature.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Enhanced Results Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="modern-card p-4 p-md-5 mb-5"
                >
                  {/* Status Header */}
                  <div className="text-center mb-4">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ 
                        width: '80px', 
                        height: '80px',
                        backgroundColor: `${getStatusColor(result.status)}20`,
                        border: `3px solid ${getStatusColor(result.status)}30`
                      }}
                    >
                      {(() => {
                        const IconComponent = getStatusIcon(result.status);
                        return <IconComponent size={40} style={{ color: getStatusColor(result.status) }} />;
                      })()}
                    </div>
                    <h3 className="h3 mb-2" style={{ color: 'var(--text-primary)' }}>
                      <span className="text-capitalize fw-bold" style={{ color: getStatusColor(result.status) }}>
                        {result.status === 'verified' ? 'Registered & Safe' : result.status}
                      </span>
                    </h3>
                    <p className="lead" style={{ color: 'var(--text-secondary)' }}>
                      {getStatusMessage(result.status)}
                    </p>
                  </div>

                  {/* Ownership Personalization */}
                  {enhancedData?.ownershipWarning && (
                    <div 
                      className="p-3 rounded-3 mb-4"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
                    >
                      <div className="d-flex align-items-start gap-2">
                        <ShieldAlert size={18} style={{ color: 'var(--warning-700)' }} />
                        <div>
                          <p className="mb-1 fw-semibold" style={{ color: 'var(--warning-700)' }}>Ownership Warning</p>
                          <p className="mb-0" style={{ color: 'var(--warning-600)' }}>{enhancedData.ownershipWarning}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Advice */}
                  {(() => {
                    const advice = getStatusAdvice(result.status);
                    return (
                      <div 
                        className="p-4 rounded-3 mb-4"
                        style={{ 
                          backgroundColor: result.status === 'verified' ? 'rgba(34, 197, 94, 0.1)' : 
                                          result.status === 'stolen' ? 'rgba(239, 68, 68, 0.1)' : 
                                          'rgba(245, 158, 11, 0.1)',
                          border: `1px solid ${result.status === 'verified' ? 'rgba(34, 197, 94, 0.2)' : 
                                                result.status === 'stolen' ? 'rgba(239, 68, 68, 0.2)' : 
                                                'rgba(245, 158, 11, 0.2)'}`
                        }}
                      >
                        <h4 className="h5 mb-2 fw-bold" style={{ 
                          color: result.status === 'verified' ? 'var(--success-700)' : 
                                 result.status === 'stolen' ? 'var(--danger-700)' : 
                                 'var(--warning-700)'
                        }}>
                          {advice.title}
                        </h4>
                        <p className="mb-2" style={{ 
                          color: result.status === 'verified' ? 'var(--success-600)' : 
                                 result.status === 'stolen' ? 'var(--danger-600)' : 
                                 'var(--warning-600)'
                        }}>
                          {advice.message}
                        </p>
                        <p className="mb-0 fw-medium" style={{ 
                          color: result.status === 'verified' ? 'var(--success-700)' : 
                                 result.status === 'stolen' ? 'var(--danger-700)' : 
                                 'var(--warning-700)'
                        }}>
                          {advice.action}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Device Details */}
                  {result.case_id && (
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                          <Shield size={20} style={{ color: 'var(--primary-600)' }} />
                          <div>
                            <p className="mb-0 fw-medium" style={{ color: 'var(--text-primary)' }}>Case ID</p>
                            <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                              {result.case_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      {result.report_type && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                            <AlertTriangle size={20} style={{ color: 'var(--warning-600)' }} />
                            <div>
                              <p className="mb-0 fw-medium" style={{ color: 'var(--text-primary)' }}>Report Type</p>
                              <p className="mb-0 text-capitalize" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                {result.report_type}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {result.occurred_at && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: 'var(--gray-50)' }}>
                            <Calendar size={20} style={{ color: 'var(--primary-600)' }} />
                            <div>
                              <p className="mb-0 fw-medium" style={{ color: 'var(--text-primary)' }}>Occurred</p>
                              <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                {new Date(result.occurred_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {result.status === 'stolen' || result.status === 'lost' ? (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2">
                          <Phone size={18} />
                          Contact Authorities
                        </button>
                      </div>
                      <div className="col-md-6">
                        <button 
                          className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                          onClick={() => {
                            if (enhancedData?.checkId) {
                              setRiskAckChecked(false)
                              setShowRiskAck(true)
                            }
                          }}
                        >
                          <Eye size={18} />
                          View Details
                        </button>
                      </div>
                    </div>
                  ) : result.status === 'verified' ? (
                    <div className="text-center">
                      <button className="btn btn-success btn-lg d-flex align-items-center justify-content-center gap-2 mx-auto">
                        <CheckCircle size={20} />
                        Safe to Purchase
                      </button>
                    </div>
                  ) : null}

                  {/* Universal View Details button when a checkId exists */}
                  {enhancedData?.checkId && (result.status !== 'stolen' && result.status !== 'lost') && (
                    <div className="text-center mt-3">
                      <button 
                        className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-2"
                        onClick={() => navigate(`/device-check-report?checkId=${enhancedData.checkId}`)}
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Risk Acknowledgement Modal */}
            {showRiskAck && (
              <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                  <div className="modal-content modern-card">
                    <div className="modal-header border-0 pb-0">
                      <h5 className="modal-title d-flex align-items-center gap-2">
                        <AlertTriangle size={18} />
                        Risk Acknowledgement
                      </h5>
                      <button className="btn-close" onClick={() => setShowRiskAck(false)}></button>
                    </div>
                    <div className="modal-body">
                      <p className="mb-2" style={{ color: 'var(--text-primary)' }}>
                        This device is reported as stolen or lost. If you are not the owner, handling, purchasing, or attempting to transact with this device may put you at legal risk.
                      </p>
                      <p className="text-secondary" style={{ fontSize: 13 }}>
                        Do not proceed with purchase. If you have information, contact local authorities. By continuing, you acknowledge this warning.
                      </p>
                      <div className="form-check mt-3">
                        <input
                          id="riskAckCheckbox"
                          className="form-check-input"
                          type="checkbox"
                          checked={riskAckChecked}
                          onChange={(e) => setRiskAckChecked(e.target.checked)}
                        />
                        <label htmlFor="riskAckCheckbox" className="form-check-label">
                          I understand and wish to view the check details
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer border-0 pt-0">
                      <button className="btn btn-outline-secondary" onClick={() => setShowRiskAck(false)}>Cancel</button>
                      <button
                        className="btn btn-danger"
                        disabled={!riskAckChecked}
                        onClick={() => {
                          setShowRiskAck(false)
                          if (enhancedData?.checkId) {
                            navigate(`/device-check-report?checkId=${enhancedData.checkId}`)
                          }
                        }}
                      >
                        Continue to Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="modern-card p-4 p-md-5"
            >
              <div className="text-center mb-4">
                <h3 className="h4 mb-2" style={{ color: 'var(--text-primary)' }}>How Device Check Works</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Our secure verification process</p>
              </div>

              <div className="row g-4">
                <div className="col-md-4">
                  <div className="text-center">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)'
                      }}
                    >
                      <Search size={24} style={{ color: 'var(--primary-600)' }} />
                    </div>
                    <h4 className="h6 mb-2" style={{ color: 'var(--text-primary)' }}>Search Database</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      We search our secure database of registered devices
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)'
                      }}
                    >
                      <Shield size={24} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <h4 className="h6 mb-2" style={{ color: 'var(--text-primary)' }}>Verify Status</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Check if the device is stolen, lost, or legitimate
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)'
                      }}
                    >
                      <Info size={24} style={{ color: 'var(--warning-500)' }} />
                    </div>
                    <h4 className="h6 mb-2" style={{ color: 'var(--text-primary)' }}>Get Results</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Receive detailed information about the device status
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
      <PaymentGate
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        feeType="device_check_fee"
        feeLabel="Device Check"
        description="Fee for performing a device status check"
        onSuccess={(token) => { setPaymentBypass(token); setShowPayment(false); }}
      />
    </Layout>
  )
}