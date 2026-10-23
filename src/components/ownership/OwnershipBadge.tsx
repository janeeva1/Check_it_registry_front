import { ShieldCheck, ShieldQuestion, Clock, ShieldAlert } from 'lucide-react'
import type { OwnershipLevel } from '../../lib/apiClient'

const LEVELS: Record<OwnershipLevel, { label: string; short: string; tone: string; icon: typeof ShieldCheck; help: string }> = {
  verified_owner: {
    label: 'Verified owner', short: 'Verified', tone: 'success', icon: ShieldCheck,
    help: 'Our team checked proof that this person owns the item.',
  },
  proof_submitted: {
    label: 'Proof under review', short: 'In review', tone: 'info', icon: Clock,
    help: 'The owner sent proof of ownership. Our team is checking it.',
  },
  registered: {
    label: 'Registered', short: 'Registered', tone: 'neutral', icon: ShieldQuestion,
    help: 'Registered by the owner. No proof of ownership has been checked yet.',
  },
  disputed: {
    label: 'Ownership disputed', short: 'Disputed', tone: 'danger', icon: ShieldAlert,
    help: 'Someone else has claimed this item. Our team is reviewing both sides.',
  },
}

export function ownershipInfo(level?: string | null) {
  return LEVELS[(level as OwnershipLevel)] || LEVELS.registered
}

export default function OwnershipBadge({ level, compact = false }: { level?: string | null; compact?: boolean }) {
  const info = ownershipInfo(level)
  const Icon = info.icon
  return (
    <span className={`po-badge po-badge-${info.tone}`} title={info.help}>
      <Icon size={14} aria-hidden="true" />
      {compact ? info.short : info.label}
    </span>
  )
}
