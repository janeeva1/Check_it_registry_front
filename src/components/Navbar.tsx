import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Shield,
  Search,
  Store,
  Flag,
  ShoppingCart
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_image_url?: string;
}

interface NavbarProps {
  user?: UserData | null;
  onLogout?: () => void;
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

const NAV_LINKS = [
  { path: '/device-check', label: 'Verify Device', icon: Search },
  { path: '/marketplace/browse', label: 'Marketplace', icon: Store },
  { path: '/found-device', label: 'Report Found', icon: Flag },
];

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onMenuClick, sidebarOpen }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { itemCount } = useCart();

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    onLogout?.();
  };

  return (
    <nav
      className={`navbar-custom fixed-top ${user && sidebarOpen ? 'with-sidebar' : ''}`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="d-flex align-items-center justify-content-between w-100 h-100 px-3 px-md-4">
        {/* Left: sidebar toggle + logo */}
        <div className="d-flex align-items-center gap-2">
          {user ? (
            <button
              onClick={() => onMenuClick?.()}
              className="nav-action-btn d-none d-md-flex"
              title={sidebarOpen ? 'Close Menu' : 'Open Menu'}
              type="button"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="nav-action-btn d-lg-none"
              title={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              type="button"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/logo1.png" alt="Prove Ownership" style={{ height: '28px', objectFit: 'contain' }} />
            <span className="fw-bold d-none d-sm-inline" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>Prove Ownership</span>
          </Link>
        </div>

        {/* Center: Desktop nav links - ALWAYS visible for ALL users */}
        <div className="d-none d-lg-flex align-items-center gap-1">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `custom-nav-link text-decoration-none d-flex align-items-center gap-2 ${isActive ? 'custom-nav-link-active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <link.icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right: cart + dark mode + user menu / auth buttons */}
        <div className="d-flex align-items-center gap-2">
          <Link
            to="/cart"
            className="nav-action-btn position-relative"
            title="Shopping Cart"
            type="button"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-white d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: 'var(--success-500)',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px'
                }}
              >
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={toggleTheme}
            className="nav-action-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            type="button"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              <div className="position-relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="nav-action-btn"
                  type="button"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-white d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: 'var(--danger-500)',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px'
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="position-absolute end-0 mt-2 modern-card shadow-lg"
                      style={{ width: '320px', zIndex: 99999 }}
                    >
                      <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                        <h6 className="mb-0 fw-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h6>
                      </div>
                      <div className="p-5 text-center" style={{ color: 'var(--text-secondary)' }}>
                        <Bell size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No notifications yet</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="position-relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="d-flex align-items-center gap-2 nav-action-btn"
                  type="button"
                >
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt={user.name} className="rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                  ) : (
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)', fontSize: '14px' }}>
                      {getUserInitials(user.name)}
                    </div>
                  )}
                  <div className="d-none d-md-block text-start">
                    <div className="fw-medium" style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.2 }}>{user.name}</div>
                    <div className="text-capitalize" style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.2 }}>{user.role}</div>
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="position-absolute end-0 mt-2 modern-card shadow-lg"
                      style={{ width: '256px', zIndex: 99999 }}
                    >
                      <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                        <div className="d-flex align-items-center gap-3">
                          {user.profile_image_url ? (
                            <img src={user.profile_image_url} alt={user.name} className="rounded-circle" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                          ) : (
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold" style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)' }}>
                              {getUserInitials(user.name)}
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user.email}</div>
                            <span className="badge text-capitalize mt-1" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-800)', fontSize: '12px' }}>{user.role}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link to="/profile" className="d-flex align-items-center gap-3 px-3 py-2 text-decoration-none rounded-2 dropdown-item-custom" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsProfileOpen(false)}><User size={18} /><span>My Profile</span></Link>
                        <Link to="/settings" className="d-flex align-items-center gap-3 px-3 py-2 text-decoration-none rounded-2 dropdown-item-custom" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsProfileOpen(false)}><Settings size={18} /><span>Settings</span></Link>
                        <Link to="/help" className="d-flex align-items-center gap-3 px-3 py-2 text-decoration-none rounded-2 dropdown-item-custom" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsProfileOpen(false)}><HelpCircle size={18} /><span>Help & Support</span></Link>
                        <Link to="/privacy" className="d-flex align-items-center gap-3 px-3 py-2 text-decoration-none rounded-2 dropdown-item-custom" style={{ color: 'var(--text-secondary)' }} onClick={() => setIsProfileOpen(false)}><Shield size={18} /><span>Privacy & Legal</span></Link>
                        <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />
                        <button onClick={handleLogout} className="w-100 d-flex align-items-center gap-3 px-3 py-2 bg-transparent border-0 rounded-2 dropdown-item-custom" style={{ color: 'var(--danger-500)' }} type="button"><LogOut size={18} /><span>Sign Out</span></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Link to="/login" className="nav-action-btn fw-semibold" style={{ padding: '0 18px' }}>Sign In</Link>
              <Link to="/register" className="nav-action-btn fw-bold" style={{ background: 'var(--primary-600)', color: '#fff', borderRadius: '999px', padding: '0 22px', border: 'none' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu - shown for ALL users (not just guests) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="d-lg-none"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}
          >
            <div className="px-3 py-3 d-flex flex-column gap-1">
              {NAV_LINKS.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'mobile-nav-active' : 'mobile-nav-link'}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                  })}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </NavLink>
              ))}
              <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings size={20} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 border-0 bg-transparent w-100 text-start mobile-nav-link"
                    style={{ color: 'var(--danger-500)' }}
                    type="button"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogOut size={20} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="btn-gradient-primary w-100 text-center py-3 rounded-pill mt-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
