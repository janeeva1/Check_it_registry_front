import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ToastProvider } from './components/Toast'
import './tailwind.css'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import CustomCursor from './components/CustomCursor'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoading from './components/PageLoading'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LandingV1 = lazy(() => import('./pages/LandingV1'))
const LandingV2 = lazy(() => import('./pages/LandingV2'))
const LandingV3 = lazy(() => import('./pages/LandingV3'))
const LandingV4 = lazy(() => import('./pages/LandingV4'))
const LandingV5 = lazy(() => import('./pages/LandingV5'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DeviceRegistration = lazy(() => import('./pages/DeviceRegistration'))
const MyDevices = lazy(() => import('./pages/MyDevices'))
const DeviceDetails = lazy(() => import('./pages/DeviceDetails'))
const Notifications = lazy(() => import('./pages/Notifications'))
const MarketplaceInbox = lazy(() => import('./pages/MarketplaceInbox'))
const MarketplaceThread = lazy(() => import('./pages/MarketplaceThread'))
const MarketplaceBrowse = lazy(() => import('./pages/MarketplaceBrowse'))
const MarketplaceListing = lazy(() => import('./pages/MarketplaceListing'))
const BusinessMyListings = lazy(() => import('./pages/BusinessMyListings'))
const CreateListing = lazy(() => import('./pages/CreateListing'))
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'))
const BuyerOrders = lazy(() => import('./pages/BuyerOrders'))
const SellerOrders = lazy(() => import('./pages/SellerOrders'))
const BusinessPayouts = lazy(() => import('./pages/BusinessPayouts'))
const SellerPayoutSettings = lazy(() => import('./pages/SellerPayoutSettings'))
const AdminDeviceCategories = lazy(() => import('./pages/AdminDeviceCategories'))
const AdminDeviceManagement = lazy(() => import('./pages/AdminDeviceManagement'))
const AdminDeviceDetails = lazy(() => import('./pages/AdminDeviceDetails'))
const AdminLEAManagement = lazy(() => import('./pages/AdminLEAManagement'))
const AdminReportManagement = lazy(() => import('./pages/AdminReportManagement'))
const AdminCaseDetails = lazy(() => import('./pages/AdminCaseDetails'))
const AdminSystemSettings = lazy(() => import('./pages/AdminSystemSettings'))
const LEAAlerts = lazy(() => import('./pages/LEAAlerts'))
const LEACases = lazy(() => import('./pages/LEACases'))
const LEACaseDetails = lazy(() => import('./pages/LEACaseDetails'))
const LEACommunication = lazy(() => import('./pages/LEACommunication'))
const LEADeviceSearch = lazy(() => import('./pages/LEADeviceSearch'))
const LEADeviceDetails = lazy(() => import('./pages/LEADeviceDetails'))
const LEARecovery = lazy(() => import('./pages/LEARecovery'))
const LEASettings = lazy(() => import('./pages/LEASettings'))
const PaymentAddMethod = lazy(() => import('./pages/PaymentAddMethod'))
const PaymentMethodSelection = lazy(() => import('./pages/PaymentMethodSelection'))
const PaymentConfirmation = lazy(() => import('./pages/PaymentConfirmation'))
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'))
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'))
const Search = lazy(() => import('./pages/Search'))
const DeviceVerificationStatus = lazy(() => import('./pages/DeviceVerificationStatus'))
const DeviceCheckReport = lazy(() => import('./pages/DeviceCheckReport'))
const ReportDeviceIncident = lazy(() => import('./pages/ReportDeviceIncident'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminAlerts = lazy(() => import('./pages/AdminAlerts'))
const LEAPortal = lazy(() => import('./pages/LEAPortal'))
const ReportDetails = lazy(() => import('./pages/ReportDetails'))
const ReportsV2 = lazy(() => import('./pages/ReportsV2'))
const DeviceTransfer = lazy(() => import('./pages/DeviceTransfer'))
const FoundDevice = lazy(() => import('./pages/FoundDevice'))
const EmailVerification = lazy(() => import('./pages/EmailVerification'))
const PasswordReset = lazy(() => import('./pages/PasswordReset'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const VerifyDevice = lazy(() => import('./pages/VerifyDevice'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const Analytics = lazy(() => import('./pages/Analytics'))
const ReportMissing = lazy(() => import('./pages/ReportMissing'))
const BusinessRegister = lazy(() => import('./pages/BusinessRegister'))
const BulkDeviceRegistration = lazy(() => import('./pages/BulkDeviceRegistration'))
const AuditTrail = lazy(() => import('./pages/AuditTrail'))
const AdminTransferHistory = lazy(() => import('./pages/AdminTransferHistory'))
const LEATransferHistory = lazy(() => import('./pages/LEATransferHistory'))
const Profile = lazy(() => import('./pages/Profile'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'))
const Settings = lazy(() => import('./pages/Settings'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Cart = lazy(() => import('./pages/Cart'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminMarketplaceManagement = lazy(() => import('./pages/AdminMarketplaceManagement'))
const LandingContentManager = lazy(() => import('./pages/admin/LandingContentManager'))
const DeviceCheck = lazy(() => import('./pages/DeviceCheck'))
const IdentityVerification = lazy(() => import('./pages/IdentityVerification'))
const BusinessVerification = lazy(() => import('./pages/BusinessVerification'))
const BusinessOnboarding = lazy(() => import('./pages/BusinessOnboarding'))
const BusinessOnboardings = lazy(() => import('./pages/BusinessOnboardings'))
const DeviceRecovery = lazy(() => import('./pages/DeviceRecovery'))
const RevenueSettings = lazy(() => import('./pages/admin/RevenueSettings'))
const FraudAlerts = lazy(() => import('./pages/admin/FraudAlerts'))

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
      <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing/v1" element={<LandingV1 />} />
        <Route path="/landing/v2" element={<LandingV2 />} />
        <Route path="/landing/v3" element={<LandingV3 />} />
        <Route path="/landing/v4" element={<LandingV4 />} />
        <Route path="/landing/v5" element={<LandingV5 />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/my-devices" element={user ? <MyDevices /> : <Navigate to="/login" />} />
        <Route path="/device/:id" element={user ? <DeviceDetails /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/marketplace" element={<MarketplaceBrowse />} />
        <Route path="/marketplace/browse" element={<MarketplaceBrowse />} />
        <Route path="/marketplace/listing/:id" element={<MarketplaceListing />} />
        <Route path="/business" element={<ProtectedRoute allowedRoles={['business','admin']}><BusinessDashboard /></ProtectedRoute>} />
        <Route path="/business/my-listings" element={<ProtectedRoute allowedRoles={['business','admin']}><BusinessMyListings /></ProtectedRoute>} />
        <Route path="/marketplace/create-listing" element={user ? <CreateListing /> : <Navigate to="/login" />} />
        <Route path="/device-check" element={user ? <ErrorBoundary><DeviceCheck /></ErrorBoundary> : <Navigate to="/login" />} />
        <Route path="/verification-status" element={user ? <DeviceVerificationStatus /> : <Navigate to="/login" />} />
        <Route path="/device-check-report" element={user ? <DeviceCheckReport /> : <Navigate to="/login" />} />
        <Route path="/register-device" element={user ? <DeviceRegistration /> : <Navigate to="/login" />} />
        <Route path="/report-incident" element={user ? <ReportDeviceIncident /> : <Navigate to="/login" />} />
          <Route path="/reports" element={user ? <ReportsV2 /> : <Navigate to="/login" />} />
          <Route path="/reports-v2" element={user ? <ReportsV2 /> : <Navigate to="/login" />} />
          <Route path="/reports/:caseId" element={user ? <ReportDetails /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminAlerts /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/device-management" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminDeviceManagement /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/device-management/category/:categoryKey" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminDeviceManagement /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/devices/:id" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminDeviceDetails /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/lea-management" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminLEAManagement /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/report-management" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminReportManagement /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/report-management/:caseId" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminCaseDetails /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/system-settings" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminSystemSettings /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/transfers" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminTransferHistory /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/lea" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEAPortal /></ProtectedRoute>} />
        <Route path="/lea/alerts" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEAAlerts /></ProtectedRoute>} />
        <Route path="/lea/cases" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEACases /></ProtectedRoute>} />
        <Route path="/lea/cases/:id" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEACaseDetails /></ProtectedRoute>} />
        <Route path="/lea/devices/:id" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEADeviceDetails /></ProtectedRoute>} />
        <Route path="/lea/communication" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEACommunication /></ProtectedRoute>} />
        <Route path="/lea/device-search" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEADeviceSearch /></ProtectedRoute>} />
        <Route path="/lea/recovery" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEARecovery /></ProtectedRoute>} />
        <Route path="/lea/settings" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEASettings /></ProtectedRoute>} />
        <Route path="/lea/transfers" element={<ProtectedRoute allowedRoles={['lea','admin']}><LEATransferHistory /></ProtectedRoute>} />
        <Route path="/transfer" element={user ? <DeviceTransfer /> : <Navigate to="/login" />} />
        <Route path="/found-device" element={user ? <FoundDevice /> : <Navigate to="/login" />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/verify-device" element={<VerifyDevice />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
        <Route path="/report-missing" element={user ? <ReportMissing /> : <Navigate to="/login" />} />
        <Route path="/business-register" element={<BusinessRegister />} />
        <Route path="/bulk-register" element={user ? <BulkDeviceRegistration /> : <Navigate to="/login" />} />
        <Route path="/audit-trail" element={<ProtectedRoute allowedRoles={['admin']}><AuditTrail /></ProtectedRoute>} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/marketplace-inbox" element={user ? <MarketplaceInbox /> : <Navigate to="/login" />} />
        <Route path="/marketplace-inbox/:id" element={user ? <MarketplaceThread /> : <Navigate to="/login" />} />
        <Route path="/search" element={<Search />} />
        <Route path="/payments/add-method" element={user ? <PaymentAddMethod /> : <Navigate to="/login" />} />
        <Route path="/payments/method-selection" element={user ? <PaymentMethodSelection /> : <Navigate to="/login" />} />
        <Route path="/payments/confirm" element={user ? <PaymentConfirmation /> : <Navigate to="/login" />} />
        <Route path="/payment/callback" element={user ? <PaymentCallback /> : <Navigate to="/login" />} />
        <Route path="/payments/transactions" element={user ? <TransactionHistory /> : <Navigate to="/login" />} />
        <Route path="/orders" element={user ? <BuyerOrders /> : <Navigate to="/login" />} />
        <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['business','admin']}><SellerOrders /></ProtectedRoute>} />
        <Route path="/business/payouts" element={<ProtectedRoute allowedRoles={['business','admin']}><BusinessPayouts /></ProtectedRoute>} />
        <Route path="/business/payout-settings" element={<ProtectedRoute allowedRoles={['business','admin']}><SellerPayoutSettings /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/identity-verification" element={user ? <IdentityVerification /> : <Navigate to="/login" />} />
        <Route path="/business-verification" element={user ? <BusinessVerification /> : <Navigate to="/login" />} />
        <Route path="/business/onboard" element={<ProtectedRoute allowedRoles={['business','admin']}><BusinessOnboarding /></ProtectedRoute>} />
        <Route path="/business/onboardings" element={<ProtectedRoute allowedRoles={['business','admin']}><BusinessOnboardings /></ProtectedRoute>} />
        <Route path="/device-recovery" element={user ? <DeviceRecovery /> : <Navigate to="/login" />} />

        <Route path="/admin/device-categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminDeviceCategories /></ProtectedRoute>} />
        <Route path="/admin/landing-content" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><LandingContentManager /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/marketplace" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminMarketplaceManagement /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/revenue" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><RevenueSettings /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/fraud-alerts" element={<ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><FraudAlerts /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
        {/* Catch-all route: send all unknown links to NotFound with back to dashboard */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <ErrorBoundary>
              <CustomCursor />
              <AppRoutes />
            </ErrorBoundary>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
