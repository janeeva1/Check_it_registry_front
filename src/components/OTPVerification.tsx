import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string, rememberDevice: boolean) => Promise<void>;
  // Ticked already when the person chose "Remember me" on the sign-in form
  defaultRemember?: boolean;
  onResendOTP: () => Promise<void>;
  userEmail?: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  loading?: boolean;
  error?: string;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  isOpen,
  onClose,
  onVerify,
  onResendOTP,
  userEmail,
  deviceInfo,
  loading = false,
  error,
  defaultRemember = false
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(defaultRemember);
  useEffect(() => { if (isOpen) setRememberDevice(defaultRemember) }, [isOpen, defaultRemember]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => {
        const otpString = newOtp.join('');
        if (otpString.length === 6) onVerify(otpString, rememberDevice);
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    
    setOtp(newOtp);
    
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => {
        const otpString = newOtp.join('');
        if (otpString.length === 6) onVerify(otpString, rememberDevice);
      }, 0);
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      await onVerify(otpString, rememberDevice);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResendOTP();
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const isComplete = otp.every(digit => digit !== '');

  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
         style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="modern-card p-4 p-md-5"
        style={{ width: '90%', maxWidth: '500px' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ 
                width: '64px', 
                height: '64px',
                background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)'
              }}
            >
              <Shield size={32} className="text-white" />
            </div>
          </div>
          <h4 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Device Verification Required
          </h4>
          <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
            We've detected a login from a new device. Please enter the 6-digit code sent to your email.
          </p>
        </div>

        {/* Device Info */}
        {deviceInfo && (
          <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <AlertCircle size={16} style={{ color: 'var(--warning-500)' }} />
              <small className="fw-medium" style={{ color: 'var(--text-primary)' }}>
                New Device Detected
              </small>
            </div>
            <div className="row g-2">
              <div className="col-4">
                <small style={{ color: 'var(--text-secondary)' }}>Device:</small>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{deviceInfo.device}</div>
              </div>
              <div className="col-4">
                <small style={{ color: 'var(--text-secondary)' }}>Browser:</small>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{deviceInfo.browser}</div>
              </div>
              <div className="col-4">
                <small style={{ color: 'var(--text-secondary)' }}>OS:</small>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{deviceInfo.os}</div>
              </div>
            </div>
          </div>
        )}

        {/* Email Info */}
        {userEmail && (
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            <Mail size={16} style={{ color: 'var(--primary-500)' }} />
            <small style={{ color: 'var(--text-secondary)' }}>
              Code sent to <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
            </small>
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-4">
          <div className="d-flex justify-content-center gap-2 mb-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="text-center fw-bold border rounded"
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '24px',
                  borderColor: digit ? 'var(--primary-500)' : 'var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary-500)'}
                onBlur={e => e.target.style.borderColor = digit ? 'var(--primary-500)' : 'var(--border-color)'}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
              <AlertCircle size={16} />
              <small>{error}</small>
            </div>
          )}

          {/* Remember Device Checkbox */}
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="rememberDevice"
              checked={rememberDevice}
              onChange={e => setRememberDevice(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberDevice" style={{ color: 'var(--text-secondary)' }}>
              Remember this device (no code next time)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="d-grid gap-2">
          <button
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className="btn btn-gradient-primary d-flex align-items-center justify-content-center gap-2"
            style={{ height: '48px' }}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Verify Device
              </>
            )}
          </button>

          <div className="d-flex justify-content-between align-items-center">
            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="btn btn-link text-decoration-none p-0"
              style={{ color: 'var(--primary-500)' }}
            >
              {resendLoading ? (
                <>
                  <RefreshCw size={16} className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw size={16} className="me-1" />
                  Resend Code
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="btn btn-link text-decoration-none p-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-4">
          <small style={{ color: 'var(--text-secondary)' }}>
            Didn't receive the code? Check your spam folder or try resending.
          </small>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;