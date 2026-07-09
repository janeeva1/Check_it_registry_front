import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, Loader2, AlertCircle, CheckCircle, Smartphone, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface MFAChallengeProps {
  isOpen: boolean
  onClose: () => void
  actionType: string
  actionLabel: string
  onSuccess: (mfaToken: string) => void
  requiresDualOtp?: boolean
}

export function MFAChallenge({ isOpen, onClose, actionType, actionLabel, onSuccess, requiresDualOtp = false }: MFAChallengeProps) {
  const [step, setStep] = useState<'initiate' | 'verify' | 'verify_second'>('initiate')
  const [sessionId, setSessionId] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [secondOtp, setSecondOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<string>('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const secondInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setStep('initiate')
      setOtp(['', '', '', '', '', ''])
      setSecondOtp(['', '', '', '', '', ''])
      setError(null)
      setSessionId('')
      initiate()
    }
  }, [isOpen, actionType])

  useEffect(() => {
    if (step === 'verify' && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
    if (step === 'verify_second' && secondInputRefs.current[0]) {
      secondInputRefs.current[0].focus()
    }
  }, [step])

  const initiate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await supabase.security.mfaInitiate({ action_type: actionType })
      setSessionId(res.session_id)
      setDeliveryMethod(res.delivery_method || 'email')
      setStep('verify')
    } catch (e: any) {
      setError(e.message || 'Failed to initiate MFA')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string, isSecond: boolean) => {
    const target = isSecond ? secondOtp : otp
    const setter = isSecond ? setSecondOtp : setOtp
    if (value.length > 1) return
    const copy = [...target]
    copy[index] = value
    setter(copy)
    if (value && index < 5) {
      const refs = isSecond ? secondInputRefs : inputRefs
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isSecond: boolean) => {
    if (e.key === 'Backspace' && !(isSecond ? secondOtp : otp)[index] && index > 0) {
      const refs = isSecond ? secondInputRefs : inputRefs
      refs.current[index - 1]?.focus()
    }
  }

  const verify = async (code: string, nextStep?: 'verify_second') => {
    setLoading(true)
    setError(null)
    try {
      const res = await supabase.security.mfaVerify({
        session_id: sessionId,
        otp: code,
        second_otp: nextStep ? undefined : undefined,
      })
      if (nextStep) {
        setStep(nextStep)
      } else {
        onSuccess(res.mfa_token || res.token || 'verified')
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyFirst = async () => {
    const code = otp.join('')
    if (code.length !== 6) return
    if (requiresDualOtp) {
      await verify(code, 'verify_second')
    } else {
      await verify(code)
    }
  }

  const handleVerifySecond = async () => {
    const code = secondOtp.join('')
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const res = await supabase.security.mfaVerify({
        session_id: sessionId,
        otp: otp.join(''),
        second_otp: code,
      })
      onSuccess(res.mfa_token || res.token || 'verified')
    } catch (e: any) {
      setError(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const renderOtpInputs = (
    values: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onChange: (index: number, value: string) => void,
    onKeyDown: (index: number, e: React.KeyboardEvent) => void
  ) => (
    <div className="d-flex justify-content-center gap-2 mb-4">
      {values.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          className="text-center fw-bold border rounded"
          style={{
            width: 48,
            height: 56,
            fontSize: 24,
            borderColor: digit ? 'var(--primary-500)' : 'var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      ))}
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            style={{ maxWidth: 440 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {step === 'initiate' ? (
              <div className="modal-body text-center" style={{ padding: 40 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Shield size={28} color="#fff" />
                </div>
                <h4 style={{ marginBottom: 8 }}>Security Verification</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {actionLabel} requires identity verification
                </p>
                <Loader2 size={24} className="spin" style={{ margin: '24px auto', display: 'block' }} />
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3>{step === 'verify_second' ? 'Second Factor' : 'Verify Identity'}</h3>
                  <button onClick={onClose} className="btn-ghost p-1"><X size={20} /></button>
                </div>
                <div className="modal-body text-center">
                  {deliveryMethod === 'email' ? (
                    <Mail size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  ) : deliveryMethod === 'sms' ? (
                    <Smartphone size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  ) : (
                    <Shield size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  )}
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                    {step === 'verify_second' ? 'Enter the second OTP code sent to your registered device' : `Enter the OTP code sent to your ${deliveryMethod}`}
                  </p>

                  {step === 'verify' && renderOtpInputs(otp, inputRefs, (i, v) => handleOtpChange(i, v, false), (i, e) => handleKeyDown(i, e, false))}
                  {step === 'verify_second' && renderOtpInputs(secondOtp, secondInputRefs, (i, v) => handleOtpChange(i, v, true), (i, e) => handleKeyDown(i, e, true))}

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2" style={{ fontSize: 13 }}>
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
                  <button onClick={onClose} className="btn-ghost">Cancel</button>
                  <button
                    onClick={step === 'verify_second' ? handleVerifySecond : handleVerifyFirst}
                    disabled={loading || (step === 'verify' ? otp.join('').length !== 6 : secondOtp.join('').length !== 6)}
                    className="btn-gradient-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                    {loading ? 'Verifying...' : step === 'verify_second' ? 'Verify Second Code' : 'Verify'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
