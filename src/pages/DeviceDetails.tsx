import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Trash2, AlertTriangle, Copy, Check, History, Loader2, LogOut, ArrowLeftRight, Search, MailCheck, Store, ChevronRight } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { CategoryIcon, categoryLabel, formatNaira, storedCategory } from '../utils/categories'
import OwnershipPanel from '../components/ownership/OwnershipPanel'

type Device = {
  id: string
  brand: string
  model: string
  category: string
  imei?: string | null
  imei2?: string | null
  serial?: string | null
  vin?: string | null
  license_plate?: string | null
  year?: string | null
  engine_number?: string | null
  certificate_number?: string | null
  color?: string | null
  storage_capacity?: string | null
  estimated_value?: number | string | null
  description?: string | null
  notes?: string | null
  status: string
  ownership_level?: string
  created_at: string
}

const STATUS: Record<string, { label: string; tone: string; help: string }> = {
  verified: { label: 'Active', tone: 'success', help: 'Protected and in your name.' },
  unverified: { label: 'Confirm by email', tone: 'warning', help: 'Confirm this registration with the code we email you.' },
  stolen: { label: 'Reported stolen', tone: 'danger', help: 'Anyone who checks it is told it was stolen.' },
  lost: { label: 'Reported lost', tone: 'danger', help: 'Anyone who checks it is told it was lost.' },
  found: { label: 'Found', tone: 'info', help: 'Marked as found.' },
  pending_transfer: { label: 'Transfer in progress', tone: 'info', help: 'A transfer to a new owner is waiting to be completed.' },
  released: { label: 'Released', tone: 'neutral', help: 'No longer in your name.' },
}

