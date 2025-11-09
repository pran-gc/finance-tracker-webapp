# Frontend Update Guide

## Overview

The following frontend components need to be updated to use the new API-based approach instead of the old Google Drive/IndexedDB approach.

## Files That Need Updates

### 1. `app/page.tsx` (Home/Dashboard Page)

**Old imports to replace:**
```typescript
import { getTransactions, getIncomeAndExpenseForPeriod } from '@/lib/data'
```

**New imports:**
```typescript
import { transactionsApi, analyticsApi } from '@/lib/api'
```

**Old code patterns:**
```typescript
const transactions = await getTransactions(10)
const { income, expense } = await getIncomeAndExpenseForPeriod(startDate, endDate)
```

**New code patterns:**
```typescript
const { transactions } = await transactionsApi.getAll(10, 0)
const { summary } = await analyticsApi.get(startDate, endDate)
const { income, expense } = summary
```

---

### 2. `app/transactions/page.tsx` (Transactions List Page)

**Old imports to replace:**
```typescript
import { getTransactionsWithDetails, deleteTransaction } from '@/lib/data'
```

**New imports:**
```typescript
import { transactionsApi } from '@/lib/api'
```

**Old code patterns:**
```typescript
const transactions = await getTransactionsWithDetails(50, 0)
await deleteTransaction(id)
```

**New code patterns:**
```typescript
const { transactions } = await transactionsApi.getAll(50, 0)
await transactionsApi.delete(id)
```

---

### 3. `app/add-transaction/page.tsx` (Add Transaction Page)

**Old imports to replace:**
```typescript
import { getCategories, addTransaction, getDefaultCurrency } from '@/lib/data'
```

**New imports:**
```typescript
import { categoriesApi, transactionsApi, settingsApi } from '@/lib/api'
```

**Old code patterns:**
```typescript
const categories = await getCategories('expense')
await addTransaction({ category_id, amount, description, transaction_date, type })
const defaultCurrency = await getDefaultCurrency()
```

**New code patterns:**
```typescript
const { categories } = await categoriesApi.getAll('expense')
await transactionsApi.create({ category_id, amount, description, transaction_date, type })
const { defaultCurrency } = await settingsApi.get()
```

---

### 4. `app/settings/page.tsx` (Settings Page)

**Old imports to replace:**
```typescript
import { getAppSettings, getCurrencies, updateAppSettings } from '@/lib/data'
```

**New imports:**
```typescript
import { settingsApi, currenciesApi } from '@/lib/api'
```

**Old code patterns:**
```typescript
const settings = await getAppSettings()
const currencies = await getCurrencies()
await updateAppSettings({ default_currency_id: id })
```

**New code patterns:**
```typescript
const { settings, defaultCurrency } = await settingsApi.get()
const { currencies } = await currenciesApi.getAll()
await settingsApi.update({ default_currency_id: id })
```

---

### 5. Any components using auth

**Old imports to replace:**
```typescript
import { signOut, isSignedIn } from '@/lib/googleDrive'
```

**New imports:**
```typescript
import { signOut, isAuthenticated, getCurrentUser } from '@/lib/clientAuth'
```

**Old code patterns:**
```typescript
const signedIn = await isSignedIn()
await signOut()
```

**New code patterns:**
```typescript
const authenticated = await isAuthenticated()
await signOut()
const user = await getCurrentUser()
```

---

## Migration Steps

For each file listed above:

1. **Read the file** to understand current implementation
2. **Update imports** to use new API client
3. **Replace data access calls** with API calls
4. **Update error handling** (API calls throw errors, catch and handle appropriately)
5. **Test the page** to ensure functionality works

## Important Notes

### API Response Format

All API endpoints return JSON responses with data wrapped in objects:

```typescript
// Transactions
{ transactions: [...] }

// Categories
{ categories: [...] }

// Currencies
{ currencies: [...] }

// Settings
{ settings: {...}, defaultCurrency: {...} }

// Analytics
{ summary: { income, expense }, spendingByCategory: [...], incomeByCategory: [...] }
```

### Error Handling

API calls can throw errors. Always wrap in try-catch:

```typescript
try {
  const { transactions } = await transactionsApi.getAll()
  // Use transactions
} catch (error) {
  console.error('Failed to load transactions:', error)
  // Show error to user
}
```

### Authentication

All API calls except `/api/currencies` require authentication. If user is not authenticated, calls will fail with 401 error. Handle this by redirecting to login:

```typescript
try {
  const data = await transactionsApi.getAll()
} catch (error: any) {
  if (error.message.includes('Unauthorized')) {
    router.push('/login')
  }
}
```

### Client vs Server Components

- Server components can directly call API functions during SSR
- Client components should use `useEffect` or event handlers to call APIs
- Use `'use client'` directive for components that need interactivity

## Example: Full Migration of a Component

### Before (Old Google Drive approach)
```typescript
'use client'
import { useEffect, useState } from 'react'
import { getTransactions, deleteTransaction } from '@/lib/data'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    async function load() {
      const data = await getTransactions(50)
      setTransactions(data)
    }
    load()
  }, [])

  async function handleDelete(id: number) {
    await deleteTransaction(id)
    // Reload
    const data = await getTransactions(50)
    setTransactions(data)
  }

  return (
    <div>
      {transactions.map(t => (
        <div key={t.id}>
          {t.description}
          <button onClick={() => handleDelete(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### After (New API approach)
```typescript
'use client'
import { useEffect, useState } from 'react'
import { transactionsApi } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const { transactions: data } = await transactionsApi.getAll(50, 0)
        setTransactions(data)
      } catch (err: any) {
        console.error('Load failed:', err)
        if (err.message.includes('Unauthorized')) {
          router.push('/login')
        } else {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handleDelete(id: number) {
    try {
      await transactionsApi.delete(id)
      // Reload
      const { transactions: data } = await transactionsApi.getAll(50, 0)
      setTransactions(data)
    } catch (err: any) {
      console.error('Delete failed:', err)
      setError(err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {transactions.map(t => (
        <div key={t.id}>
          {t.description}
          <button onClick={() => handleDelete(t.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

## Testing Checklist

After updating each component:

- [ ] Component loads without errors
- [ ] Data is fetched and displayed correctly
- [ ] Create/Update/Delete operations work
- [ ] Error states are handled gracefully
- [ ] Loading states show appropriately
- [ ] Unauthorized access redirects to login
- [ ] No console errors or warnings

## Common Issues

### Issue: "Cannot read property of undefined"
**Cause:** API response structure changed
**Fix:** Destructure the response properly: `const { transactions } = await transactionsApi.getAll()`

### Issue: "Unauthorized" errors
**Cause:** Session cookie missing or expired
**Fix:** User needs to sign in again, redirect to `/login`

### Issue: Module not found errors
**Cause:** Old imports still referencing deleted files
**Fix:** Update imports to use new API client from `@/lib/api` or `@/lib/clientAuth`

---

## Need Help?

1. Check the API client implementation: `lib/api.ts`
2. Check the API route handlers: `app/api/*/route.ts`
3. Review the migration summary: `MIGRATION_SUMMARY.md`
4. Check database setup: `scripts/README.md`
