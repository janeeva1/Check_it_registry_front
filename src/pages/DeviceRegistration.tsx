import { useEffect, useMemo, useState } from 'react'
import { Smartphone, Tablet, Laptop, Headphones, Gamepad2, Watch, Camera, Tv, Speaker, Package, Plus, Loader2, Car, Bike, Refrigerator, Gem, ArrowLeft, ArrowRight, Scale, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { apiClient, type ProofType } from '../lib/apiClient'
import ProofPicker, { type ProofSubmission } from '../components/ownership/ProofPicker'

type IdKind = 'imei' | 'serial' | 'vin' | 'description'

type Category = { value: string; label: string; icon: LucideIcon; id: IdKind; storage?: boolean }

// What people register, and which number identifies each kind of item
const DEVICE_CATEGORIES: Category[] = [
  { value: 'smartphone', label: 'Phone', icon: Smartphone, id: 'imei', storage: true },
  { value: 'tablet', label: 'Tablet', icon: Tablet, id: 'imei', storage: true },
  { value: 'laptop', label: 'Laptop', icon: Laptop, id: 'serial', storage: true },
  { value: 'smartwatch', label: 'Watch', icon: Watch, id: 'serial' },
  { value: 'headphones', label: 'Headphones', icon: Headphones, id: 'serial' },
  { value: 'earbuds', label: 'Earbuds', icon: Headphones, id: 'serial' },
  { value: 'speaker', label: 'Speaker', icon: Speaker, id: 'serial' },
  { value: 'camera', label: 'Camera', icon: Camera, id: 'serial' },
  { value: 'console', label: 'Game console', icon: Gamepad2, id: 'serial', storage: true },
  { value: 'tv', label: 'TV', icon: Tv, id: 'serial' },
  { value: 'appliance', label: 'Appliance', icon: Refrigerator, id: 'serial' },
  { value: 'vehicle', label: 'Car', icon: Car, id: 'vin' },
  { value: 'motorcycle', label: 'Motorcycle', icon: Bike, id: 'vin' },
  { value: 'jewelry', label: 'Jewellery', icon: Gem, id: 'description' },
  { value: 'other', label: 'Something else', icon: Package, id: 'description' },
]

const ID_HELP: Record<string, string> = {
  smartphone: 'Dial *#06# on the phone, or look in Settings → About. It is 15 digits.',
  tablet: 'Settings → About (cellular tablets only). No IMEI? Choose "Something else" and use the serial number.',
  laptop: 'On the sticker underneath, or Settings → About (Windows) / Apple menu → About This Mac.',
  smartwatch: 'Settings → About on the watch, or engraved on the back.',
  console: 'On the label on the back or bottom of the console.',
  vehicle: 'On the windscreen (driver side), the driver door frame, or your vehicle papers. 17 characters.',
  motorcycle: 'Stamped on the frame near the steering head, and on your papers. 17 characters.',
}
// The common types shown first; the rest sit behind "More types"
const MAIN_CATS = ['smartphone', 'laptop', 'tablet', 'smartwatch', 'vehicle', 'motorcycle', 'tv']

const DEFAULT_SERIAL_HELP = 'On a label on the back or bottom of the item, or on the box.'

const BRAND_OPTIONS: Record<string, string[]> = {
  smartphone: ['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'Nokia', 'Tecno', 'Infinix', 'Itel', 'Google', 'Motorola', 'Sony', 'Others'],
  tablet: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Lenovo', 'Amazon', 'Microsoft', 'Others'],
  laptop: ['Apple', 'Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'MSI', 'Microsoft', 'Toshiba', 'Others'],
  headphones: ['Apple', 'Sony', 'Bose', 'JBL', 'Beats', 'Sennheiser', 'Skullcandy', 'Anker', 'Others'],
  earbuds: ['Apple', 'Samsung', 'Sony', 'JBL', 'Xiaomi', 'Beats', 'Others'],
  speaker: ['JBL', 'Bose', 'Sony', 'Harman Kardon', 'Sonos', 'Others'],
  smartwatch: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei', 'Xiaomi', 'Amazfit', 'Others'],
  camera: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus', 'Others'],
  console: ['Sony', 'Microsoft', 'Nintendo', 'Others'],
  tv: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense', 'Panasonic', 'Others'],
  vehicle: ['Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Ford', 'Mercedes-Benz', 'BMW', 'Volkswagen', 'Audi', 'Lexus', 'Others'],
  motorcycle: ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Bajaj', 'TVS', 'Others'],
  appliance: ['LG', 'Samsung', 'Hisense', 'Panasonic', 'Nexus', 'Scanfrost', 'Others'],
  other: ['Others'],
}

const DEVICE_MODELS: Record<string, Record<string, string[]>> = {
  smartphone: {
    Apple: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE', 'Others'],
    Samsung: ['Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy A56', 'Galaxy A55', 'Galaxy A35', 'Galaxy Z Fold6', 'Galaxy Z Flip6', 'Others'],
    Xiaomi: ['Xiaomi 15', 'Xiaomi 14 Ultra', 'Xiaomi 14', 'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14', 'POCO X7 Pro', 'POCO X7', 'Others'],
    Redmi: ['Redmi Note 14', 'Redmi Note 13', 'Redmi 14C', 'Redmi A4', 'Others'],
    OnePlus: ['OnePlus 13', 'OnePlus 12', 'OnePlus 11', 'OnePlus Nord CE4', 'Others'],
    Oppo: ['Reno 13', 'Reno 12', 'A80', 'A60', 'Others'],
    Vivo: ['V50', 'V40', 'Y300', 'Y200', 'Others'],
    Realme: ['GT 7 Pro', 'Narzo 70', 'C75', 'Others'],
    Tecno: ['Camon 40', 'Spark 30', 'Pova 6', 'Others'],
    Infinix: ['Note 40 Pro', 'Hot 50 Pro', 'Smart 9', 'Others'],
    Google: ['Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 8a', 'Others'],
    Motorola: ['Edge 50 Pro', 'Razr 50', 'Moto G85', 'Others'],
    Huawei: ['Pura 70', 'Nova 12', 'Others'],
    Others: ['Others'],
  },
  tablet: {
    Apple: ['iPad Pro 13"', 'iPad Pro 11"', 'iPad Air', 'iPad', 'iPad mini', 'Others'],
    Samsung: ['Galaxy Tab S10', 'Galaxy Tab S9', 'Galaxy Tab A9+', 'Others'],
    Lenovo: ['Tab P12', 'Tab M11', 'Tab K11', 'Others'],
    Xiaomi: ['Pad 7', 'Redmi Pad Pro', 'Others'],
    Huawei: ['MatePad Pro', 'MatePad', 'Others'],
    Others: ['Others'],
  },
  laptop: {
    Apple: ['MacBook Air M4', 'MacBook Air M3', 'MacBook Pro M4', 'MacBook Pro M3', 'Others'],
    Dell: ['XPS 14', 'XPS 13', 'Inspiron 15', 'Latitude', 'Alienware', 'Others'],
    HP: ['Spectre x360', 'Envy', 'Pavilion', 'OmniBook', 'ProBook', 'Others'],
    Lenovo: ['ThinkPad X1 Carbon', 'Yoga', 'IdeaPad', 'Legion', 'Others'],
    Asus: ['ZenBook', 'Vivobook', 'ROG', 'TUF', 'Others'],
    Acer: ['Swift', 'Aspire', 'Nitro', 'Predator', 'Others'],
    MSI: ['Prestige', 'Katana', 'Raider', 'Others'],
    Microsoft: ['Surface Laptop', 'Surface Pro', 'Others'],
    Others: ['Others'],
  },
  smartwatch: {
    Apple: ['Apple Watch Series 10', 'Apple Watch Ultra 2', 'Apple Watch SE', 'Others'],
    Samsung: ['Galaxy Watch 7', 'Galaxy Watch Ultra', 'Galaxy Watch FE', 'Others'],
    Garmin: ['Fenix 8', 'Venu 3', 'Forerunner 965', 'Others'],
    Fitbit: ['Sense 2', 'Versa 4', 'Inspire 3', 'Others'],
    Huawei: ['Watch GT 5', 'Watch Ultimate', 'Others'],
    Xiaomi: ['Xiaomi Watch S4', 'Redmi Watch 5', 'Others'],
    Amazfit: ['Balance', 'T-Rex 3', 'Active 2', 'Others'],
    Others: ['Others'],
  },
  headphones: {
    Apple: ['AirPods Max', 'Beats Studio Pro', 'Others'],
    Sony: ['WH-1000XM6', 'WH-1000XM5', 'WF-1000XM5', 'Others'],
    Bose: ['QuietComfort Ultra', 'QuietComfort 45', 'Others'],
    JBL: ['Tune 770NC', 'Live 770NC', 'Others'],
    Sennheiser: ['Momentum 4', 'HD 660S2', 'Others'],
    Others: ['Others'],
  },
  earbuds: {
    Apple: ['AirPods Pro 2', 'AirPods 4', 'AirPods 3', 'Others'],
    Samsung: ['Galaxy Buds3 Pro', 'Galaxy Buds3', 'Others'],
    Sony: ['WF-1000XM5', 'LinkBuds S', 'Others'],
    JBL: ['Tune Buds', 'Vibe Beam', 'Others'],
    Xiaomi: ['Redmi Buds 6 Pro', 'Bud 5 Pro', 'Others'],
    Beats: ['Beats Fit Pro', 'Beats Studio Buds+', 'Others'],
    Others: ['Others'],
  },
  speaker: {
    JBL: ['Charge 5', 'Flip 6', 'Xtreme 4', 'PartyBox', 'Others'],
    Bose: ['SoundLink Max', 'SoundLink Flex', 'Others'],
    Sony: ['SRS-XG300', 'ULT Field 7', 'Others'],
    Sonos: ['Roam 2', 'Era 100', 'Move 2', 'Others'],
    Others: ['Others'],
  },
  camera: {
    Canon: ['EOS R5', 'EOS R6 Mark II', 'EOS 90D', 'PowerShot', 'Others'],
    Nikon: ['Z8', 'Z6 III', 'D850', 'Others'],
    Sony: ['A7RV', 'A7C II', 'FX3', 'Others'],
    Fujifilm: ['X-T5', 'X100VI', 'GFX100', 'Others'],
    Others: ['Others'],
  },
  console: {
    Sony: ['PlayStation 5 Pro', 'PlayStation 5', 'PlayStation 4 Pro', 'Others'],
    Microsoft: ['Xbox Series X', 'Xbox Series S', 'Others'],
    Nintendo: ['Switch 2', 'Switch OLED', 'Switch Lite', 'Others'],
    Others: ['Others'],
  },
  tv: {
    Samsung: ['QN90D', 'QN85D', 'CU8000', 'Crystal UHD', 'Others'],
    LG: ['OLED C4', 'OLED G4', 'QNED80', 'Others'],
    Sony: ['Bravia 9', 'Bravia 7', 'Bravia 3', 'Others'],
    TCL: ['QM8', 'Q6', 'Others'],
    Hisense: ['U8N', 'U7N', 'Others'],
    Others: ['Others'],
  },
  vehicle: {
    Toyota: ['Camry', 'Corolla', 'Hilux', 'Land Cruiser', 'RAV4', 'Others'],
    Honda: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Others'],
    Nissan: ['Altima', 'Pathfinder', 'X-Trail', 'Others'],
    Hyundai: ['Elantra', 'Tucson', 'Santa Fe', 'Others'],
    Kia: ['Sportage', 'Sorento', 'Rio', 'Others'],
    Ford: ['F-150', 'Explorer', 'Focus', 'Others'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLE', 'Others'],
    BMW: ['3 Series', '5 Series', 'X5', 'Others'],
    Lexus: ['RX', 'ES', 'NX', 'Others'],
    Others: ['Others'],
  },
  motorcycle: {
    Honda: ['CB500X', 'CBR600RR', 'Africa Twin', 'Others'],
    Yamaha: ['YZF-R7', 'MT-09', 'Tenere 700', 'Others'],
    Suzuki: ['GSX-R750', 'V-Strom 650', 'Others'],
    Kawasaki: ['Ninja 650', 'Z900', 'Versys 650', 'Others'],
    Bajaj: ['Pulsar NS200', 'Dominar 400', 'Others'],
    TVS: ['Apache RTR 160', 'NTorq', 'Others'],
    Others: ['Others'],
  },
  appliance: {
    LG: ['Refrigerator', 'Washing Machine', 'Air Conditioner', 'Microwave', 'Others'],
    Samsung: ['Refrigerator', 'Washing Machine', 'Air Conditioner', 'Others'],
    Hisense: ['Refrigerator', 'Air Conditioner', 'Freezer', 'Others'],
    Panasonic: ['Microwave', 'Air Conditioner', 'Others'],
    Nexus: ['Gas Cooker', 'Fan', 'Blender', 'Others'],
    Scanfrost: ['Gas Cooker', 'Refrigerator', 'Freezer', 'Others'],
    Others: ['Others'],
  },
  other: {
    Others: ['Others'],
  },
}

const getBrands = (cat: string) => BRAND_OPTIONS[cat] || []
const getModels = (cat: string, brand: string) => (DEVICE_MODELS[cat] && DEVICE_MODELS[cat][brand]) || []

function luhnOk(imei: string) {
  if (!/^\d{15}$/.test(imei)) return false
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let d = Number(imei[i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return (10 - (sum % 10)) % 10 === Number(imei[14])
}

type Form = {
  category: string; otherCategory: string
  brand: string; brandCustom: string; model: string; modelCustom: string
  imei: string; serial: string; vin: string; licensePlate: string; engineNumber: string; year: string
  certificateNumber: string; material: string
  color: string; storage: string; estimatedValue: string; description: string; notes: string
}

const initial: Form = {
  category: '', otherCategory: '', brand: '', brandCustom: '', model: '', modelCustom: '',
  imei: '', serial: '', vin: '', licensePlate: '', engineNumber: '', year: '',
  certificateNumber: '', material: '', color: '', storage: '', estimatedValue: '', description: '', notes: '',
}

const cleanId = (v: string) => v.replace(/\s+/g, '').toUpperCase()
const STEPS = ['Type', 'Details', 'Proof', 'Confirm']

export default function DeviceRegistration() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [form, setForm] = useState<Form>(initial)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [taken, setTaken] = useState<string | null>(null)
  const [proofTypes, setProofTypes] = useState<ProofType[]>([])
  const [proof, setProof] = useState<ProofSubmission | null>(null)
  const [showAllCats, setShowAllCats] = useState(false)
  const [moreDetails, setMoreDetails] = useState(false)

  const cat = DEVICE_CATEGORIES.find((c) => c.value === form.category)
  const set = (k: keyof Form, v: string) => { setForm((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); setTaken(null) }
  const brands = getBrands(form.category)
  const models = getModels(form.category, form.brand)
  const brand = form.brand === 'Others' ? form.brandCustom.trim() : form.brand.trim()
  const model = form.model === 'Others' || !models.length ? (form.model === 'Others' ? form.modelCustom.trim() : form.model.trim()) : form.model.trim()

  useEffect(() => {
    if (!form.category) return
    apiClient.ownership.proofTypes(form.category).then((r) => setProofTypes(r.types || [])).catch(() => setProofTypes([]))
  }, [form.category])

  const identifier = useMemo(() => {
    if (!cat) return ''
    if (cat.id === 'imei') return cleanId(form.imei)
    if (cat.id === 'vin') return cleanId(form.vin)
    if (cat.id === 'serial') return cleanId(form.serial)
    return cleanId(form.certificateNumber || form.serial)
  }, [cat, form])

  const validateDetails = () => {
    const e: Record<string, string> = {}
    if (!brand) e.brand = 'Enter the brand'
    if (!model) e.model = 'Enter the model'
    if (cat?.id === 'imei') {
      const v = cleanId(form.imei)
      if (!v) e.imei = 'The IMEI is needed so anyone can check this phone'
      else if (!/^\d{15}$/.test(v)) e.imei = 'An IMEI is exactly 15 digits'
      else if (!luhnOk(v)) e.imei = "That IMEI doesn't look right — check each digit"
    }
    if (cat?.id === 'serial') {
      const v = cleanId(form.serial)
      if (!v) e.serial = 'The serial number is needed so anyone can check this item'
      else if (!/^[A-Z0-9][A-Z0-9-]{3,29}$/.test(v)) e.serial = 'Use 4–30 letters and numbers'
    }
    if (cat?.id === 'vin') {
      const v = cleanId(form.vin)
      if (!v) e.vin = 'The VIN (chassis number) is needed so anyone can check this vehicle'
      else if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) e.vin = 'A VIN is 17 letters and numbers (never I, O or Q)'
      if (form.year && !/^(19|20)\d{2}$/.test(form.year)) e.year = 'Enter a 4-digit year'
    }
    if (cat?.id === 'description' && form.description.trim().length < 10) e.description = 'Describe it so it can be recognised (at least 10 characters)'
    if (form.category === 'other' && !form.otherCategory.trim()) e.otherCategory = 'Say what kind of item it is'
    if (form.serial && cat?.id !== 'serial' && !/^[A-Z0-9][A-Z0-9-]{3,29}$/.test(cleanId(form.serial))) e.serial = 'Use 4–30 letters and numbers'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!cat) return
    setSubmitting(true)
    setTaken(null)
    try {
      const payload: Record<string, unknown> = {
        category: form.category === 'other' ? 'others' : form.category,
        brand, model,
        imei: cat.id === 'imei' ? cleanId(form.imei) : undefined,
        serial: form.serial ? cleanId(form.serial) : undefined,
        vin: cat.id === 'vin' ? cleanId(form.vin) : undefined,
        licensePlate: form.licensePlate.trim() || undefined,
        engineNumber: form.engineNumber.trim() || undefined,
        year: form.year || undefined,
        certificateNumber: form.certificateNumber ? cleanId(form.certificateNumber) : undefined,
        material: form.material.trim() || undefined,
        color: form.color.trim() || undefined,
        storageCapacity: form.storage || undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        description: [form.category === 'other' ? form.otherCategory.trim() : '', form.description.trim()].filter(Boolean).join(': ') || undefined,
        notes: form.notes.trim() || undefined,
      }
      const created = await apiClient.devices.create(payload)
      const deviceId = created?.id || created?.data?.id
      if (proof && deviceId) {
        try {
          await apiClient.ownership.submitProof(deviceId, proof)
        } catch (e: any) {
          showError('Item registered, but the proof did not upload', e?.message || 'You can add it from the item page.')
        }
      }
      showSuccess('Item registered', 'Check your email to confirm it.')
      navigate(deviceId ? `/device/${deviceId}?new=1` : '/my-devices')
    } catch (err: any) {
      if (err?.status === 409 && err?.data?.canClaim) {
        setTaken(identifier)
        setStep(2)
      } else {
        showError('Could not register', err?.message)
        if (/IMEI/i.test(err?.message || '')) { setErrors({ imei: err.message }); setStep(2) }
        else if (/VIN/i.test(err?.message || '')) { setErrors({ vin: err.message }); setStep(2) }
        else if (/serial/i.test(err?.message || '')) { setErrors({ serial: err.message }); setStep(2) }
      }
    } finally { setSubmitting(false) }
  }

  const field = (k: keyof Form, label: string, opts: { required?: boolean; help?: string; placeholder?: string; mono?: boolean; inputMode?: 'numeric' | 'text'; maxLength?: number; span?: boolean; upper?: boolean } = {}) => (
    <div className={`po-field ${opts.span ? 'po-span-2' : ''}`}>
      <label className="po-label" htmlFor={`reg-${k}`}>{label}{opts.required ? '' : <span className="po-optional"> (optional)</span>}</label>
      <input id={`reg-${k}`} className={`modern-input ${opts.mono ? 'po-mono' : ''} ${errors[k] ? 'is-invalid' : ''}`} value={form[k]}
        inputMode={opts.inputMode} maxLength={opts.maxLength} placeholder={opts.placeholder} autoComplete="off"
        aria-invalid={!!errors[k]} aria-describedby={`reg-${k}-help`}
        onChange={(e) => set(k, opts.upper ? e.target.value.toUpperCase() : e.target.value)} />
      <p id={`reg-${k}-help`} className={errors[k] ? 'po-error' : 'po-help'}>{errors[k] || opts.help || ''}</p>
    </div>
  )

  return (
    <Layout requireAuth>
      <div className="po-page po-narrow">
        <h1 className="po-hello">Register an item</h1>

        <ol className="po-stepper" aria-label="Registration steps">
          {STEPS.map((s, i) => (
            <li key={s} className={step > i + 1 ? 'is-done' : step === i + 1 ? 'is-current' : ''} aria-current={step === i + 1 ? 'step' : undefined}>
              <span className="po-step-dot">{i + 1}</span><span className="po-step-label">{s}</span>
            </li>
          ))}
        </ol>

        <section className="po-card po-reg">
          {step === 1 && (
            <>
              <h2 className="po-panel-title">What are you registering?</h2>
              <div className="po-cat-grid" role="radiogroup" aria-label="Item type">
                {(showAllCats ? DEVICE_CATEGORIES : DEVICE_CATEGORIES.filter((c) => MAIN_CATS.includes(c.value))).map((c) => {
                  const Icon = c.icon
                  const active = form.category === c.value
                  return (
                    <button key={c.value} type="button" role="radio" aria-checked={active} className={`po-cat ${active ? 'is-selected' : ''}`}
                      onClick={() => { setForm({ ...initial, category: c.value }); setErrors({}); setProof(null); setStep(2) }}>
                      <Icon size={26} aria-hidden="true" />
                      <span>{c.label}</span>
                    </button>
                  )
                })}
                {!showAllCats && (
                  <button type="button" className="po-cat po-cat-more" onClick={() => setShowAllCats(true)}>
                    <Package size={26} aria-hidden="true" />
                    <span>More types</span>
                  </button>
                )}
              </div>
            </>
          )}

          {step === 2 && cat && (
            <>
              <div className="po-panel-head">
                <h2 className="po-panel-title"><cat.icon size={20} aria-hidden="true" /> {cat.label} details</h2>
                <button type="button" className="po-btn po-btn-ghost po-btn-sm" onClick={() => setStep(1)}>Change type</button>
              </div>

              {taken && (
                <div className="po-callout po-callout-warning" role="alert">
                  <Scale size={20} aria-hidden="true" />
                  <div>
                    <strong>This item is already registered to another account.</strong>
                    <p>If it's yours, you can claim it with proof — our team reviews both sides. If you bought it second-hand, ask the seller to transfer it to you instead.</p>
                    <div className="po-actions po-actions-start">
                      <Link to={`/claim?identifier=${encodeURIComponent(taken)}`} className="po-btn po-btn-primary po-btn-sm">Claim this item</Link>
                      <Link to="/transfer?tab=receive" className="po-btn po-btn-secondary po-btn-sm">I have a transfer code</Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="po-form-grid">
                {form.category === 'other' && field('otherCategory', 'What kind of item?', { required: true, placeholder: 'e.g. Generator, Drone, CCTV camera', span: true })}

                <div className="po-field">
                  <label className="po-label" htmlFor="reg-brand">Brand</label>
                  {brands.length ? (
                    <select id="reg-brand" className={`modern-select ${errors.brand ? 'is-invalid' : ''}`} value={form.brand} onChange={(e) => { set('brand', e.target.value); set('model', '') }}>
                      <option value="">Choose brand</option>
                      {brands.map((b) => <option key={b} value={b}>{b === 'Others' ? 'Another brand' : b}</option>)}
                    </select>
                  ) : (
                    <input id="reg-brand" className={`modern-input ${errors.brand ? 'is-invalid' : ''}`} value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder={form.category === 'jewelry' ? 'Maker or jeweller' : 'Brand'} />
                  )}
                  {form.brand === 'Others' && <input aria-label="Brand name" className="modern-input mt-2" value={form.brandCustom} onChange={(e) => set('brandCustom', e.target.value)} placeholder="Type the brand" />}
                  <p className={errors.brand ? 'po-error' : 'po-help'}>{errors.brand || ''}</p>
                </div>

                <div className="po-field">
                  <label className="po-label" htmlFor="reg-model">Model</label>
                  {models.length && form.brand !== 'Others' ? (
                    <select id="reg-model" className={`modern-select ${errors.model ? 'is-invalid' : ''}`} value={form.model} onChange={(e) => set('model', e.target.value)} disabled={!form.brand}>
                      <option value="">{form.brand ? 'Choose model' : 'Choose a brand first'}</option>
                      {models.map((m) => <option key={m} value={m}>{m === 'Others' ? 'Another model' : m}</option>)}
                    </select>
                  ) : (
                    <input id="reg-model" className={`modern-input ${errors.model ? 'is-invalid' : ''}`} value={form.model === 'Others' ? '' : form.model} onChange={(e) => set('model', e.target.value)} placeholder={form.category === 'jewelry' ? 'e.g. Gold necklace' : 'Model'} />
                  )}
                  {form.model === 'Others' && models.length > 0 && <input aria-label="Model name" className="modern-input mt-2" value={form.modelCustom} onChange={(e) => set('modelCustom', e.target.value)} placeholder="Type the model" />}
                  <p className={errors.model ? 'po-error' : 'po-help'}>{errors.model || ''}</p>
                </div>

                {cat.id === 'imei' && field('imei', 'IMEI', { required: true, mono: true, inputMode: 'numeric', maxLength: 17, placeholder: '15 digits', help: ID_HELP[form.category] })}
                {cat.id === 'vin' && field('vin', 'VIN (chassis number)', { required: true, mono: true, upper: true, maxLength: 17, placeholder: '17 characters', help: ID_HELP[form.category] })}
                {cat.id === 'serial' && field('serial', 'Serial number', { required: true, mono: true, upper: true, maxLength: 30, help: ID_HELP[form.category] || DEFAULT_SERIAL_HELP })}
                {cat.id === 'vin' && field('licensePlate', 'Plate number', { upper: true, maxLength: 10, placeholder: 'e.g. LND 123 AB' })}

                {cat.id === 'description' && <>
                  <div className="po-field po-span-2">
                    <label className="po-label" htmlFor="reg-description">Description</label>
                    <textarea id="reg-description" className={`modern-textarea ${errors.description ? 'is-invalid' : ''}`} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
                      placeholder={form.category === 'jewelry' ? 'e.g. 18k gold ring, small sapphire, "A&T 2019" engraved inside' : 'Marks, engravings, size — anything that makes it recognisable'} />
                    <p className={errors.description ? 'po-error' : 'po-help'}>{errors.description || 'Engravings, marks and sizes help prove it is yours.'}</p>
                  </div>
                  {form.category === 'jewelry'
                    ? <>{field('certificateNumber', 'Certificate / appraisal number', { mono: true, upper: true, maxLength: 20 })}{field('material', 'Material', { placeholder: 'e.g. 18k gold' })}</>
                    : field('serial', 'Serial number', { mono: true, upper: true, maxLength: 30, help: DEFAULT_SERIAL_HELP })}
                </>}

              </div>

              {!moreDetails ? (
                <button type="button" className="po-btn po-btn-ghost po-btn-sm po-more-toggle" onClick={() => setMoreDetails(true)}>
                  <Plus size={16} aria-hidden="true" /> Add more details (optional)
                </button>
              ) : (
              <div className="po-form-grid">
                {cat.id === 'imei' && field('serial', 'Serial number', { mono: true, upper: true, maxLength: 30 })}
                {cat.id === 'vin' && field('engineNumber', 'Engine number', { mono: true, upper: true, maxLength: 50 })}
                {cat.id === 'vin' && field('year', 'Year', { inputMode: 'numeric', maxLength: 4, placeholder: 'e.g. 2018' })}
                {field('color', 'Colour', { placeholder: 'e.g. Black' })}
                {cat.storage && (
                  <div className="po-field">
                    <label className="po-label" htmlFor="reg-storage">Storage<span className="po-optional"> (optional)</span></label>
                    <select id="reg-storage" className="modern-select" value={form.storage} onChange={(e) => set('storage', e.target.value)}>
                      <option value="">Choose</option>
                      {['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map((s) => <option key={s} value={s}>{s.replace('GB', ' GB').replace('TB', ' TB')}</option>)}
                    </select>
                    <p className="po-help" />
                  </div>
                )}
                <div className="po-field">
                  <label className="po-label" htmlFor="reg-value">Estimated value<span className="po-optional"> (optional)</span></label>
                  <div className="po-input-prefix"><span aria-hidden="true">₦</span>
                    <input id="reg-value" className="modern-input" inputMode="numeric" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
                  </div>
                  <p className="po-help" />
                </div>
              </div>
              )}

              <div className="po-actions po-actions-between">
                <button type="button" className="po-btn po-btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden="true" /> Back</button>
                <button type="button" className="po-btn po-btn-primary" onClick={() => { if (validateDetails()) setStep(3) }}>Next <ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </>
          )}

          {step === 3 && cat && (
            <>
              <h2 className="po-panel-title"><ShieldCheck size={20} aria-hidden="true" /> Add proof of ownership <span className="po-optional">(recommended)</span></h2>
              <p className="po-muted">Our team checks it and marks you as the <strong>verified owner</strong>. Buyers trust verified items, and only verified owners can sell on the marketplace. You can also add it later.</p>
              {proof ? (
                <div className="po-callout po-callout-success">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <div>
                    <strong>{proofTypes.find((t) => t.key === proof.proofType)?.label || 'Proof'} attached</strong>
                    <p>{proof.file.name} will be sent with the registration.</p>
                    <button type="button" className="po-btn po-btn-ghost po-btn-sm" onClick={() => setProof(null)}>Use a different file</button>
                  </div>
                </div>
              ) : proofTypes.length > 0 ? (
                <ProofPicker types={proofTypes} submitLabel="Attach and continue" onSubmit={(p) => { setProof(p); setStep(4) }} />
              ) : <p className="po-muted">Loading proof options…</p>}
              <div className="po-actions po-actions-between">
                <button type="button" className="po-btn po-btn-secondary" onClick={() => setStep(2)}><ArrowLeft size={16} aria-hidden="true" /> Back</button>
                <button type="button" className="po-btn po-btn-ghost" onClick={() => setStep(4)}>{proof ? 'Continue' : 'Skip for now'} <ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </>
          )}

          {step === 4 && cat && (
            <>
              <h2 className="po-panel-title">Check and register</h2>
              <dl className="po-dl">
                <div><dt>Type</dt><dd>{form.category === 'other' ? form.otherCategory : cat.label}</dd></div>
                <div><dt>Item</dt><dd>{brand} {model}</dd></div>
                {form.imei && <div><dt>IMEI</dt><dd className="po-mono">{cleanId(form.imei)}</dd></div>}
                {form.vin && <div><dt>VIN</dt><dd className="po-mono">{cleanId(form.vin)}</dd></div>}
                {form.serial && <div><dt>Serial</dt><dd className="po-mono">{cleanId(form.serial)}</dd></div>}
                {form.licensePlate && <div><dt>Plate</dt><dd>{form.licensePlate}</dd></div>}
                {form.certificateNumber && <div><dt>Certificate</dt><dd className="po-mono">{cleanId(form.certificateNumber)}</dd></div>}
                {form.color && <div><dt>Colour</dt><dd>{form.color}</dd></div>}
                {form.storage && <div><dt>Storage</dt><dd>{form.storage}</dd></div>}
                {form.estimatedValue && <div><dt>Value</dt><dd>₦{Number(form.estimatedValue).toLocaleString('en-NG')}</dd></div>}
                <div><dt>Proof</dt><dd>{proof ? proofTypes.find((t) => t.key === proof.proofType)?.label : 'Not added — you can add it later'}</dd></div>
              </dl>
              {form.description && <p className="po-muted">{form.description}</p>}
              <div className="po-field mt-3">
                <label className="po-label" htmlFor="reg-notes">Private notes<span className="po-optional"> (optional, only you see these)</span></label>
                <textarea id="reg-notes" className="modern-textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
              <p className="po-help">By registering you confirm this item is yours. False registrations are logged.</p>
              <div className="po-actions po-actions-between">
                <button type="button" className="po-btn po-btn-secondary" onClick={() => setStep(3)}><ArrowLeft size={16} aria-hidden="true" /> Back</button>
                <button type="button" className="po-btn po-btn-primary" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="po-spin" aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                  {submitting ? 'Registering…' : 'Register item'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  )
}
