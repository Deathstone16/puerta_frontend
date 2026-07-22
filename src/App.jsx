import { Navigate, Route, Routes } from 'react-router-dom'
import OwnerShell from './components/OwnerShell'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import { AuthProvider } from './context/AuthContext'
import { PurchaseProvider } from './context/PurchaseContext'
import CheckoutPage from './pages/CheckoutPage'
import CashierPage from './pages/CashierPage'
import DashboardPage from './pages/DashboardPage'
import DeferredRolePage from './pages/DeferredRolePage'
import AdminPage from './pages/AdminPage'
import GuardPage from './pages/GuardPage'
import EventDetailPage from './pages/EventDetailPage'
import HomePage from './pages/HomePage'
import ListPage from './pages/ListPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PaymentProcessingPage from './pages/PaymentProcessingPage'
import RrppPage from './pages/RrppPage'
import WalletPage from './pages/WalletPage'

export default function App() {
  return (
    <AuthProvider>
      <PurchaseProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
            <Route path="/procesando" element={<PaymentProcessingPage />} />
            <Route path="/wallet/:token" element={<WalletPage />} />
            <Route path="/lista/:slug" element={<ListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['dueno']} />}>
            <Route element={<OwnerShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['rrpp']} />}>
            <Route path="/rrpp" element={<RrppPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['guardia']} />}>
            <Route path="/guardia" element={<GuardPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['cajera']} />}>
            <Route path="/cajera" element={<CashierPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['superadmin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="/dueno" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </PurchaseProvider>
    </AuthProvider>
  )
}
