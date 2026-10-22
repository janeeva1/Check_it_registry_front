import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Monitor, Headphones, Gamepad, Watch, Camera, Tv, Speaker, Package, Plus, Shield, Loader2, Car, Bike, Fan } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast, ToastContainer } from '../components/Toast'
import { apiClient } from '../lib/apiClient'

const DEVICE_CATEGORIES = [
  { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
  { value: 'tablet', label: 'Tablet', icon: Monitor },
  { value: 'laptop', label: 'Laptop', icon: Monitor },
  { value: 'headphones', label: 'Headphones', icon: Headphones },
  { value: 'earbuds', label: 'Earbuds', icon: Headphones },
  { value: 'speaker', label: 'Speaker', icon: Speaker },
  { value: 'smartwatch', label: 'Smartwatch/Watch', icon: Watch },
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'console', label: 'Gaming Console', icon: Gamepad },
  { value: 'tv', label: 'TV/Smart TV', icon: Tv },
  { value: 'vehicle', label: 'Car/Vehicle', icon: Car },
  { value: 'motorcycle', label: 'Motorcycle/Bike', icon: Bike },
  { value: 'appliance', label: 'Home Appliance (Fan, AC, Fridge)', icon: Fan },
  { value: 'other', label: 'Other (Type Manually)', icon: Package },
]

type FormData = {
  brand: string
  model: string
  imei: string
  serial: string
  category: string
  otherCategory: string
  color: string
  storage: string
  description: string
  notes: string
  purchaseDate: string
  estimatedValue: string
}

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

const getBrands = (cat: string) => BRAND_OPTIONS[cat] || ['Others']
const getModels = (cat: string, brand: string) => {
  if (!brand) return ['Others']
  const catModels = DEVICE_MODELS[cat]
  if (catModels && catModels[brand]) return catModels[brand]
  return ['Others']
}

const initialState: FormData = {
  brand: '', model: '', imei: '', serial: '', category: 'smartphone', otherCategory: '',
  color: '', storage: '', description: '', notes: '', purchaseDate: '', estimatedValue: '',
}

