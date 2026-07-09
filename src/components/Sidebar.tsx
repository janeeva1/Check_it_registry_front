import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import {
  LayoutDashboard,
  Smartphone,
  AlertTriangle,
  FileText,
  Settings,
  Users,
  BarChart3,
  Shield,
  Upload,
  History,
  Search,
  X,
  ChevronRight,
  Bell,
  Inbox,
  ShieldCheck,
  AlertOctagon,
  CreditCard,
  Receipt,
  MessageSquare,
  ArrowLeftRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
}

interface NavGroup {
  key: string;
  title: string;
  icon: any;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNavGroups = (): NavGroup[] => {
    const usersMenu: NavGroup = {
      key: "users",
      title: "Users Menu",
      icon: Users,
      items: [
        { path: "/device-check", label: "Device Check", icon: Search },
        { path: "/verification-status", label: "Verification Status", icon: ShieldCheck },
        { path: "/device-check-report", label: "Check Report", icon: FileText },
        { path: "/register-device", label: "Register Device", icon: Smartphone },
        { path: "/my-devices", label: "My Devices", icon: Smartphone },
        { path: "/transfer", label: "Transfers", icon: ArrowLeftRight },
        { path: "/report-missing", label: "Report Missing", icon: AlertTriangle },
        { path: "/report-incident", label: "Report Incident", icon: AlertOctagon },
        { path: "/reports", label: "My Reports", icon: FileText },
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/device-recovery", label: "Device Recovery", icon: Shield },
        { path: "/orders", label: "My Orders", icon: Receipt },
        { path: "/search", label: "Search", icon: Search },
        { path: "/profile", label: "Profile", icon: Users },
      ],
    };

    const marketplaceMenu: NavGroup = {
      key: "marketplace",
      title: "Marketplace",
      icon: Inbox,
      items: [
        { path: "/marketplace/browse", label: "Browse", icon: Search },
        { path: "/marketplace-inbox", label: "Inbox", icon: MessageSquare },
      ],
    };

    const businessMenu: NavGroup = {
      key: "business",
      title: "Business Menus",
      icon: LayoutDashboard,
      items: [
        { path: "/business/my-listings", label: "My Listings", icon: Smartphone },
        { path: "/marketplace/create-listing", label: "Create Listing", icon: Upload },
        { path: "/seller/orders", label: "Seller Orders", icon: Receipt },
        { path: "/bulk-register", label: "Bulk Register", icon: Upload },
        { path: "/transfer", label: "Transfers", icon: ArrowLeftRight },
        { path: "/business/payouts", label: "Payouts", icon: CreditCard },
        { path: "/business/onboard", label: "Onboard Customer", icon: Users },
        { path: "/business/onboardings", label: "Onboardings", icon: FileText },
      ],
    };

    const paymentsMenu: NavGroup = {
      key: "payments",
      title: "Payments",
      icon: CreditCard,
      items: [
        { path: "/payments/add-method", label: "Add Payment", icon: CreditCard },
        { path: "/payments/method-selection", label: "Payment Methods", icon: CreditCard },
        { path: "/payments/confirm", label: "Confirm", icon: Receipt },
        { path: "/payments/transactions", label: "Transactions", icon: Receipt },
      ],
    };

    const leaMenu: NavGroup = {
      key: "lea",
      title: "LEA Menu",
      icon: Shield,
      items: [
        { path: "/lea/alerts", label: "Alerts", icon: AlertTriangle },
        { path: "/lea/cases", label: "Cases", icon: FileText },
        { path: "/lea/device-search", label: "Device Search", icon: Search },
        { path: "/lea/communication", label: "Communication", icon: MessageSquare },
        { path: "/lea/recovery", label: "Recovery", icon: Shield },
        { path: "/lea/settings", label: "Settings", icon: Settings },
        { path: "/lea/transfers", label: "Transfers", icon: ArrowLeftRight },
      ],
    };

    const adminMenu: NavGroup = {
      key: "admin",
      title: "Admin Menus",
      icon: Settings,
      items: [
        { path: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
        { path: "/user-management", label: "User Management", icon: Users },
        { path: "/analytics", label: "Analytics", icon: BarChart3 },
        { path: "/audit-trail", label: "Audit Trail", icon: History },
        { path: "/admin/device-management", label: "Device Management", icon: Smartphone },
        { path: "/admin/lea-management", label: "LEA Management", icon: Shield },
        { path: "/admin/report-management", label: "Report Management", icon: FileText },
        { path: "/admin/marketplace", label: "Marketplace Management", icon: Inbox },
        { path: "/admin/system-settings", label: "System Settings", icon: Settings },
        { path: "/admin/device-categories", label: "Device Categories", icon: Settings },
        { path: "/admin/transfers", label: "Transfers", icon: ArrowLeftRight },
        { path: "/admin/landing-content", label: "Landing Content", icon: FileText },
      ],
    };

    const communicationMenu: NavGroup = {
      key: "communication",
      title: "Communication",
      icon: MessageSquare,
      items: [
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/marketplace-inbox", label: "Marketplace Inbox", icon: MessageSquare },
        { path: "/lea/communication", label: "LEA Communication", icon: MessageSquare },
      ],
    };

    const settingsMenu: NavGroup = {
      key: "settings",
      title: "Settings",
      icon: Settings,
      items: [
        { path: "/settings", label: "App Settings", icon: Settings },
      ],
    };

    // Build groups per role
    const role = user?.role;
    if (role === "admin" || role === "super_admin") {
      return [adminMenu, businessMenu, leaMenu, usersMenu, marketplaceMenu, communicationMenu, settingsMenu];
    }
    if (role === "business") {
      return [businessMenu, marketplaceMenu, paymentsMenu];
    }
    if (role === "lea") {
      return [leaMenu, marketplaceMenu];
    }
    // default user
    return [usersMenu, marketplaceMenu];
  };

  const navGroups = getNavGroups();

  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Expand group containing current route
    const current = location.pathname;
    const match = navGroups.find(g => g.items.some(it => current.startsWith(it.path)));
    setOpenGroup(match ? match.key : navGroups[0]?.key || null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay d-md-none"
            onClick={onClose}
            style={{ zIndex: 1020 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
        style={{
          // Position and stacking so the sidebar sits above the overlay
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 1030,
          // Use transform for show/hide on both mobile and desktop
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          width: isMobile ? 'min(320px, 85vw)' : '280px',
          maxWidth: '320px',
        }}
      >
        <div className="d-flex flex-column h-100">
          {/* Header */}
          <div
            className="sidebar-header p-3 border-bottom d-flex align-items-center justify-content-between"
            style={{ borderBottomColor: "var(--border-color)" }}
          >
            <div className="sidebar-logo-container flex-grow-1 d-flex justify-content-center">
              <img
                src={theme === "dark" ? "/logo12.png" : "/logo1.png"}
                alt="Check It Device Registry"
                className="sidebar-logo"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  maxHeight: "60px",
                  objectFit: "contain",
                }}
              />
            </div>
            <button
              onClick={onClose}
              className="d-md-none btn btn-link p-1 ms-2 text-decoration-none flex-shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Top-level Dashboard link (not grouped) */}
          <nav className="p-3 border-bottom" style={{ borderBottomColor: "var(--border-color)" }}>
            {(() => {
              const role = user?.role;
              let dashboardPath = "/dashboard";
              if (role === "admin") dashboardPath = "/admin";
              else if (role === "business") dashboardPath = "/business";
              else if (role === "lea") dashboardPath = "/lea";

              const active = isActive(dashboardPath);
              return (
                <Link
                  to={dashboardPath}
                  onClick={() => {
                    if (isMobile) onClose();
                  }}
                  className={`nav-item ${active ? 'nav-item-active' : ''}`}
                  title="Dashboard"
                >
                  <LayoutDashboard size={18} className="flex-shrink-0" />
                  <span className="fw-medium sidebar-text">Dashboard</span>
                  {active && (
                    <ChevronRight
                      size={16}
                      className="ms-auto sidebar-text"
                      style={{ color: 'var(--primary-600)' }}
                    />
                  )}
                </Link>
              );
            })()}
          </nav>

          {/* Navigation Groups */}
          <nav className="flex-grow-1 p-3 overflow-auto">
            {navGroups.map((group, gi) => {
              const GroupIcon = group.icon;
              const isOpenGroup = openGroup === group.key;
              return (
                <div key={group.key} className="mb-2">
                  <button
                    className="nav-group-btn"
                    onClick={() => setOpenGroup(prev => (prev === group.key ? null : group.key))}
                    title={group.title}
                  >
                    <GroupIcon size={18} />
                    <span className="fw-semibold sidebar-text">{group.title}</span>
                    <ChevronRight
                      size={16}
                      className={`ms-auto sidebar-text ${isOpenGroup ? 'rotate-90' : ''}`}
                      style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s' }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpenGroup && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ps-2"
                      >
                        {group.items.map((item, index) => {
                          const IconComponent = item.icon;
                          const active = isActive(item.path);
                          return (
                            <motion.div
                              key={item.path}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 + gi * 0.02 }}
                            >
                              <Link
                                to={item.path}
                                onClick={() => {
                                  if (isMobile) {
                                    onClose();
                                  }
                                  // Accordion behavior: collapse others, keep current open
                                  setOpenGroup(group.key);
                                }}
                                className={`nav-item ${active ? 'nav-item-active' : ''}`}
                                title={item.label}
                              >
                                <IconComponent size={18} className="flex-shrink-0" />
                                <span className="fw-medium sidebar-text">{item.label}</span>
                                {active && (
                                  <ChevronRight
                                    size={16}
                                    className="ms-auto sidebar-text"
                                    style={{ color: 'var(--primary-600)' }}
                                  />
                                )}
                              </Link>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="sidebar-footer p-4 border-top text-center"
            style={{ borderTopColor: "var(--border-color)" }}
          >
            <p
              className="mb-1"
              style={{ color: "var(--text-secondary)", fontSize: "12px" }}
            >
              © {new Date().getFullYear()} Check It Registry
            </p>

            <p
              className="mb-0"
              style={{ color: "var(--text-secondary)", fontSize: "11px" }}
            >
              Secure Device Protection
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
