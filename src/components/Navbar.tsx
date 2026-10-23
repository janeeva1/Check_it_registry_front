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
  ShoppingCart,
  LayoutDashboard
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { getDisplayName, getUserInitials } from '../utils/userHelpers';

interface UserData {
  id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
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
  { path: '/device-check', label: 'Check an item', icon: Search },
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isMobileMenuOpen]);

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
          {user && onMenuClick ? (
            <button
              onClick={() => onMenuClick?.()}
              className="nav-action-btn"
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={!!sidebarOpen}
              type="button"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="nav-action-btn d-lg-none"
              title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
          <Link to="/" className="po-nav-brand d-flex align-items-center gap-2 text-decoration-none" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/logo-mark.png" alt="Prove Ownership" style={{ height: '28px', objectFit: 'contain' }} />
            <span className="fw-bold d-none d-sm-inline" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>Prove Ownership</span>
          </Link>
        </div>

        {/* Center: Desktop nav links - ALWAYS visible for ALL users */}
        <div className="d-none d-lg-flex align-items-center gap-1">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              title={link.label}
              aria-label={link.label}
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
            className={`nav-action-btn position-relative ${itemCount > 0 ? '' : 'd-none d-md-inline-flex'}`}
            title="Cart"
            aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
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
            className={`nav-action-btn ${user ? 'd-none d-md-inline-flex' : ''}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            type="button"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              <div className="position-relative" ref={notificationRef}>
                <Link
                  to="/notifications"
                  className="nav-action-btn position-relative"
                  aria-label="Notifications"
                  title="Notifications"
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
                </Link>
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="position-absolute end-0 mt-2 modern-card shadow-lg"
                      style={{ width: 'min(320px, 90vw)', zIndex: 99999 }}
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
                  style={{ paddingInline: 6 }}
                  aria-label="Account menu"
                  aria-expanded={isProfileOpen}
                  type="button"
                >
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt={getDisplayName(user)} className="rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                      ) : (
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: 'var(--primary-600)', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                      {getUserInitials(user)}
                      </div>
                    )}
                  <span className="d-none d-xl-flex flex-column align-items-start">
                    <span className="fw-medium" style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.2 }}>{getDisplayName(user)}</span>
                    <span className="text-capitalize" style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.2 }}>{user.role}</span>
                  </span>
                  <ChevronDown size={14} className="d-none d-md-inline" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="position-absolute end-0 mt-2 modern-card shadow-lg"
                      style={{ width: 'min(256px, 85vw)', zIndex: 99999 }}
                    >
                      <div className="p-4 border-bottom" style={{ borderBottomColor: 'var(--border-color)' }}>
                        <div className="d-flex align-items-center gap-3">
                          {user.profile_image_url ? (
                            <img src={user.profile_image_url} alt={getDisplayName(user)} className="rounded-circle" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                          ) : (
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold" style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)' }}>
                              {getUserInitials(user)}
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{getDisplayName(user)}</div>
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
                        <button type="button" onClick={toggleTheme} className="w-100 d-flex align-items-center gap-3 px-3 py-2 bg-transparent border-0 rounded-2 dropdown-item-custom d-md-none" style={{ color: 'var(--text-secondary)' }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
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
              <Link to="/login" className="nav-action-btn fw-semibold d-none d-sm-flex" style={{ padding: '0 18px' }}>Sign In</Link>
              <Link to="/register" className="nav-action-btn fw-bold d-none d-sm-flex" style={{ background: 'var(--primary-600)', color: '#fff', borderRadius: '999px', padding: '0 22px', border: 'none' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu - shown for ALL users (not just guests) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="d-lg-none"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 99999,
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-color)',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div className="px-3 pt-3 pb-4">
              {/* Primary actions */}
              <div className="d-flex flex-column gap-1">
                <div className="px-3 pt-1 pb-2 text-uppercase fw-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                  Quick Actions
                </div>
                {NAV_LINKS.map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none"
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--primary-600)' : 'var(--text-primary)',
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-tertiary)',
                            color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                          }}
                        >
                          <link.icon size={18} />
                        </span>
                        <span style={{ fontSize: 15 }}>{link.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              <hr className="my-3" style={{ borderColor: 'var(--border-color)' }} />

              {user ? (
                <>
                  <div className="px-3 pt-1 pb-2 text-uppercase fw-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                    Account
                  </div>
                  <div className="d-flex flex-column gap-1">
                    <Link
                      to="/dashboard"
                      className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <LayoutDashboard size={18} />
                      </span>
                      <span style={{ fontSize: 15 }}>Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <User size={18} />
                      </span>
                      <span style={{ fontSize: 15 }}>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <Settings size={18} />
                      </span>
                      <span style={{ fontSize: 15 }}>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 bg-transparent w-100 text-start"
                      style={{ color: 'var(--danger-500)', fontWeight: 500 }}
                      type="button"
                    >
                      <span className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger-500)' }}>
                        <LogOut size={18} />
                      </span>
                      <span style={{ fontSize: 15 }}>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-gradient-primary w-100 text-center py-3 rounded-pill fw-bold text-white text-decoration-none"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-100 text-center py-3 rounded-pill fw-semibold text-decoration-none"
                    style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
