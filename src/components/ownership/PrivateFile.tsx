// Shows a private upload (proof, evidence) without putting the login token
// in the URL: the file is fetched with the Authorization header and shown
// from a local blob URL.
import { useEffect, useState } from 'react'
import { FileText, ExternalLink, Loader2, ImageOff } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || '/api'

function viewUrl(fileUrl: string) {
  // "/uploads/proofs/abc.jpg" -> "/api/files/view/proofs/abc.jpg"
  const m = fileUrl.match(/\/uploads\/([a-z]+)\/([^/?#]+)$/)
  return m ? `${API}/files/view/${m[1]}/${encodeURIComponent(m[2])}` : null
}

export default function PrivateFile({ fileUrl, label, height = 160 }: { fileUrl: string; label?: string; height?: number }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [type, setType] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let revoked = false
    let url: string | null = null
    const src = viewUrl(fileUrl)
    if (!src) { setState('error'); return }
    setState('loading')
    fetch(src, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob() })
      .then((b) => {
        if (revoked) return
        url = URL.createObjectURL(b)
        setType(b.type)
        setBlobUrl(url)
        setState('ready')
      })
      .catch(() => { if (!revoked) setState('error') })
    return () => { revoked = true; if (url) URL.revokeObjectURL(url) }
  }, [fileUrl])

  if (state === 'loading') {
    return <div className="po-file po-file-empty" style={{ height }}><Loader2 size={20} className="po-spin" aria-label="Loading file" /></div>
  }
  if (state === 'error' || !blobUrl) {
    return <div className="po-file po-file-empty" style={{ height }}><ImageOff size={20} aria-hidden="true" /><span>File unavailable</span></div>
  }
  const isImage = type.startsWith('image/')
  return (
    <a href={blobUrl} target="_blank" rel="noreferrer" className="po-file" style={{ height }} aria-label={`Open ${label || 'file'} in a new tab`}>
      {isImage
        ? <img src={blobUrl} alt={label || 'Uploaded proof'} />
        : <span className="po-file-doc"><FileText size={28} aria-hidden="true" /><span>{label || 'Document'} (PDF)</span></span>}
      <span className="po-file-open"><ExternalLink size={14} aria-hidden="true" /> Open</span>
    </a>
  )
}
