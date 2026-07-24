import { createContext, useContext, useMemo, useState } from 'react'

const PurchaseContext = createContext(null)

export function PurchaseProvider({ children }) {
  const [selection, setSelection] = useState(null)
  const [ticket, setTicket] = useState(null)

  const value = useMemo(() => ({ selection, setSelection, ticket, setTicket }), [selection, ticket])
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>
}

export function usePurchase() {
  const context = useContext(PurchaseContext)
  if (!context) throw new Error('usePurchase debe usarse dentro de PurchaseProvider')
  return context
}
