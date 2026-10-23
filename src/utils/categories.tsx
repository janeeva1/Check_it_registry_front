// One place for how item categories are named and drawn across the app.
// The server stores: mobile_phone, computer, smart_watch, vehicle,
// electronics, jewelry, others. Older records and forms may use the
// app's own names (smartphone, laptop ...), so both are handled.
import { Smartphone, Laptop, Watch, Car, Headphones, Gem, Package, type LucideIcon } from 'lucide-react'

type CategoryInfo = { label: string; icon: LucideIcon; identifier: string }

const STORED: Record<string, CategoryInfo> = {
  mobile_phone: { label: 'Phone / tablet', icon: Smartphone, identifier: 'IMEI' },
  computer: { label: 'Laptop / computer', icon: Laptop, identifier: 'Serial number' },
  smart_watch: { label: 'Watch', icon: Watch, identifier: 'Serial number' },
  vehicle: { label: 'Vehicle', icon: Car, identifier: 'VIN (chassis number)' },
  electronics: { label: 'Electronics', icon: Headphones, identifier: 'Serial number' },
  jewelry: { label: 'Jewellery', icon: Gem, identifier: 'Certificate number' },
  others: { label: 'Other item', icon: Package, identifier: 'Serial number' },
}

const ALIASES: Record<string, string> = {
  smartphone: 'mobile_phone', phone: 'mobile_phone', tablet: 'mobile_phone',
  laptop: 'computer', desktop: 'computer',
  smartwatch: 'smart_watch', watch: 'smart_watch',
  car: 'vehicle', motorcycle: 'vehicle',
  headphones: 'electronics', earbuds: 'electronics', speaker: 'electronics', camera: 'electronics',
  console: 'electronics', tv: 'electronics', appliance: 'electronics',
  jewellery: 'jewelry', other: 'others',
}

export function storedCategory(category?: string | null): string {
  const key = String(category || '').toLowerCase().trim()
  return STORED[key] ? key : ALIASES[key] || 'others'
}

export function categoryInfo(category?: string | null): CategoryInfo {
  return STORED[storedCategory(category)]
}

export const categoryLabel = (category?: string | null) => categoryInfo(category).label

export function CategoryIcon({ category, size = 20, className, style }: { category?: string | null; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = categoryInfo(category).icon
  return <Icon size={size} className={className} style={style} aria-hidden="true" />
}

// The main number that identifies an item, with its name
export function primaryIdentifier(d: { category?: string | null; imei?: string | null; serial?: string | null; vin?: string | null; certificate_number?: string | null; license_plate?: string | null }) {
  const cat = storedCategory(d.category)
  if (cat === 'vehicle' && d.vin) return { label: 'VIN', value: d.vin }
  if (cat === 'mobile_phone' && d.imei) return { label: 'IMEI', value: d.imei }
  if (cat === 'jewelry' && d.certificate_number) return { label: 'Certificate', value: d.certificate_number }
  if (d.serial) return { label: 'Serial', value: d.serial }
  if (d.imei) return { label: 'IMEI', value: d.imei }
  if (d.vin) return { label: 'VIN', value: d.vin }
  return null
}

export const formatNaira = (n?: number | string | null) => {
  const v = Number(n)
  return n === null || n === undefined || n === '' || Number.isNaN(v) ? '—' : `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}
