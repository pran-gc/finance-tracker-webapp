import { remoteDb, RemoteState } from './remoteDb'

export interface Currency {
  id?: number
  code: string
  name: string
  symbol: string
  is_active: boolean
  created_at?: string
}

export interface Category {
  id?: number
  name: string
  type: 'income' | 'expense'
  is_default: boolean
  is_active: boolean
  created_at?: string
}

export interface AppSettings {
  id: number
  default_currency_id: number
  last_backup_time?: string
  created_at?: string
  updated_at?: string
}

export interface Transaction {
  id?: number
  category_id: number
  amount: number
  description?: string
  transaction_date: string
  type: 'income' | 'expense'
  created_at?: string
  updated_at?: string
}

export interface NewCurrency {
  code: string
  name: string
  symbol: string
  is_active?: boolean
}

export interface NewCategory {
  name: string
  type: 'income' | 'expense'
  is_default?: boolean
  is_active?: boolean
}

export interface NewTransaction {
  category_id: number
  amount: number
  description?: string
  transaction_date: string
  type: 'income' | 'expense'
}

// Helper to read the whole remote state
async function readState(): Promise<RemoteState> {
  return await remoteDb.readState()
}

async function writeState(state: RemoteState) {
  return await remoteDb.writeState(state)
}

// Currency operations
export async function addCurrency(currency: NewCurrency) {
  const state = await readState()
  const id = remoteDb.nextId(state.currencies)
  const rec: Currency = {
    id,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    is_active: currency.is_active ?? true,
    created_at: new Date().toISOString(),
  }
  state.currencies.push(rec)
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return id
}

export async function getCurrencies(): Promise<Currency[]> {
  const state = await readState()
  return state.currencies || []
}

export async function getActiveCurrencies(): Promise<Currency[]> {
  const currencies = await getCurrencies()
  return currencies.filter((c) => c.is_active)
}

export async function updateCurrency(currency: Currency) {
  const state = await readState()
  const idx = state.currencies.findIndex((c: any) => c.id === currency.id)
  if (idx === -1) throw new Error('Currency not found')
  state.currencies[idx] = { ...state.currencies[idx], ...currency }
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return currency.id
}

export async function deleteCurrency(id: number) {
  const state = await readState()
  state.currencies = state.currencies.filter((c: any) => c.id !== id)
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return true
}

