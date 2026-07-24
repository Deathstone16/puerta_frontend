import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { PurchaseProvider } from '../context/PurchaseContext'

function AllProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PurchaseProvider>
          {children}
        </PurchaseProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options })

// Re-export everything from RTL
export * from '@testing-library/react'

// Override render with our custom version
export { customRender as render }
