import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Camera, CheckCircle, AlertCircle, Loader, User, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './Toast'

interface KYCVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'intro' | 'nin_input' | 'confirm_details' | 'capture_selfie' | 'review' | 'processing' | 'success' | 'pending' | 'failed'

export default function KYCVerificationModal({ isOpen, onClose, onSuccess }: KYCVerificationModalProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [step, setStep] = useState<Step>('intro')
  const [nin, setNin] = useState('')
  const [ninDetails, setNinDetails] = useState<any>(null)
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || ''
  const API_URL = API_BASE ? `${API_BASE}/api` : (import.meta.env.VITE_API_URL || '/api')

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('intro')
      setNin('')
      setNinDetails(null)
      setSelfieBlob(null)
      setSelfiePreview(null)
      setCameraActive(false)
      setPermissionError(null)
    } else {
      stopCamera()
    }
  }, [isOpen])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const startCamera = async () => {
    try {
      setPermissionError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error('Camera Error:', err)
      setPermissionError('Unable to access camera. Please allow camera permissions.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to blob and preview URL
        canvas.toBlob((blob) => {
          if (blob) {
            setSelfieBlob(blob)
            setSelfiePreview(URL.createObjectURL(blob))
            stopCamera()
            setStep('review')
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const handleNINLookup = async () => {
    if (nin.length !== 11) {
      showError('Invalid NIN', 'Please enter a valid 11-digit NIN')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/kyc/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nin })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNinDetails(data.details)
        setStep('confirm_details')
      } else {
        throw new Error(data.error || 'NIN lookup failed')
      }
    } catch (error: any) {
      showError('Lookup Failed', error.message || 'Could not verify NIN. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitVerification = async () => {
    if (!selfieBlob) return

    setStep('processing')

    try {
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('nin', nin)
      formData.append('selfie_image', selfieBlob, 'live-selfie.jpg')

      const response = await fetch(`${API_URL}/kyc/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        if (data.status === 'verified') {
          setStep('success')
          showSuccess('Identity Verified', 'Your identity has been successfully verified.')
        } else {
          setStep('pending') // Manual review needed
          showSuccess('Submitted', 'Your verification is under manual review.')
        }
        
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000)
      } else {
        throw new Error(data.error || 'Verification failed')
      }
    } catch (error: any) {
      console.error('Verification Error:', error)
      setStep('failed')
      showError('Verification Failed', error.message || 'Identity verification failed.')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="modal-dialog modal-dialog-centered modal-lg"
        >
          <div className="modal-content border-0 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
            {step !== 'processing' && step !== 'success' && step !== 'pending' && (
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close" onClick={onClose}></button>
              </div>
            )}
            
            <div className="modal-body p-4 p-lg-5 text-center">
              
              {/* STEP 1: INTRO */}
              {step === 'intro' && (
                <div className="py-2">
                  <div className="mb-4 d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                    <Shield size={48} />
                  </div>
                  <h3 className="fw-bold mb-3">Identity Verification</h3>
                  <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                    To ensure the security of the registry, we need to verify your identity using your National Identity Number (NIN).
                  </p>

                  {!(user as any)?.profile_image_url && (
                    <div className="mx-auto mb-4 p-3 rounded-3 d-flex align-items-center gap-3 text-start"
                      style={{ maxWidth: '400px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <Camera size={24} style={{ color: '#d97706', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#92400e', fontSize: 14 }}>Upload a Profile Photo First</strong>
                        <p style={{ color: '#b45309', fontSize: 13, margin: '2px 0 0' }}>
                          Please upload a profile photo in your account settings before starting verification.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex flex-column gap-3 mb-5 mx-auto text-start" style={{ maxWidth: '350px' }}>
                    <div className="d-flex gap-3 align-items-center">
                      <div className="bg-light p-2 rounded-circle"><User size={20} className="text-secondary" /></div>
                      <div>
                        <strong className="d-block text-dark">Prepare your NIN</strong>
                        <span className="small text-muted">Use your 11-digit NIN number</span>
                      </div>
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                      <div className="bg-light p-2 rounded-circle"><Camera size={20} className="text-secondary" /></div>
                      <div>
                        <strong className="d-block text-dark">Take a Selfie</strong>
                        <span className="small text-muted">We'll use your camera to verify it's you</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep('nin_input')}
                    className="btn btn-primary btn-lg px-5 rounded-pill w-100" 
                    style={{ maxWidth: '350px' }}
                    disabled={!(user as any)?.profile_image_url}
                  >
                    {!(user as any)?.profile_image_url ? 'Upload Profile Photo First' : 'Start Verification'}
                  </button>
                  <div className="mt-3">
                    <small className="text-muted">By continuing, you agree to our Terms of Service</small>
                  </div>
                </div>
              )}

              {/* STEP 2: NIN INPUT */}
              {step === 'nin_input' && (
                <div className="py-2">
                   <h4 className="fw-bold mb-3">Enter Valid NIN</h4>
                   <p className="text-muted mb-4">Please enter your 11-digit National Identity Number.</p>
                   
                   <div className="mx-auto mb-4" style={{ maxWidth: '350px' }}>
                     <input 
                        type="text" 
                        className="form-control form-control-lg text-center fw-bold"
                        placeholder="12345678901"
                        maxLength={11}
                        value={nin}
                        onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{ letterSpacing: '2px', fontSize: '1.5rem' }}
                     />
                     <div className="form-text text-start mt-2">
                       <Shield size={14} className="me-1" />
                       Your ID is encrypted and secure.
                     </div>
                   </div>

                   <button 
                    onClick={handleNINLookup}
                    disabled={nin.length !== 11 || isLoading}
                    className="btn btn-primary px-5 rounded-pill"
                   >
                     {isLoading ? <><Loader size={18} className="animate-spin me-2" />Searching...</> : 'Find My Details'}
                   </button>
                </div>
              )}

              {/* STEP 3: CONFIRM DETAILS */}
              {step === 'confirm_details' && ninDetails && (
                 <div className="py-2">
                   <h4 className="fw-bold mb-3">Is this you?</h4>
                   <p className="text-muted mb-4">We found these details linked to the NIN provided.</p>

                   <div className="card shadow-sm border-0 mx-auto mb-4 bg-light" style={{ maxWidth: '400px', borderRadius: '16px' }}>
                     <div className="card-body p-4">
                       <div className="d-flex align-items-center gap-4 text-start">
                         <img 
                            src={ninDetails.photo_url || 'https://via.placeholder.com/100'} 
                            alt="NIN Profile" 
                            className="rounded-circle shadow-sm"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                         />
                         <div>
                           <h5 className="fw-bold mb-1">{ninDetails.first_name} {ninDetails.last_name}</h5>
                           <p className="text-muted small mb-0">{ninDetails.gender === 'M' ? 'Male' : 'Female'} • {ninDetails.date_of_birth}</p>
                           <span className="badge bg-success-subtle text-success mt-2">NIN Active</span>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="d-flex gap-2 justify-content-center">
                     <button 
                        onClick={() => setStep('nin_input')}
                        className="btn btn-light px-4 rounded-pill border"
                     >
                       Not me
                     </button>
                     <button 
                        onClick={() => {
                          setStep('capture_selfie');
                          startCamera();
                        }}
                        className="btn btn-primary px-4 rounded-pill d-flex align-items-center gap-2"
                     >
                       Yes, this is me <ChevronRight size={18} />
                     </button>
                   </div>
                 </div>
              )}

              {/* STEP 4: CAPTURE SELFIE */}
              {step === 'capture_selfie' && (
                <div className="py-2">
                  <h4 className="fw-bold mb-3">Face Verification</h4>
                  <p className="text-muted mb-3">Position your face in the frame.</p>

                  <div className="position-relative mx-auto mb-4 bg-dark overflow-hidden rounded-circle" style={{ width: '280px', height: '280px' }}>
                     <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                     />
                     {!cameraActive && !permissionError && (
                       <div className="position-absolute top-50 start-50 translate-middle text-white">
                         <Loader size={32} className="animate-spin mb-2" />
                         <p className="small mb-0">Starting camera...</p>
                       </div>
                     )}
                     {permissionError && (
                        <div className="position-absolute top-50 start-50 translate-middle text-white w-75">
                         <AlertCircle size={32} className="mb-2 text-danger" />
                         <p className="small mb-0">{permissionError}</p>
                         <button onClick={startCamera} className="btn btn-sm btn-outline-light mt-2">Retry</button>
                       </div>
                     )}
                     <div className="position-absolute top-0 start-0 w-100 h-100 border border-4 border-white opacity-25 rounded-circle pointer-events-none"></div>
                  </div>

                  <canvas ref={canvasRef} hidden />

                  <button 
                    onClick={capturePhoto}
                    disabled={!cameraActive}
                    className="btn btn-primary btn-lg rounded-circle p-3 shadow-lg"
                    style={{ width: '64px', height: '64px' }}
                    title="Capture Photo"
                  >
                    <Camera size={28} />
                  </button>
                  <p className="small text-muted mt-3">Click to capture</p>
                </div>
              )}

              {/* STEP 5: REVIEW SELFIE */}
              {step === 'review' && selfiePreview && (
                <div className="py-2">
                   <h4 className="fw-bold mb-3">Review Photo</h4>
                   <p className="text-muted mb-4">Make sure your face is clearly visible.</p>

                   <div className="mx-auto mb-4 rounded-circle overflow-hidden shadow-sm" style={{ width: '200px', height: '200px' }}>
                     <img 
                        src={selfiePreview} 
                        alt="Selfie Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} // Mirror effect for consistency
                     />
                   </div>

                   <div className="d-flex gap-3 justify-content-center">
                     <button 
                        onClick={() => {
                          setStep('capture_selfie');
                          startCamera();
                        }}
                        className="btn btn-light px-4 rounded-pill border"
                     >
                       Retake
                     </button>
                     <button 
                        onClick={handleSubmitVerification}
                        className="btn btn-success px-5 rounded-pill text-white fw-bold shadow-sm"
                     >
                       Submit Verification
                     </button>
                   </div>
                </div>
              )}

              {/* STATES: PROCESSING / SUCCESS / FAILED */}
              {step === 'processing' && (
                <div className="py-5">
                  <div className="mb-4">
                    <Loader size={64} className="text-primary animate-spin" />
                  </div>
                  <h4 className="fw-bold mb-2">Verifying Identity...</h4>
                  <p className="text-muted">Comparing your selfie with official records.</p>
                </div>
              )}

              {step === 'success' && (
                <div className="py-5">
                   <div className="mb-4 d-inline-block p-3 rounded-circle bg-success text-white">
                      <CheckCircle size={64} />
                   </div>
                   <h3 className="fw-bold text-success mb-2">Verification Successful!</h3>
                   <p className="text-muted">Your identity has been verified.</p>
                </div>
              )}

               {step === 'pending' && (
                <div className="py-5">
                   <div className="mb-4 d-inline-block p-3 rounded-circle bg-warning text-white">
                      <AlertCircle size={64} />
                   </div>
                   <h3 className="fw-bold text-warning mb-2">Verification Pending</h3>
                   <p className="text-muted">Your verification is under manual review due to low match confidence.</p>
                </div>
              )}

               {step === 'failed' && (
                <div className="py-5">
                   <div className="mb-4 d-inline-block p-3 rounded-circle bg-danger text-white">
                      <AlertTriangle size={64} />
                   </div>
                   <h3 className="fw-bold text-danger mb-2">Verification Failed</h3>
                   <p className="text-muted mb-4">We could not match your face with the provided NIN.</p>
                   <button 
                      onClick={onClose}
                      className="btn btn-outline-secondary px-4 rounded-pill"
                   >
                     Close
                   </button>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
      <div className="modal-backdrop show" style={{ opacity: 0.5 }}></div>
    </AnimatePresence>
  )
}
