import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onRemove: (id: string) => void
}

const icons = {
  success: <CheckCircle size={20} className="text-white" />,
  error: <AlertCircle size={20} className="text-white" />,
  warning: <AlertTriangle size={20} className="text-white" />,
  info: <Info size={20} className="text-white" />
}

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const typeConfig = {
    success: { bg: 'bg-emerald-500', border: 'border-emerald-600', bgGlow: 'rgba(16, 185, 129, 0.2)' },
    error: { bg: 'bg-rose-500', border: 'border-rose-600', bgGlow: 'rgba(244, 63, 94, 0.2)' },
    warning: { bg: 'bg-amber-500', border: 'border-amber-600', bgGlow: 'rgba(245, 158, 11, 0.2)' },
    info: { bg: 'bg-blue-500', border: 'border-blue-600', bgGlow: 'rgba(59, 130, 246, 0.2)' }
  }

  const { bg, border, bgGlow } = typeConfig[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      style={{
        boxShadow: `0 10px 15px -3px ${bgGlow}, 0 4px 6px -4px ${bgGlow}`
      }}
      className={`min-w-[300px] w-full max-w-[400px] ${bg} border ${border} rounded-xl p-4 text-white pointer-events-auto backdrop-blur-sm bg-opacity-95`}
    >
      <div className="d-flex align-items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {icons[toast.type]}
        </div>
        <div className="flex-grow-1">
          <h6 className="fw-bold mb-1">{toast.title}</h6>
          {toast.message && (
            <p className="mb-0 text-white text-opacity-75 small lh-sm" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="btn btn-sm btn-link p-0 text-white text-opacity-75 hover:text-opacity-100 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div 
      className="position-fixed top-0 end-0 p-3 p-md-4 d-flex flex-column gap-3 pointer-events-none" 
      style={{ zIndex: 100000, width: '100%', maxWidth: '450px', marginTop: '72px' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

type ToastContextValue = {
  toasts: ToastMessage[]
  removeToast: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, error?: any) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]) // Max 5 toasts
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (title: string, message?: string) => {
    addToast({ type: 'success', title, message: message || '' })
  }

  // Explicit error parsing for any error type
  const showError = (title: string, error?: any) => {
    let messageStr = '';

    if (!error) {
      messageStr = 'An unknown error occurred.';
    } else if (typeof error === 'string') {
      messageStr = error;
    } else if (error.response?.data?.error) {
      messageStr = error.response.data.error; // Axios/Express error format
    } else if (error.error?.message) {
      messageStr = error.error.message;
    } else if (error.message) {
      messageStr = error.message; // Standard JS Error
    } else {
      try {
        messageStr = JSON.stringify(error);
      } catch {
        messageStr = 'An unexpected error occurred.';
      }
    }

    addToast({ type: 'error', title, message: messageStr })
  }

  const showWarning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message: message || '' })
  }

  const showInfo = (title: string, message?: string) => {
    addToast({ type: 'info', title, message: message || '' })
  }

  const value: ToastContextValue = {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast hook for easy usage (uses global context)
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}