export default function DeviceRegistration() {
  const { user } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [form, setForm] = useState<FormData>(initialState)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const update = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const categoryToSend = form.category === 'other' && form.otherCategory.trim()
        ? form.otherCategory.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        : form.category
      const payload = {
        ...form,
        category: categoryToSend === 'other' ? 'others' : categoryToSend,
        brand: form.brand === 'Others' ? '' : form.brand,
        model: form.model === 'Others' ? '' : form.model,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        purchaseDate: form.purchaseDate || null,
        userId: user?.id,
      }
      await apiClient.devices.create(payload)
      showSuccess('Device registered successfully')
      setForm(initialState); setStep(1)
    } catch (err: any) {
      showError(err?.message || 'Registration failed')
    } finally { setSubmitting(false) }
  }

  return (
    <Layout requireAuth>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-header">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}>
                  <Plus size={24} className="text-white" />
                </div>
                <div>
                  <h1>Register a Device</h1>
                  <p>Add your device to the registry</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="modern-card p-4 p-md-5">
              <div className="d-flex justify-content-between mb-5">
                <div className="d-flex align-items-center gap-2" style={{ color: step >= 1 ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: step >= 1 ? 'var(--primary-600)' : 'var(--gray-200)', color: step >= 1 ? '#fff' : 'var(--text-secondary)' }}>1</div>
                  <span className="fw-medium">Category</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 2 ? 'var(--primary-600)' : 'var(--gray-200)', margin: '0 12px', alignSelf: 'center' }} />
                <div className="d-flex align-items-center gap-2" style={{ color: step >= 2 ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: step >= 2 ? 'var(--primary-600)' : 'var(--gray-200)', color: step >= 2 ? '#fff' : 'var(--text-secondary)' }}>2</div>
                  <span className="fw-medium">Details</span>
                </div>
                <div style={{ flex: 1, height: 2, background: step >= 3 ? 'var(--primary-600)' : 'var(--gray-200)', margin: '0 12px', alignSelf: 'center' }} />
                <div className="d-flex align-items-center gap-2" style={{ color: step >= 3 ? 'var(--primary-600)' : 'var(--text-secondary)' }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: step === 3 ? 'var(--primary-600)' : 'var(--gray-200)', color: step >= 3 ? '#fff' : 'var(--text-secondary)' }}>3</div>
                  <span className="fw-medium">Confirm</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h4 className="mb-4">What type of device are you registering?</h4>
                    <div className="row g-3">
                      {DEVICE_CATEGORIES.map(cat => {
                        const Icon = cat.icon
                        const active = form.category === cat.value
                        return (
                          <div className="col-6 col-md-4 col-lg-3" key={cat.value}>
                            <button type="button" onClick={() => update('category', cat.value)}
                              className={`d-flex flex-column align-items-center gap-2 w-100 p-4 rounded-3 border ${active ? 'border-primary' : ''}`}
                              style={{ background: active ? 'var(--primary-50)' : 'var(--gray-50)', transition: 'all 0.2s', cursor: 'pointer', borderColor: active ? 'var(--primary-500)' : 'var(--border-color)' }}>
                              <Icon size={32} style={{ color: active ? 'var(--primary-600)' : 'var(--text-secondary)' }} />
                              <span className="fw-medium text-center" style={{ fontSize: 12, color: active ? 'var(--primary-700)' : 'var(--text-primary)' }}>{cat.label}</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    {form.category === 'other' && (
                      <div className="mt-3">
                        <label className="form-label">Specify device type *</label>
                        <input className="modern-input" placeholder="e.g. Generator, Drone, CCTV, Power Bank, GPS Tracker" value={form.otherCategory} onChange={e => update('otherCategory', e.target.value)} />
                      </div>
                    )}
                    <div className="mt-4 text-end">
                      <button type="button" className="btn-gradient-primary" onClick={() => setStep(2)} disabled={form.category === 'other' && !form.otherCategory.trim()}>Next Step</button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h4 className="mb-4">Device Information</h4>
                    <div style={{fontSize:12,color:'var(--text-tertiary)',marginBottom:12}}><span style={{color:'red'}}>*</span> Required fields</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Brand *</label>
                        {form.category === 'other' ? (
                          <input className="modern-input" placeholder="Enter brand" value={form.brand} onChange={e => update('brand', e.target.value)} required />
                        ) : (
                          <select className="modern-select" value={form.brand} onChange={e => { update('brand', e.target.value); update('model', ''); }} required>
                            <option value="">Select brand</option>
                            {getBrands(form.category).map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        )}
                        {form.brand === 'Others' && (
                          <input className="modern-input mt-2" placeholder="Enter custom brand" value={form.brand === 'Others' ? '' : form.brand} onChange={e => update('brand', e.target.value)} />
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Model *</label>
                        {form.category === 'other' ? (
                          <input className="modern-input" placeholder="Enter model" value={form.model} onChange={e => update('model', e.target.value)} required />
                        ) : (
                          <select className="modern-select" value={form.model} onChange={e => update('model', e.target.value)} required disabled={!form.brand}>
                            <option value="">Select model</option>
                            {form.brand && getModels(form.category, form.brand).map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        )}
                        {form.model === 'Others' && (
                          <input className="modern-input mt-2" placeholder="Enter custom model" value="" onChange={e => update('model', e.target.value)} />
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">IMEI/Serial/ID <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <input className="modern-input" placeholder="Unique identifier (IMEI, Serial, VIN, etc.)" value={form.imei} onChange={e => update('imei', e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Serial Number <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <input className="modern-input" placeholder="Serial number" value={form.serial} onChange={e => update('serial', e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Color <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <input className="modern-input" placeholder="e.g. Space Gray" value={form.color} onChange={e => update('color', e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Storage <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <select className="modern-select" value={form.storage} onChange={e => update('storage', e.target.value)}>
                          <option value="">Select</option>
                          <option value="16GB">16 GB</option>
                          <option value="32GB">32 GB</option>
                          <option value="64GB">64 GB</option>
                          <option value="128GB">128 GB</option>
                          <option value="256GB">256 GB</option>
                          <option value="512GB">512 GB</option>
                          <option value="1TB">1 TB</option>
                          <option value="2TB">2 TB</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Estimated Value ($) <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <input type="number" className="modern-input" placeholder="0.00" value={form.estimatedValue} onChange={e => update('estimatedValue', e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Purchase Date <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <input type="date" className="modern-input" value={form.purchaseDate} onChange={e => update('purchaseDate', e.target.value)} />
                      </div>
                      {(form.category === 'other' || form.category === 'others') && (
                        <div className="col-12">
                          <label className="form-label">Description *</label>
                          <textarea className="modern-textarea" rows={2} placeholder="Describe your device (e.g. brand, model, physical characteristics, unique features)" value={form.description} onChange={e => update('description', e.target.value)} required />
                        </div>
                      )}
                      <div className="col-12">
                        <label className="form-label">Additional Notes <span style={{color:'var(--text-secondary)',fontSize:'0.85em'}}>(optional)</span></label>
                        <textarea className="modern-textarea" rows={3} placeholder="Any additional details..." value={form.notes} onChange={e => update('notes', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-4 d-flex justify-content-between">
                      <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                      <button type="button" className="btn-gradient-primary" onClick={() => {
                        if ((form.category === 'other' || form.category === 'others') && !form.description.trim()) {
                          showError('Description is required for this device type')
                          return
                        }
                        if (!form.brand || !form.model) {
                          showError('Brand and model are required')
                          return
                        }
                        setStep(3)
                      }}>Review & Confirm</button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <Shield size={24} className="text-success" />
                      <h4 className="mb-0">Confirm Registration</h4>
                    </div>
                    <div className="modern-card p-4" style={{ backgroundColor: 'var(--gray-50)' }}>
                      <div className="row g-3" style={{ fontSize: 14 }}>
                        <div className="col-md-6"><strong>Category:</strong> {form.category === 'other' ? (form.otherCategory || 'Other') : (DEVICE_CATEGORIES.find(c => c.value === form.category)?.label || form.category)}</div>
                        <div className="col-md-6"><strong>Brand:</strong> {form.brand}</div>
                        <div className="col-md-6"><strong>Model:</strong> {form.model}</div>
                        <div className="col-md-6"><strong>IMEI:</strong> {form.imei || '—'}</div>
                        <div className="col-md-6"><strong>Serial:</strong> {form.serial || '—'}</div>
                        <div className="col-md-6"><strong>Color:</strong> {form.color || '—'}</div>
                        <div className="col-md-6"><strong>Storage:</strong> {form.storage || '—'}</div>
                        <div className="col-md-6"><strong>Value:</strong> {form.estimatedValue ? `$${form.estimatedValue}` : '—'}</div>
                        <div className="col-md-6"><strong>Purchase Date:</strong> {form.purchaseDate || '—'}</div>
                        {(form.category === 'other' || form.category === 'others') && <div className="col-12"><strong>Description:</strong> {form.description || '—'}</div>}
                        <div className="col-12"><strong>Notes:</strong> {form.notes || '—'}</div>
                      </div>
                    </div>
                    <div className="mt-4 d-flex justify-content-between">
                      <button type="button" className="btn-ghost" onClick={() => setStep(2)}>Back</button>
                      <button type="submit" className="btn-gradient-primary d-flex align-items-center gap-2" disabled={submitting}>
                        {submitting ? <Loader2 size={18} className="spinner-border" /> : <Plus size={18} />}
                        {submitting ? 'Registering...' : 'Complete Registration'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
