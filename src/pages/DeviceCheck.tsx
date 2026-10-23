import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Shield, AlertTriangle, CheckCircle, HelpCircle, QrCode, Loader2 } from 'lucide-react'
import { CheckResult } from '../types/database'
import { apiClient } from '../lib/apiClient'
import { locationService } from '../services/LocationService'
import { deviceFingerprintService } from '../services/DeviceFingerprintService'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { Layout } from '../components/Layout'
import { PaymentGate } from '../components/PaymentGate'
import { MobileDeviceCheck } from '../components/mobile/MobileDeviceCheck'
import { mobileIntegrationService } from '../services/MobileIntegrationService'
import { Link } from 'react-router-dom'
import OwnershipBadge from '../components/ownership/OwnershipBadge'

export default function DeviceCheck() {
  // Pre-fill from links such as /device-check?imei=... (landing page, login redirect)
  const [searchParams] = useSearchParams()
  const [imei, setImei] = useState(() => (searchParams.get('imei') || '').replace(/\D/g, '').slice(0, 17))
  const [serial, setSerial] = useState(() => (searchParams.get('serial') || '').slice(0, 64))
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMobileFeatures, setShowMobileFeatures] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [enhancedData, setEnhancedData] = useState<any>(null)
  const { showSuccess, showError, showWarning } = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
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
      // The server expects the paid invoice reference as pay_by_pass
      if (paymentBypass) payload.pay_by_pass = paymentBypass

      const checkResult = await apiClient.publicCheckEnhanced(payload) 
      if (checkResult && checkResult.requiresPayment) {
        // Free checks used up: open the payment step, then the user checks again
        setPaymentBypass(null)
        setShowPayment(true)
        return
      }
      setPaymentBypass(null) // a payment unlocks one check only
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
      case 'verified': return 'This item is registered and has no theft or loss reports'
      case 'stolen': return 'This device has been reported as stolen'
      case 'lost': return 'This device has been reported as lost'
      case 'found': return 'This device has been reported as found'
      case 'not_found': return 'This device is not registered on this system'
      default: return 'Device status could not be determined'
    }
  }

  const ownershipLevel: string = enhancedData?.ownershipLevel || 'registered'

  const getStatusAdvice = (status: string) => {
    if (status === 'verified' && ownershipLevel === 'disputed') {
      return {
        title: 'Wait — ownership is disputed',
        message: 'Someone else has claimed this item and our team is reviewing it.',
        action: "Don't buy it until the dispute is resolved."
      }
    }
    switch (status) {
      case 'verified': 
        return ownershipLevel === 'verified_owner' ? {
          title: 'No theft reports — owner verified',
          message: 'This item is registered and our team has checked proof of who owns it.',
          action: 'Make sure the seller is that owner: ask them to transfer it to you on Prove Ownership when you pay. If they refuse, walk away.'
        } : {
          title: 'No theft reports',
          message: "This item is registered, but its owner hasn't proven ownership to us yet.",
          action: 'Ask the seller to transfer it to you on Prove Ownership when you pay, and ask for the receipt or papers.'
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

  const value = imei || serial
  const onValue = (v: string) => { setImei(''); setSerial(v.slice(0, 64)); setError('') }
  const statusTone = !result ? '' : result.status === 'stolen' || result.status === 'lost' || ownershipLevel === 'disputed' ? 'danger'
    : result.status === 'verified' ? (ownershipLevel === 'verified_owner' ? 'success' : 'info') : 'warning'
  const StatusIcon = result ? getStatusIcon(result.status) : Search
  const advice = result ? getStatusAdvice(result.status) : null

  const openReport = async () => {
    if (!enhancedData?.checkId) return
    if (result && (result.status === 'stolen' || result.status === 'lost')) {
      const ok = await confirm({
        title: 'This item is reported ' + result.status,
        message: 'If you are not the owner, buying or handling it can put you at legal risk. Do not go ahead with the purchase.',
        confirmLabel: 'I understand, show details', danger: true,
      })
      if (!ok) return
    }
    navigate(`/device-check-report?checkId=${enhancedData.checkId}`)
  }

  return (
    <Layout>
      <div className="po-page po-single">
        <h1 className="po-hello">Check an item</h1>
        <p className="po-muted" style={{ marginTop: -12, marginBottom: 20 }}>See if it's stolen, lost, or claimed before you pay.</p>

        <form onSubmit={handleCheck} className="po-card">
          <label className="po-label" htmlFor="check-id">IMEI, serial number or VIN</label>
          <div className="po-check-row">
            <input id="check-id" className="modern-input po-mono po-check-input" autoComplete="off" autoCapitalize="characters"
              placeholder="e.g. 356938035643809" value={value} onChange={(e) => onValue(e.target.value)} />
            <button type="submit" className="po-btn po-btn-primary" disabled={loading || !value.trim()}>
              {loading ? <Loader2 size={18} className="po-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
              {loading ? 'Checking…' : 'Check'}
            </button>
          </div>
          <p className="po-help">On a phone, dial <strong>*#06#</strong> to see its IMEI. We ask for your location so owners know where their item was checked.</p>
          {isMobile && (
            <button type="button" className="po-btn po-btn-ghost po-btn-sm" onClick={() => setShowMobileFeatures((v) => !v)}>
              <QrCode size={16} aria-hidden="true" /> {showMobileFeatures ? 'Hide scanner' : 'Scan a code instead'}
            </button>
          )}
          {error && <p className="po-error" role="alert">{error}</p>}
        </form>

        {showMobileFeatures && isMobile && (
          <div className="po-card">
            <MobileDeviceCheck onDeviceIdentified={handleMobileDeviceIdentified} onLocationUpdate={handleLocationUpdate} />
          </div>
        )}

        {result && advice && (
          <section className={`po-result is-${statusTone}`} aria-live="polite">
            <div className="po-result-icon"><StatusIcon size={30} aria-hidden="true" /></div>
            <h2>{advice.title}</h2>
            <p>{advice.message}</p>
            {result.status !== 'not_found' && result.status !== 'unknown' && <OwnershipBadge level={ownershipLevel} />}
            <p className="po-result-action">{advice.action}</p>

            {(result.case_id || result.report_type || result.occurred_at) && (
              <dl className="po-rows po-result-rows">
                {result.report_type && <div><dt>Reported as</dt><dd className="text-capitalize">{result.report_type}</dd></div>}
                {result.occurred_at && <div><dt>When</dt><dd>{new Date(result.occurred_at).toLocaleDateString()}</dd></div>}
                {result.case_id && <div><dt>Case number</dt><dd className="po-mono">{result.case_id}</dd></div>}
              </dl>
            )}

            <div className="po-result-links">
              {enhancedData?.checkId && <button type="button" className="po-btn po-btn-secondary po-btn-sm" onClick={openReport}>See full report</button>}
              {result.status !== 'not_found' && result.status !== 'unknown' && (
                <Link to={`/claim?identifier=${encodeURIComponent(value.trim())}`} className="po-link">Is it yours? Claim it</Link>
              )}
              {result.status === 'not_found' && <Link to="/register-device" className="po-link">Own it? Register it</Link>}
            </div>
          </section>
        )}
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