// Which edit fields make sense for which kind of item
const EDIT_FIELDS: Record<string, Array<[keyof Device, string]>> = {
  common: [['brand', 'Brand'], ['model', 'Model'], ['color', 'Colour']],
  mobile_phone: [['storage_capacity', 'Storage']],
  computer: [['storage_capacity', 'Storage']],
  vehicle: [['license_plate', 'Plate number']],
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" className="po-icon-btn po-icon-btn-sm" aria-label="Copy"
      onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const isNew = params.get('new') === '1'
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { showSuccess, showError } = useToast()
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Device>>({})
  const [level, setLevel] = useState<string | undefined>()
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const d = await apiClient.devices.get(id)
      setDevice(d?.data || d)
    } catch { setDevice(null) } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const cat = storedCategory(device?.category)

  const saveEdit = async () => {
    if (!device) return
    const changed: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(editForm)) if ((device as any)[k] !== v) changed[k] = v
    if (!Object.keys(changed).length) { setEditing(false); return }
    setSaving(true)
    try {
      await apiClient.devices.update(device.id, changed)
      setDevice({ ...device, ...changed } as Device)
      setEditing(false)
      showSuccess('Changes saved')
    } catch (err: any) { showError('Could not save changes', err?.message) } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!device) return
    const ok = await confirm({
      title: `Remove ${device.brand} ${device.model}?`,
      message: 'It will disappear from your items and stop being protected. If you sold or gave it away, use Transfer instead so the new owner gets it.',
      confirmLabel: 'Remove item', danger: true,
    })
    if (!ok) return
    try {
      await apiClient.devices.delete(device.id)
      showSuccess('Item removed')
      navigate('/my-devices')
    } catch (err: any) { showError('Could not remove item', err?.message) }
  }

  const release = async () => {
    if (!device) return
    const ok = await confirm({
      title: `Release ${device.brand} ${device.model}?`,
      message: 'It will no longer be in your name, and anyone can register it. Use this only if you no longer have the item and no one is buying it from you.',
      confirmLabel: 'Release item', danger: true,
    })
    if (!ok) return
    try {
      await apiClient.devices.release(device.id)
      showSuccess('Item released')
      navigate('/my-devices')
    } catch (err: any) { showError('Could not release item', err?.message) }
  }

  const sendCode = async () => {
    if (!device) return
    try {
      await apiClient.devices.resendVerification(device.id)
      setCodeSent(true)
      showSuccess('Code sent', 'Check your email for a 6-digit code.')
    } catch (err: any) { showError('Could not send code', err?.message) }
  }

  const verify = async () => {
    if (!device || code.trim().length < 4) return
    setVerifying(true)
    try {
      await apiClient.devices.verifyWithCode(device.id, code.trim())
      showSuccess('Registration confirmed')
      setCode(''); setCodeSent(false)
      await load()
    } catch (err: any) { showError('That code did not work', err?.message) } finally { setVerifying(false) }
  }

  if (loading) {
    return <Layout requireAuth><div className="po-page po-center"><Loader2 size={28} className="po-spin" aria-label="Loading" /></div></Layout>
  }

  if (!device) {
    return (
      <Layout requireAuth>
        <div className="po-page">
          <div className="modern-card p-5 text-center">
            <h1 className="h4">Item not found</h1>
            <p className="po-muted">It may have been removed or transferred to someone else.</p>
            <Link to="/my-devices" className="po-btn po-btn-primary">Go to my items</Link>
          </div>
        </div>
      </Layout>
    )
  }

  const status = STATUS[device.status] || { label: device.status, tone: 'neutral', help: '' }
  const ids: Array<[string, string | null | undefined]> = [
    ['IMEI', device.imei], ['Second IMEI', device.imei2], ['Serial number', device.serial],
    ['VIN', device.vin], ['Plate number', device.license_plate], ['Engine number', device.engine_number],
    ['Certificate number', device.certificate_number],
  ]
  const details: Array<[string, string | null | undefined]> = [
    ['Type', categoryLabel(device.category)], ['Colour', device.color], ['Storage', device.storage_capacity],
    ['Year', device.year], ['Estimated value', device.estimated_value ? formatNaira(device.estimated_value) : null],
    ['Registered', new Date(device.created_at).toLocaleDateString()],
  ]
  const editFields = [...EDIT_FIELDS.common, ...(EDIT_FIELDS[cat] || [])]
  const blocked = ['stolen', 'lost', 'released'].includes(device.status)
  const canSell = level === 'verified_owner' && device.status === 'verified'

  const checkLink = device.imei ? `/device-check?imei=${encodeURIComponent(device.imei)}` : `/device-check?serial=${encodeURIComponent(device.serial || device.vin || '')}`
  const shown = [...ids, ...details].filter(([, v]) => v)

  return (
    <Layout requireAuth>
      <div className="po-page po-single">
        <button className="po-back" onClick={() => navigate(-1)}><ArrowLeft size={18} aria-hidden="true" /> Back</button>

        <header className="po-item-head">
          <span className="po-item-icon"><CategoryIcon category={device.category} size={26} /></span>
          <div className="po-item-title">
            <h1>{device.brand} {device.model}</h1>
            <div className="po-item-meta">
              <span className={`po-badge po-badge-${status.tone}`} title={status.help}>{status.label}</span>
            </div>
          </div>
        </header>

        {device.status === 'unverified' && (
          <section className="po-card is-highlighted" aria-labelledby="confirm-title">
            <h2 id="confirm-title" className="po-card-title"><MailCheck size={20} aria-hidden="true" /> Confirm it's yours</h2>
            <p className="po-card-text">Open the link we emailed you{isNew ? ' just now' : ''}. Can't find it?</p>
            {codeSent ? (
              <div className="po-inline-form">
                <label htmlFor="verify-code" className="visually-hidden">6-digit code</label>
                <input id="verify-code" className="modern-input" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
                  placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                <button className="po-btn po-btn-primary" onClick={verify} disabled={verifying || code.length < 4}>
                  {verifying ? <Loader2 size={16} className="po-spin" aria-hidden="true" /> : null} Confirm
                </button>
              </div>
            ) : (
              <button className="po-btn po-btn-secondary" onClick={sendCode}>Email me a code</button>
            )}
          </section>
        )}

        <OwnershipPanel deviceId={device.id} highlight={isNew} onLevelChange={setLevel} />

        <ul className="po-simple-list po-mb">
          <li><Link to={checkLink} className="po-simple-row"><span className="po-row-icon"><Search size={20} aria-hidden="true" /></span><span className="po-simple-main"><strong>Check it</strong><span>See what a buyer sees</span></span><ChevronRight size={18} aria-hidden="true" /></Link></li>
          {!blocked && <li><Link to={`/transfer?device=${device.id}`} className="po-simple-row"><span className="po-row-icon"><ArrowLeftRight size={20} aria-hidden="true" /></span><span className="po-simple-main"><strong>Transfer to a new owner</strong><span>You sold or gave it away</span></span><ChevronRight size={18} aria-hidden="true" /></Link></li>}
          {canSell && <li><Link to={`/marketplace/create-listing?device=${device.id}`} className="po-simple-row"><span className="po-row-icon"><Store size={20} aria-hidden="true" /></span><span className="po-simple-main"><strong>Sell it</strong><span>List on the marketplace</span></span><ChevronRight size={18} aria-hidden="true" /></Link></li>}
          {!blocked && <li><Link to={`/report-incident?device=${device.id}`} className="po-simple-row is-danger"><span className="po-row-icon"><AlertTriangle size={20} aria-hidden="true" /></span><span className="po-simple-main"><strong>Report stolen or lost</strong><span>Warn anyone who checks it</span></span><ChevronRight size={18} aria-hidden="true" /></Link></li>}
        </ul>

        <section className="po-card" aria-labelledby="details-title">
          <div className="po-card-head">
            <h2 id="details-title" className="po-card-title">Details</h2>
            {!editing && !blocked && (
              <button className="po-btn po-btn-ghost po-btn-sm" onClick={() => { setEditForm(Object.fromEntries(editFields.map(([k]) => [k, device[k] ?? '']))); setEditing(true) }}>
                <Pencil size={16} aria-hidden="true" /> Edit
              </button>
            )}
          </div>
          {editing ? (
            <>
              <div className="po-form-grid">
                {editFields.map(([k, label]) => (
                  <div key={k} className="po-field">
                    <label className="po-label" htmlFor={`edit-${k}`}>{label}</label>
                    <input id={`edit-${k}`} className="modern-input" value={String(editForm[k] ?? '')} onChange={(e) => setEditForm((p) => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <div className="po-field po-span-2">
                  <label className="po-label" htmlFor="edit-notes">Notes</label>
                  <textarea id="edit-notes" className="modern-textarea" rows={3} value={String(editForm.notes ?? device.notes ?? '')} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="po-actions">
                <button className="po-btn po-btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="po-btn po-btn-primary" onClick={saveEdit} disabled={saving}>{saving && <Loader2 size={16} className="po-spin" aria-hidden="true" />} Save</button>
              </div>
            </>
          ) : (
            <dl className="po-rows">
              {shown.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className={ids.some(([n]) => n === k) ? 'po-mono' : ''}>{v}{ids.some(([n]) => n === k) && <CopyValue value={String(v)} />}</dd>
                </div>
              ))}
              {device.description && <div><dt>Description</dt><dd>{device.description}</dd></div>}
              {device.notes && <div><dt>Notes</dt><dd>{device.notes}</dd></div>}
            </dl>
          )}
        </section>

        <div className="po-quiet-links">
          <Link to={`/device-check-report?deviceId=${device.id}`}><History size={15} aria-hidden="true" /> Who checked this item</Link>
          {!blocked && <button type="button" onClick={release}><LogOut size={15} aria-hidden="true" /> Release</button>}
          {!blocked && <button type="button" className="is-danger" onClick={remove}><Trash2 size={15} aria-hidden="true" /> Remove</button>}
        </div>
      </div>
    </Layout>
  )
}
