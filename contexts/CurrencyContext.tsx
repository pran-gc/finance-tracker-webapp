"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { currenciesApi, settingsApi } from '@/lib/api'

interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}

interface CurrencyContextType {
  currency: Currency | null
  loading: boolean
  refreshCurrency: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: null,
  loading: true,
  refreshCurrency: async () => {},
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCurrency = async () => {
    try {
      setLoading(true)
      const [settingsResponse, currenciesResponse] = await Promise.all([
        settingsApi.get(),
        currenciesApi.getAll()
      ])

      const defaultCurrencyId = settingsResponse.settings?.default_currency_id
      const userCurrency = currenciesResponse.currencies.find(
        (c: Currency) => c.id === defaultCurrencyId
      )

      setCurrency(userCurrency || currenciesResponse.currencies[0] || null)
    } catch (err) {
      console.error('Failed to load currency:', err)
      // Set default to USD
      setCurrency({ id: 1, code: 'USD', name: 'US Dollar', symbol: '$' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrency()

    // Listen for currency changes
    const handleCurrencyChange = () => {
      loadCurrency()
    }

    window.addEventListener('finance:currency:changed', handleCurrencyChange)

    return () => {
      window.removeEventListener('finance:currency:changed', handleCurrencyChange)
    }
  }, [])

  return (
    <CurrencyContext.Provider value={{ currency, loading, refreshCurrency: loadCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}
