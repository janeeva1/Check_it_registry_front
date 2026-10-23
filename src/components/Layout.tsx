import { ReactNode, useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import MobileTabBar from './MobileTabBar'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from './Toast'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

// The sidebar is pinned open on desktops (>= 1024px) and is a slide-in
// drawer on tablets and phones, where phones also get a bottom tab bar.
const DESKTOP = 1024
const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP

export function Layout({ children, requireAuth = false, allowedRoles }: LayoutProps) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop)
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError } = useToast()

  // Close the drawer after navigating on smaller screens
  useEffect(() => {
    if (!isDesktop()) setSidebarOpen(false)
  }, [location.pathname])

  // Moving across the desktop breakpoint (rotating a tablet, resizing)
  useEffect(() => {
    let wasDesktop = isDesktop()
    const onResize = () => {
      const now = isDesktop()
      if (now !== wasDesktop) { setSidebarOpen(now); wasDesktop = now }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const role = user?.role
    const isAdmin = role === 'admin' || role === 'super_admin'
    if (user && allowedRoles && !isAdmin && (!role || !allowedRoles.includes(role))) {
      showError('Access denied', 'You do not have permission to open this page')
      navigate('/dashboard')
      return
    }
    if (requireAuth && !user) {
      navigate('/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, requireAuth, allowedRoles])

  const handleLogout = () => {
    logout()
    showSuccess('Signed out')
    navigate('/')
  }

  return (
    <div className={user ? 'has-tabbar' : ''} style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <a href="#main" className="po-skip">Skip to content</a>
      {user && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      )}

      <div className={`main-content ${user && sidebarOpen ? 'main-content-with-sidebar' : ''}`}>
        <Navbar
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
        <main id="main" tabIndex={-1} className="px-3 py-4 p-md-4 p-xl-5" style={{ minHeight: 'calc(100vh - 64px)', outline: 'none' }}>
          {children}
        </main>
        <Footer compact={!!user} />
      </div>

      {user && <MobileTabBar role={user.role} onMenu={() => setSidebarOpen(true)} />}
    </div>
  )
}
