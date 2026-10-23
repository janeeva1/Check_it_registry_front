// Choose the kind of proof (the list depends on the item category), attach
// a photo or PDF, and send. Used on the item page and in the claim form.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Camera, Paperclip, X, FileText, Loader2, Upload } from 'lucide-react'
import type { ProofType } from '../../lib/apiClient'

const MAX_BYTES = 10 * 1024 * 1024
// Listing JPEG/PNG (not image/*) makes iPhones convert HEIC photos on upload
const ACCEPT = 'image/jpeg,image/png,application/pdf'

export type ProofSubmission = { proofType: string; file: File; note?: string }

type Props = {
  types: ProofType[]
  busy?: boolean
  submitLabel?: string
  /** Extra fields shown above the send button (e.g. the claim statement) */
  children?: ReactNode
  /** Return false to block sending (the parent shows the reason) */
  canSubmit?: boolean
  onSubmit: (s: ProofSubmission) => Promise<boolean | void> | void
}

export default function ProofPicker({ types, busy, submitLabel = 'Send for review', children, canSubmit = true, onSubmit }: Props) {
  const id = useId()
  const [proofType, setProofType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (f?: File | null) => {
    setError('')
    if (!f) return
    if (!ACCEPT.split(',').includes(f.type)) { setError('Use a JPG or PNG photo, or a PDF.'); return }
    if (f.size > MAX_BYTES) { setError('That file is larger than 10 MB. Try a smaller photo.'); return }
    setFile(f)
  }

  const needsNote = proofType === 'other'
  // The button stays clickable so a missing step is explained, not hidden
  const ready = canSubmit && !busy

  const submit = async () => {
    if (!proofType) { setError('Choose what kind of proof you are sending.'); return }
    if (!file) { setError('Attach a photo or PDF of your proof.'); return }
    if (needsNote && note.trim().length < 3) { setError('Add a short note saying what this document is.'); return }
    const ok = await onSubmit({ proofType, file, note: note.trim() || undefined })
    if (ok !== false) { setFile(null); setNote(''); setProofType('') }
  }

  return (
    <div className="po-proof">
      <fieldset>
        <legend className="po-label">1. What are you sending?</legend>
        <div className="po-choices" role="radiogroup">
          {types.map((t) => (
            <label key={t.key} className={`po-choice ${proofType === t.key ? 'is-selected' : ''}`}>
              <input type="radio" name={`${id}-type`} value={t.key} checked={proofType === t.key} onChange={() => { setProofType(t.key); setError('') }} />
              <span className="po-choice-title">{t.label}</span>
              {proofType === t.key && <span className="po-choice-hint">{t.hint}</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="po-field">
        <span className="po-label">2. Attach it</span>
        {file ? (
          <div className="po-attached">
            {preview ? <img src={preview} alt="Selected proof" /> : <span className="po-attached-doc"><FileText size={22} aria-hidden="true" /></span>}
            <div className="po-attached-meta">
              <strong>{file.name}</strong>
              <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <button type="button" className="po-icon-btn" onClick={() => setFile(null)} aria-label="Remove file"><X size={18} /></button>
          </div>
        ) : (
          <div className="po-attach-row">
            <button type="button" className="po-btn po-btn-secondary po-only-touch" onClick={() => cameraRef.current?.click()}>
              <Camera size={18} aria-hidden="true" /> Take a photo
            </button>
            <button type="button" className="po-btn po-btn-secondary" onClick={() => fileRef.current?.click()}>
              <Paperclip size={18} aria-hidden="true" /> Choose a file
            </button>
            <input ref={cameraRef} type="file" accept="image/jpeg,image/png" capture="environment" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
            <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        )}
        <p className="po-help">A clear photo or a PDF, up to 10 MB.</p>
      </div>

      {needsNote && (
        <div className="po-field">
          <label className="po-label" htmlFor={`${id}-note`}>What is this document?</label>
          <input id={`${id}-note`} className="modern-input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={needsNote ? 'e.g. Bank transfer slip for the purchase' : 'Anything that helps us check it'} />
        </div>
      )}

      {children}

      {error && <p className="po-error" role="alert">{error}</p>}

      <button type="button" className="po-btn po-btn-primary po-btn-block" onClick={submit} disabled={!ready} aria-disabled={!ready}>
        {busy ? <Loader2 size={18} className="po-spin" aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
        {busy ? 'Sending…' : submitLabel}
      </button>
    </div>
  )
}
