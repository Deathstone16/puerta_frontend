import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import OwnerShell from './components/OwnerShell'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import { AuthProvider } from './context/AuthContext'
import { PurchaseProvider } from './context/PurchaseContext'

// Lazy loading por ruta: cada página es su propio chunk, así la carga inicial
// baja mucho (antes todo entraba en un solo bundle grande).
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const CashierPage = lazy(() => import('./pages/CashierPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const RrppListaPage = lazy(() => import('./pages/RrppListaPage'))
const GuardPage = lazy(() => import('./pages/GuardPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const ListPage = lazy(() => import('./pages/ListPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PaymentProcessingPage = lazy(() => import('./pages/PaymentProcessingPage'))
const RrppPage = lazy(() => import('./pages/RrppPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="size-10 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PurchaseProvider>
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </PurchaseProvider>
    </AuthProvider>
  )
}
