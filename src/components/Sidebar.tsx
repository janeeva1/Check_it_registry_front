import React from "react";
import { useModules, isMarketplacePath } from '../contexts/ModulesContext';
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
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
  Archive,
  RotateCcw,
  Plus,
  Scale,
  HelpCircle,
  User,
  Power,
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
  const { visible } = useModules();
  const location = useLocation();
  // Below 1024px the sidebar is a drawer over the page
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNavGroups = (): NavGroup[] => {
    // Plain-language groups, ordered by how often people need them
    const usersMenu: NavGroup = {
      key: "users",
      title: "My items",
      icon: Smartphone,
      items: [
        { path: "/my-devices", label: "My items", icon: Smartphone },
        { path: "/register-device", label: "Register an item", icon: Plus },
        { path: "/transfer", label: "Transfers", icon: ArrowLeftRight },
        { path: "/report-incident", label: "Report stolen or lost", icon: AlertOctagon },
        { path: "/reports", label: "My reports", icon: FileText },
        { path: "/claim", label: "Claim an item", icon: Scale },
        { path: "/device-recovery", label: "Recovery help", icon: Shield },
      ],
    };

    const checkMenu: NavGroup = {
      key: "check",
      title: "Check before you buy",
      icon: Search,
      items: [
        { path: "/device-check", label: "Check an item", icon: Search },
        { path: "/device-check-report", label: "Check history", icon: History },
      ],
    };

    const marketplaceMenu: NavGroup = {
      key: "marketplace",
      title: "Marketplace",
      icon: Inbox,
      items: [
        { path: "/marketplace/browse", label: "Browse", icon: Search },
        { path: "/marketplace-inbox", label: "Messages", icon: MessageSquare },
        { path: "/orders", label: "My orders", icon: Receipt },
      ],
    };

    const accountMenu: NavGroup = {
      key: "account",
      title: "Account",
      icon: User,
      items: [
        { path: "/notifications", label: "Notifications", icon: Bell },
        { path: "/profile", label: "Profile", icon: User },
        { path: "/settings", label: "Settings", icon: Settings },
        { path: "/help", label: "Help", icon: HelpCircle },
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
        { path: "/payments/transactions", label: "Transactions", icon: Receipt },
        { path: "/business/payout-settings", label: "Payout bank account", icon: CreditCard },
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
        { path: "/lea/custody", label: "Held items", icon: Landmark },
        { path: "/lea/settings", label: "Settings", icon: Settings },
        { path: "/lea/transfers", label: "Transfers", icon: ArrowLeftRight },
      ],
    };

    // Admin: grouped by job, most-used first
    const adminWork: NavGroup = {
      key: "admin-work",
      title: "To review",
      icon: ShieldCheck,
      items: [
        { path: "/admin/ownership-review", label: "Ownership proofs & disputes", icon: ShieldCheck },
        { path: "/admin/verification-queue", label: "Identity checks", icon: Shield },
        { path: "/admin/report-management", label: "Theft & loss reports", icon: FileText },
        { path: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
        { path: "/admin/fraud-alerts", label: "Fraud alerts", icon: AlertOctagon },
        { path: "/admin/transfers", label: "Transfers", icon: ArrowLeftRight },
      ],
    };

    const adminRecovery: NavGroup = {
      key: "admin-recovery",
      title: "Recovery",
      icon: RotateCcw,
      items: [
        { path: "/admin/custody", label: "Held items", icon: Landmark },
        { path: "/admin/recovery", label: "Recovery services", icon: RotateCcw },
        { path: "/admin/lea-management", label: "Police agencies", icon: Shield },
      ],
    };

    const adminRecords: NavGroup = {
      key: "admin-records",
      title: "People & items",
      icon: Users,
      items: [
        { path: "/user-management", label: "Users", icon: Users },
        { path: "/admin/device-management", label: "Items", icon: Smartphone },
        { path: "/admin/device-categories", label: "Item categories", icon: Settings },
        { path: "/admin/archive", label: "Archive & restore", icon: Archive },
      ],
    };

    const adminMoney: NavGroup = {
      key: "admin-money",
      title: "Payments",
      icon: CreditCard,
      items: [
        { path: "/admin/modules", label: "Modules & payments", icon: Power },
        { path: "/admin/revenue", label: "Fees & revenue", icon: CreditCard },
        { path: "/admin/marketplace", label: "Marketplace listings", icon: Inbox },
      ],
    };

    const adminInsights: NavGroup = {
      key: "admin-insights",
      title: "Reports & logs",
      icon: BarChart3,
      items: [
        { path: "/analytics", label: "Analytics", icon: BarChart3 },
        { path: "/audit-trail", label: "Audit trail", icon: History },
      ],
    };

    const adminSite: NavGroup = {
      key: "admin-site",
      title: "Site settings",
      icon: Settings,
      items: [
        { path: "/admin/system-settings", label: "System settings", icon: Settings },
        { path: "/admin/landing-content", label: "Home page content", icon: FileText },
      ],
    };

    // Build groups per role
    const role = user?.role;
    if (role === "admin" || role === "super_admin") {
      return [adminWork, adminRecovery, adminRecords, adminMoney, adminInsights, adminSite, accountMenu];
    }
    if (role === "business") {
      return [businessMenu, checkMenu, marketplaceMenu, paymentsMenu, accountMenu];
    }
    if (role === "lea") {
      return [leaMenu, accountMenu];
    }
    // default user
    return [usersMenu, checkMenu, marketplaceMenu, accountMenu];
  };

  // Hide the marketplace links while it is switched off (admins still see them)
  const showMarket = visible('marketplace');
  const navGroups = getNavGroups()
    .map((g) => ({ ...g, items: g.items.filter((i) => showMarket || !isMarketplacePath(i.path)) }))
    .filter((g) => g.items.length > 0);
  // Short menus (everyone except admins) stay fully open: no hunting in accordions
  const alwaysOpen = !(user?.role === "admin" || user?.role === "super_admin");

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
            className="sidebar-overlay"
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
          // Hidden links shouldn't be reachable with the keyboard when closed
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'transform 0.3s ease-in-out, visibility 0.3s',
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
            <Link to="/" className="sidebar-logo-container flex-grow-1 d-flex align-items-center gap-2 text-decoration-none" aria-label="Prove Ownership home">
              <img src="/logo-mark.png" alt="" width={46} height={28} style={{ height: 28, width: 'auto' }} />
              <span className="fw-bold" style={{ color: "var(--text-primary)", fontSize: 17 }}>Prove Ownership</span>
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className={`${isMobile ? '' : 'd-none'} btn btn-link p-1 ms-2 text-decoration-none flex-shrink-0`}
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
              if (role === "admin" || role === "super_admin") dashboardPath = "/admin";
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
                  {alwaysOpen ? (
                    <div className="nav-section-title">{group.title}</div>
                  ) : (
                  <button
                    className="nav-group-btn"
                    aria-expanded={isOpenGroup}
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
                  )}

                  <AnimatePresence initial={false}>
                    {(isOpenGroup || alwaysOpen) && (
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
              © {new Date().getFullYear()} Prove Ownership
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