// Category operations
export async function addCategory(category: NewCategory) {
  const state = await readState()
  const id = remoteDb.nextId(state.categories)
  const rec: Category = {
    id,
    name: category.name,
    type: category.type,
    is_default: category.is_default ?? false,
    is_active: category.is_active ?? true,
    created_at: new Date().toISOString(),
  }
  state.categories.push(rec)
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return id
}

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const state = await readState()
  let filtered = (state.categories || []).filter((c: any) => c.is_active)
  if (type) filtered = filtered.filter((c: any) => c.type === type)
  return filtered.sort((a: any, b: any) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function updateCategory(category: Category) {
  const state = await readState()
  const idx = state.categories.findIndex((c: any) => c.id === category.id)
  if (idx === -1) throw new Error('Category not found')
  state.categories[idx] = { ...state.categories[idx], ...category }
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return category.id
}

export async function deleteCategory(id: number) {
  const state = await readState()
  state.categories = state.categories.filter((c: any) => c.id !== id)
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return true
}

// App Settings
export async function getAppSettings(): Promise<AppSettings | null> {
  const state = await readState()
  return state.settings || null
}

export async function updateAppSettings(settings: Partial<AppSettings>) {
  const state = await readState()
  const existing = state.settings || null
  const updated: AppSettings = {
    id: 1,
    default_currency_id: settings.default_currency_id || existing?.default_currency_id || 1,
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  state.settings = updated
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return updated
}

export async function getDefaultCurrency() {
  const settings = await getAppSettings()
  if (!settings) return null
  const currencies = await getCurrencies()
  return currencies.find((c) => c.id === settings.default_currency_id) || null
}

// Transaction operations
export async function addTransaction(transaction: NewTransaction) {
  const state = await readState()
  const id = remoteDb.nextId(state.transactions)
  const rec: Transaction = {
    id,
    ...transaction,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  state.transactions.push(rec)
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return id
}

export async function getTransactions(limit: number = 50, offset: number = 0) {
  const state = await readState()
  const allTransactions = state.transactions || []
  return allTransactions
    .slice()
    .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(offset, offset + limit)
}

export async function getTransactionsWithDetails(limit: number = 50, offset: number = 0) {
  const transactions = await getTransactions(limit, offset)
  const categories = await getCategories()
  const defaultCurrency = await getDefaultCurrency()
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  return transactions.map((t: any) => ({
    ...t,
    category_name: categoryMap.get(t.category_id)?.name || 'Unknown',
    currency_symbol: defaultCurrency?.symbol || '$',
  }))
}

export async function updateTransaction(transaction: Transaction) {
  const state = await readState()
  const idx = state.transactions.findIndex((t: any) => t.id === transaction.id)
  if (idx === -1) throw new Error('Transaction not found')
  state.transactions[idx] = { ...state.transactions[idx], ...transaction, updated_at: new Date().toISOString() }
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return transaction.id
}

export async function deleteTransaction(id: number) {
  const state = await readState()
  state.transactions = state.transactions.filter((t: any) => t.id !== id)
  await writeState(state)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finance:data:changed'))
  return true
}

// Analytics
export async function getIncomeAndExpenseForPeriod(startDate: string, endDate: string) {
  const state = await readState()
  const transactions = state.transactions || []
  const filtered = transactions.filter((t: any) => t.transaction_date >= startDate && t.transaction_date <= endDate)
  const income = filtered.filter((t: any) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter((t: any) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense }
}

export async function getSpendingByCategory(startDate: string, endDate: string) {
  const state = await readState()
  const transactions = state.transactions || []
  const categories = await getCategories()
  const filtered = transactions.filter((t: any) => t.type === 'expense' && t.transaction_date >= startDate && t.transaction_date <= endDate)
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const spending: { [key: string]: number } = {}
  filtered.forEach((t: any) => {
    const categoryName = categoryMap.get(t.category_id) || 'Unknown'
    spending[categoryName] = (spending[categoryName] || 0) + t.amount
  })
  return Object.entries(spending).map(([name, amount]) => ({ name, amount }))
}

export async function getIncomeByCategory(startDate: string, endDate: string) {
  const state = await readState()
  const transactions = state.transactions || []
  const categories = await getCategories()
  const filtered = transactions.filter((t: any) => t.type === 'income' && t.transaction_date >= startDate && t.transaction_date <= endDate)
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const income: { [key: string]: number } = {}
  filtered.forEach((t: any) => {
    const categoryName = categoryMap.get(t.category_id) || 'Unknown'
    income[categoryName] = (income[categoryName] || 0) + t.amount
  })
  return Object.entries(income).map(([name, amount]) => ({ name, amount }))
}

// Seed functions (to match React Native app)
export async function seedCurrencies() {
  const existing = await getCurrencies();
  if (existing.length > 0) return;

  const currencies = [
    ['USD', 'US Dollar', '$'],
    ['EUR', 'Euro', '€'],
    ['GBP', 'British Pound', '£'],
    ['JPY', 'Japanese Yen', '¥'],
    ['CAD', 'Canadian Dollar', 'C$'],
    ['AUD', 'Australian Dollar', 'A$'],
    ['CHF', 'Swiss Franc', 'CHF'],
    ['CNY', 'Chinese Yuan', '¥'],
    ['INR', 'Indian Rupee', '₹'],
    ['MUR', 'Mauritian Rupee', 'Rs'],
  ];

  for (const [code, name, symbol] of currencies) {
    await addCurrency({ code, name, symbol });
  }
}

export async function seedCategories() {
  const existing = await getCategories();
  if (existing.length > 0) return;

  const expenseCategories = [
    // Bills
    'Bills - Electricity', 'Bills - Water', 'Bills - Gas', 'Bills - Internet',
    'Bills - Phone',
    // Food
    'Food - Groceries', 'Food - Dining Out', 'Food - Snacks', 'Food - Takeaway',
    // Car Stuff
    'Car - Insurance', 'Car - Parking', 'Car - Fuel', 'Car - Repairs',
    // Health and Fitness
    'Health - Medical Visit', 'Health - Pharmacy', 'Health - Insurance', 'Health - Gym', 'Health - Supplements',
    // Personal & Shopping
    'Shopping - Clothing', 'Shopping - Beauty', 'Shopping - Electronics', 'Shopping - Home Supplies',
    // Education
    'Education - Courses', 'Education - Books',
    // Entertainment & Subscription
    'Entertainment - Streaming', 'Entertainment - Apps', 'Entertainment - Movies', 'Entertainment - Games',
    // Travel
    'Travel - Flights', 'Travel - Accommodation',
    // Gifts & Donation
    'Gifts - Gifts', 'Gifts - Donation',
    // Financial & Administrative
    'Financial - Loan Payments', 'Financial - Taxes', 'Financial - Fees',
    // Miscellaneous
    'Miscellaneous'
  ];

  const incomeCategories = [
    'Salary', 'Bonus', 'Freelance', 'Business Income', 'Interest Income',
    'Dividends', 'Refunds', 'Gifts', 'Sale of Assets', 'Other Income'
  ];

  // Add expense categories
  for (const category of expenseCategories) {
    await addCategory({ name: category, type: 'expense', is_default: true });
  }

  // Add income categories
  for (const category of incomeCategories) {
    await addCategory({ name: category, type: 'income', is_default: true });
  }
}

export async function initializeSettings() {
  const existing = await getAppSettings();
  if (existing) return;

  // Get USD currency ID
  const currencies = await getCurrencies();
  const usd = currencies.find(c => c.code === 'USD');

  if (usd) {
    await updateAppSettings({
      default_currency_id: usd.id!,
      created_at: new Date().toISOString(),
    });
  }
}