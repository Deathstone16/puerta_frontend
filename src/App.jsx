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
import RrppListaPage from './pages/RrppListaPage'
import GuardPage from './pages/GuardPage'
import EventDetailPage from './pages/EventDetailPage'
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
          {/* Login — standalone, sin navbar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public routes (buyers need these) */}
          <Route element={<PublicLayout />}>
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
            <Route path="/procesando" element={<PaymentProcessingPage />} />
            <Route path="/wallet/:token" element={<WalletPage />} />
            <Route path="/lista/:slug" element={<ListPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Owner dashboard */}
          <Route element={<ProtectedRoute roles={['dueno']} />}>
            <Route element={<OwnerShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* RRPP */}
          <Route element={<ProtectedRoute roles={['rrpp']} />}>
            <Route path="/rrpp" element={<RrppPage />} />
            <Route path="/rrpp/lista/:eventoId" element={<RrppListaPage />} />
          </Route>

          {/* Guard */}
          <Route element={<ProtectedRoute roles={['guardia']} />}>
            <Route path="/guardia" element={<GuardPage />} />
          </Route>

          {/* Cashier */}
          <Route element={<ProtectedRoute roles={['cajera']} />}>
            <Route path="/cajera" element={<CashierPage />} />
          </Route>

          {/* Superadmin */}
          <Route element={<ProtectedRoute roles={['superadmin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dueno" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </PurchaseProvider>
    </AuthProvider>
  )
}
