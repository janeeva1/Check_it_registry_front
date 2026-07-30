import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Loader,
  AlertCircle,
  Eye,
  Smartphone
} from 'lucide-react';
import { locationService, LocationData, LocationError } from '../services/LocationService';
import { deviceFingerprintService } from '../services/DeviceFingerprintService';

interface DeviceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckComplete?: (result: any) => void;
}

interface CheckResult {
  success: boolean;
  deviceStatus: 'legitimate' | 'stolen' | 'suspicious' | 'unknown';
  deviceDetails?: any;
  ownershipWarning?: any;
  securityAlerts?: any[];
  transferAvailable?: boolean;
  riskScore?: number;
  error?: string;
}

const DeviceCheckModal: React.FC<DeviceCheckModalProps> = ({
  isOpen,
  onClose,
  onCheckComplete
}) => {
  const [step, setStep] = useState<'input' | 'location' | 'checking' | 'result'>('input');
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setDeviceIdentifier('');
      setLocation(null);
      setLocationError(null);
      setCheckResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceIdentifier.trim()) {
      setError('Please enter a device identifier');
      return;
    }

    setError(null);
    setStep('location');
    await requestLocation();
  };

  const requestLocation = async () => {
    setLoading(true);
    setLocationError(null);

    try {
      // Check if geolocation is supported
      if (!locationService.isSupported()) {
        throw new Error('Location services are not supported by your browser');
      }

      // Request permission first
      const permission = await locationService.requestPermission();
      if (permission === 'denied') {
        throw new Error('Location access is required to perform device checks');
      }

      // Get location with retry
      const locationData = await locationService.getLocationWithRetry(3);
      setLocation(locationData);
      setStep('checking');
      await performDeviceCheck(locationData);

    } catch (error) {
      const locationErr = error as LocationError;
      let errorMessage = 'Failed to get location';

      switch (locationErr.code) {
        case 'PERMISSION_DENIED':
          errorMessage = 'Location access denied. Please enable location services and try again.';
          break;
        case 'POSITION_UNAVAILABLE':
          errorMessage = 'Location unavailable. Please check your GPS settings.';
          break;
        case 'TIMEOUT':
          errorMessage = 'Location request timed out. Please try again.';
          break;
        case 'ACCURACY_INSUFFICIENT':
          errorMessage = locationErr.message;
          break;
        default:
          errorMessage = locationErr.message || 'Location error occurred';
      }

      setLocationError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const performDeviceCheck = async (locationData: LocationData) => {
    setLoading(true);
    setError(null);

    try {
      // Generate device fingerprint
      const fingerprint = await deviceFingerprintService.generateFingerprint();
      const networkInfo = await deviceFingerprintService.getNetworkInfo();
      const securityMetadata = await deviceFingerprintService.getSecurityMetadata();

      // Prepare check data
      const checkData = {
        deviceIdentifier: deviceIdentifier.trim(),
        checkerLocation: locationData,
        deviceFingerprint: {
          ...fingerprint,
          macAddress: securityMetadata.macAddress
        },
        networkInfo,
        checkReason: 'purchase_check'
      };

      // Get auth token if available
      const token = localStorage.getItem('auth_token');
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Perform enhanced device check
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/public-check/enhanced`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Device check failed');
      }

      setCheckResult(result);
      setStep('result');
      onCheckComplete?.(result);

    } catch (error) {
      console.error('Device check error:', error);
      setError(error instanceof Error ? error.message : 'Device check failed');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'legitimate':
        return <CheckCircle className="text-success" size={24} />;
      case 'stolen':
        return <AlertTriangle className="text-danger" size={24} />;
      case 'suspicious':
        return <AlertCircle className="text-warning" size={24} />;
      default:
        return <Eye className="text-secondary" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'legitimate':
        return 'success';
      case 'stolen':
        return 'danger';
      case 'suspicious':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'legitimate':
        return 'Device appears to be legitimate';
      case 'stolen':
        return 'Device has been reported as STOLEN';
      case 'suspicious':
        return 'Suspicious activity detected';
      case 'unknown':
        return 'Device not found in registry';
      default:
        return 'Unknown status';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
         style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-4 shadow-lg"
        style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-primary bg-opacity-10 p-2">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h5 className="mb-0">Device Security Check</h5>
              <small className="text-muted">Verify device authenticity and ownership</small>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-outline-secondary rounded-circle p-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Device Input */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleDeviceSubmit}>
                  <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <Smartphone size={16} className="me-2" />
                      Device Identifier <span style={{color:'red'}}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter IMEI, Serial Number, or VIN"
                      value={deviceIdentifier}
                      onChange={(e) => setDeviceIdentifier(e.target.value)}
                      autoFocus
                    />
                    <div className="form-text">
                      Enter the device's IMEI, serial number, VIN, or other unique identifier
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <div className="alert alert-info">
                    <strong>Security Notice:</strong> This check will collect your location and device information for security purposes.
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader className="spinner-border spinner-border-sm me-2" />
                        Processing...
                      </>
                    ) : (
                      'Check Device'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Location Request */}
            {step === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="mb-4">
                  <div className="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-3" style={{ width: 'fit-content' }}>
                    <MapPin className="text-warning" size={32} />
                  </div>
                  <h5>Location Required</h5>
                  <p className="text-muted">
                    We need your location to perform a secure device check and prevent fraud.
                  </p>
                </div>

                {locationError && (
                  <div className="alert alert-danger">
                    <AlertTriangle size={16} className="me-2" />
                    {locationError}
                  </div>
                )}

                {loading && (
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                    <Loader className="spinner-border spinner-border-sm" />
                    <span>Getting your location...</span>
                  </div>
                )}

                <div className="d-grid gap-2">
                  <button
                    onClick={requestLocation}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Allow Location Access
                  </button>
                  <button
                    onClick={() => setStep('input')}
                    className="btn btn-outline-secondary"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Checking */}
            {step === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="mb-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3" style={{ width: 'fit-content' }}>
                    <Loader className="text-primary spinner-border" size={32} />
                  </div>
                  <h5>Checking Device...</h5>
                  <p className="text-muted">
                    Analyzing device security and ownership information
                  </p>
                </div>

                {location && (
                  <div className="alert alert-info">
                    <MapPin size={16} className="me-2" />
                    Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    <br />
                    <small>Accuracy: ±{Math.round(location.accuracy)}m</small>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Results */}
            {step === 'result' && checkResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Device Status */}
                <div className={`alert alert-${getStatusColor(checkResult.deviceStatus)} d-flex align-items-center gap-3`}>
                  {getStatusIcon(checkResult.deviceStatus)}
                  <div>
                    <h6 className="mb-1">{getStatusMessage(checkResult.deviceStatus)}</h6>
                    {checkResult.riskScore !== undefined && (
                      <small>Risk Score: {checkResult.riskScore}/100</small>
                    )}
                  </div>
                </div>

                {/* Ownership Warning */}
                {checkResult.ownershipWarning && (
                  <div className={`alert alert-${checkResult.ownershipWarning.level} border-start border-4`}>
                    <h6 className="fw-bold">{checkResult.ownershipWarning.title}</h6>
                    <p className="mb-2">{checkResult.ownershipWarning.message}</p>
                    {checkResult.ownershipWarning.recommendations && (
                      <div>
                        <strong>Recommendations:</strong>
                        <ul className="mb-0 mt-1">
                          {checkResult.ownershipWarning.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Device Details */}
                {checkResult.deviceDetails && (
                  <div className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">Device Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-6">
                          <strong>Brand:</strong> {checkResult.deviceDetails.brand}
                        </div>
                        <div className="col-6">
                          <strong>Model:</strong> {checkResult.deviceDetails.model}
                        </div>
                        <div className="col-6">
                          <strong>Category:</strong> {checkResult.deviceDetails.category}
                        </div>
                        <div className="col-6">
                          <strong>Status:</strong> 
                          <span className={`badge bg-${getStatusColor(checkResult.deviceDetails.status)} ms-1`}>
                            {checkResult.deviceDetails.status}
                          </span>
                        </div>
                        {checkResult.deviceDetails.registrationDate && (
                          <div className="col-12">
                            <strong>Registered:</strong> {new Date(checkResult.deviceDetails.registrationDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Alerts */}
                {checkResult.securityAlerts && checkResult.securityAlerts.length > 0 && (
                  <div className="mb-3">
                    <h6>Security Alerts</h6>
                    {checkResult.securityAlerts.map((alert: any, index: number) => (
                      <div key={index} className={`alert alert-${alert.level} py-2`}>
                        <small>{alert.message}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="d-grid gap-2">
                  {checkResult.transferAvailable && (
                    <button className="btn btn-success">
                      <CheckCircle size={16} className="me-2" />
                      Safe to Purchase
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setStep('input');
                      setDeviceIdentifier('');
                    }}
                    className="btn btn-outline-primary"
                  >
                    Check Another Device
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default DeviceCheckModal;