import React from 'react'
import { motion } from 'framer-motion'

interface LoadingProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  overlay?: boolean
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'large',
  overlay = false 
}) => {
  const logoSizes = {
    small: { width: '40px', height: '40px' },
    medium: { width: '60px', height: '60px' },
    large: { width: '80px', height: '80px' }
  }

  const logoSize = logoSizes[size]

  const containerStyles = overlay ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } : {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-secondary)'
  }

  return (
    <div 
      className={overlay ? '' : 'd-flex flex-column justify-content-center align-items-center'}
      style={containerStyles}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className="text-center"
      >
        {/* Animated Logo */}
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="d-inline-flex align-items-center justify-content-center mb-4"
          style={{ 
            ...logoSize,
            boxShadow: '0 10px 25px rgba(14, 165, 233, 0.3)',
            padding: '8px'
          }}
        >
          <img 
            src="/logo1.png" 
            alt="Prove Ownership Device Registry" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
            }}
          />
        </motion.div>



        {/* Loading Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-3"
        >
          <div 
            className="spinner-border"
            style={{ 
              color: overlay ? 'white' : 'var(--primary-600)', 
              width: size === 'small' ? '1.5rem' : '2rem', 
              height: size === 'small' ? '1.5rem' : '2rem' 
            }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </motion.div>

        {/* Loading Message */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ 
            color: overlay ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
            fontSize: size === 'small' ? '14px' : '16px'
          }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  )
}

// Inline loading for buttons
export function ButtonLoading() {
  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '8px' 
    }}>
      <div style={{
        width: '16px',
        height: '16px',
        border: '2px solid transparent',
        borderTop: '2px solid currentColor',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}></div>
      <span>Loading...</span>
    </div>
  )
}