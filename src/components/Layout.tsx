import { ReactNode, useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from './Toast'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

export function Layout({ children, requireAuth = false, allowedRoles }: LayoutProps) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError } = useToast()

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  useEffect(() => {
    // Check role permissions
    const role = user?.role
    const isSuperAdmin = role === 'admin' || role === 'super_admin'
    // If a page specifies allowedRoles, and user is present but not super admin,
    // then deny access when role is missing or not included.
    if (user && allowedRoles && !isSuperAdmin && (!(role) || !allowedRoles.includes(role))) {
      showError('Access Denied', 'You do not have permission to access this page')
      navigate('/dashboard')
      return
    }
    
    // Check if auth is required but user is not logged in
    if (requireAuth && !user) {
      navigate('/login')
      return
    }
  }, [user, requireAuth, allowedRoles])

  const handleLogout = () => {
    logout()
    showSuccess('Logged Out', 'You have been successfully logged out')
    navigate('/')
  }



  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Sidebar */}
      {user && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          user={user} 
        />
      )}
      
      {/* Main Content */}
      <div className={`main-content ${user && sidebarOpen ? 'main-content-with-sidebar' : ''}`}>
        <Navbar 
          user={user} 
          onLogout={handleLogout}
          onMenuClick={() => {
            setSidebarOpen(!sidebarOpen);
          }}
          sidebarOpen={sidebarOpen}
        />
        <main className="p-3 p-md-4 p-lg-5" style={{ minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}