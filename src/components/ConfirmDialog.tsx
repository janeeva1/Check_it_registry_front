// An accessible in-app confirmation dialog that replaces window.confirm /
// alert. Usage:
//   const confirm = useConfirm()
//   if (!(await confirm({ title: 'Release this item?', danger: true }))) return
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'

export type ConfirmOptions = {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** Show only one button (an in-app replacement for alert) */
  notice?: boolean
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const confirmBtn = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => {
    lastFocus.current = document.activeElement as HTMLElement
    setPending({ ...o, resolve })
  }), [])

  const close = useCallback((ok: boolean) => {
    setPending((p) => { p?.resolve(ok); return null })
    setTimeout(() => lastFocus.current?.focus?.(), 0)
  }, [])

  useEffect(() => {
    if (!pending) return
    confirmBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [pending, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="po-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(false) }}>
          <div className="po-dialog" role="alertdialog" aria-modal="true" aria-labelledby="po-dialog-title" aria-describedby="po-dialog-body">
            <div className={`po-dialog-icon ${pending.danger ? 'is-danger' : ''}`}>
              {pending.danger ? <AlertTriangle size={22} /> : <Info size={22} />}
            </div>
            <h2 id="po-dialog-title" className="po-dialog-title">{pending.title}</h2>
            {pending.message && <div id="po-dialog-body" className="po-dialog-body">{pending.message}</div>}
            <div className="po-dialog-actions">
              {!pending.notice && (
                <button type="button" className="po-btn po-btn-secondary" onClick={() => close(false)}>
                  {pending.cancelLabel || 'Cancel'}
                </button>
              )}
              <button ref={confirmBtn} type="button" className={`po-btn ${pending.danger ? 'po-btn-danger' : 'po-btn-primary'}`} onClick={() => close(true)}>
                {pending.confirmLabel || (pending.notice ? 'OK' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  // Outside the provider (e.g. in a test) fall back to the browser dialog
  return ctx || ((o: ConfirmOptions) => Promise.resolve(o.notice ? (window.alert(o.title), true) : window.confirm(o.title)))
}
