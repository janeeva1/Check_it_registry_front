// Which parts of the app are switched on (Admin -> Modules & payments).
// Admins always see every part so they can prepare it before switching it on.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

type Modules = { marketplace: boolean }
type Ctx = { modules: Modules; loaded: boolean; isAdmin: boolean; visible: (m: keyof Modules) => boolean; refresh: () => void }

const API = import.meta.env.VITE_API_URL || '/api'
const ModulesContext = createContext<Ctx>({ modules: { marketplace: false }, loaded: false, isAdmin: false, visible: () => false, refresh: () => {} })

// Pages and links that belong to the marketplace
export const MARKETPLACE_PATHS = ['/marketplace', '/marketplace-inbox', '/orders', '/seller/orders', '/business/my-listings', '/cart', '/checkout']
export const isMarketplacePath = (p: string) => MARKETPLACE_PATHS.some((m) => p === m || p.startsWith(m + '/') || p.startsWith(m + '?'))

export function ModulesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [modules, setModules] = useState<Modules>({ marketplace: false })
  const [loaded, setLoaded] = useState(false)
  const refresh = useCallback(() => {
    fetch(`${API}/modules`).then((r) => r.json()).then((m) => setModules({ marketplace: !!m?.marketplace })).catch(() => {}).finally(() => setLoaded(true))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  const isAdmin = ['admin', 'super_admin'].includes((user as any)?.role || '')
  const visible = (m: keyof Modules) => !!modules[m] || isAdmin
  return <ModulesContext.Provider value={{ modules, loaded, isAdmin, visible, refresh }}>{children}</ModulesContext.Provider>
}

export const useModules = () => useContext(ModulesContext)
