import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  showDetails: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, showDetails: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, showDetails: false }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('UI ErrorBoundary caught:', error, errorInfo)
    try {
      const payload = {
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      }
      localStorage.setItem('last_ui_error', JSON.stringify(payload))
    } catch { /* localStorage may be unavailable */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8, color: 'var(--danger-600)' }}>Something went wrong</h2>
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
              An unexpected error occurred. Try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, showDetails: false })}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--primary-600)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
              <a href="/dashboard" style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Go to Dashboard
              </a>
            </div>
            <div
              onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
              style={{
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 14,
                userSelect: 'none',
              }}
            >
              {this.state.showDetails ? 'Hide details' : 'Show error details'}
            </div>
            {this.state.showDetails && this.state.error && (
              <pre style={{
                marginTop: 12,
                padding: 16,
                background: 'var(--bg-tertiary)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-primary)',
                overflow: 'auto',
                maxHeight: 300,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {this.state.error.stack || this.state.error.message}
              </pre>
            )}
          </div>
        )
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary