// Bottom navigation for phones: the four things each role does most, plus
// "Menu" for everything else. Hidden on tablets and desktops (CSS).
import { NavLink } from 'react-router-dom'
import { useModules, isMarketplacePath } from '../contexts/ModulesContext'
import { Home, Search, Plus, Smartphone, Menu, Store, FileText, Bell, ShieldCheck, Users } from 'lucide-react'

type Tab = { to: string; label: string; icon: typeof Home; main?: boolean }

function tabsFor(role?: string): Tab[] {
  if (role === 'admin' || role === 'super_admin') return [
    { to: '/admin', label: 'Home', icon: Home },
    { to: '/admin/ownership-review', label: 'Review', icon: ShieldCheck },
    { to: '/admin/device-management', label: 'Items', icon: Smartphone },
    { to: '/user-management', label: 'Users', icon: Users },
  ]
  if (role === 'lea') return [
    { to: '/lea', label: 'Home', icon: Home },
    { to: '/lea/device-search', label: 'Search', icon: Search },
    { to: '/lea/cases', label: 'Cases', icon: FileText },
    { to: '/lea/alerts', label: 'Alerts', icon: Bell },
  ]
  if (role === 'business') return [
    { to: '/business', label: 'Home', icon: Home },
    { to: '/device-check', label: 'Check', icon: Search },
    { to: '/register-device', label: 'Register', icon: Plus, main: true },
    { to: '/business/my-listings', label: 'Listings', icon: Store },
  ]
  return [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/device-check', label: 'Check', icon: Search },
    { to: '/register-device', label: 'Register', icon: Plus, main: true },
    { to: '/my-devices', label: 'My items', icon: Smartphone },
  ]
}

export default function MobileTabBar({ role, onMenu }: { role?: string; onMenu: () => void }) {
  const { visible } = useModules()
  const showMarket = visible('marketplace')
  // While the marketplace is off, a business's "Listings" tab becomes "My items"
  const tabs = tabsFor(role).map((t) => (!showMarket && isMarketplacePath(t.to) ? { ...t, to: '/my-devices', label: 'My items' } : t))
  return (
    <nav className="po-tabbar" aria-label="Main">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/admin' || t.to === '/lea' || t.to === '/business'}
          className={({ isActive }) => `${t.main ? 'po-tab-main' : ''} ${isActive ? 'is-active' : ''}`}>
          {t.main ? <span className="po-tab-plus"><t.icon size={22} aria-hidden="true" /></span> : <t.icon size={22} aria-hidden="true" />}
          <span>{t.label}</span>
        </NavLink>
      ))}
      <button type="button" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} aria-hidden="true" />
        <span>Menu</span>
      </button>
    </nav>
  )
}
