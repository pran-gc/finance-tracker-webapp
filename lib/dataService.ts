import { query } from './database'

// Types
export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  is_active: boolean
  created_at: Date
}

export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  is_active: boolean
  created_at: Date
}

export interface Transaction {
  id: number
  user_id: number
  category_id: number
  amount: number
  description: string | null
  transaction_date: string
  type: 'income' | 'expense'
  created_at: Date
  updated_at: Date
}

export interface AppSettings {
  id: number
  user_id: number
  default_currency_id: number
  last_backup_time: Date | null
  created_at: Date
  updated_at: Date
}

// Currency operations
export async function getCurrencies(): Promise<Currency[]> {
  return await query<Currency[]>(
    'SELECT id, code, name, symbol, is_active, created_at FROM currencies WHERE is_active = TRUE ORDER BY code'
  )
}

export async function getCurrencyById(id: number): Promise<Currency | null> {
  const currencies = await query<Currency[]>(
    'SELECT id, code, name, symbol, is_active, created_at FROM currencies WHERE id = ?',
    [id]
  )
  return currencies.length > 0 ? currencies[0] : null
}

// Category operations (global - shared across all users)
export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  if (type) {
    return await query<Category[]>(
      'SELECT id, name, type, is_active, created_at FROM categories WHERE type = ? AND is_active = TRUE ORDER BY name',
      [type]
    )
  }
  return await query<Category[]>(
    'SELECT id, name, type, is_active, created_at FROM categories WHERE is_active = TRUE ORDER BY type, name'
  )
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const categories = await query<Category[]>(
    'SELECT id, name, type, is_active, created_at FROM categories WHERE id = ?',
    [id]
  )
  return categories.length > 0 ? categories[0] : null
}

export async function createCategory(name: string, type: 'income' | 'expense'): Promise<number> {
  const result = await query<mysql.ResultSetHeader>(
    'INSERT INTO categories (name, type, is_active) VALUES (?, ?, TRUE)',
    [name, type]
  )
  return result.insertId
}

export async function updateCategory(id: number, name: string, type: 'income' | 'expense'): Promise<void> {
  await query(
    'UPDATE categories SET name = ?, type = ? WHERE id = ?',
    [name, type, id]
  )
}

export async function deleteCategory(id: number): Promise<void> {
  // Soft delete by setting is_active to FALSE
  await query(
    'UPDATE categories SET is_active = FALSE WHERE id = ?',
    [id]
  )
}

// Transaction operations
export async function getTransactions(userId: number, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
  return await query<Transaction[]>(
    'SELECT id, user_id, category_id, amount, description, transaction_date, type, created_at, updated_at FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  )
}

export async function getTransactionsWithDetails(userId: number, limit: number = 50, offset: number = 0) {
  return await query<any[]>(
    `SELECT
      t.id,
      t.user_id,
      t.category_id,
      t.amount,
      t.description,
      t.transaction_date,
      t.type,
      t.created_at,
      t.updated_at,
      c.name as category_name,
      curr.symbol as currency_symbol
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN app_settings s ON s.user_id = t.user_id
    JOIN currencies curr ON curr.id = s.default_currency_id
    WHERE t.user_id = ?
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  )
}

export async function getTransactionById(userId: number, id: number): Promise<Transaction | null> {
  const transactions = await query<Transaction[]>(
    'SELECT id, user_id, category_id, amount, description, transaction_date, type, created_at, updated_at FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return transactions.length > 0 ? transactions[0] : null
}

export async function createTransaction(
  userId: number,
  categoryId: number,
  amount: number,
  description: string | null,
  transactionDate: string,
  type: 'income' | 'expense'
): Promise<number> {
  // Verify category exists
  const category = await getCategoryById(categoryId)
  if (!category) {
    throw new Error('Invalid category')
  }

  const result = await query<mysql.ResultSetHeader>(
    'INSERT INTO transactions (user_id, category_id, amount, description, transaction_date, type) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, categoryId, amount, description, transactionDate, type]
  )
  return result.insertId
}

export async function updateTransaction(
  userId: number,
  id: number,
  categoryId: number,
  amount: number,
  description: string | null,
  transactionDate: string,
  type: 'income' | 'expense'
): Promise<void> {
  // Verify category exists
  const category = await getCategoryById(categoryId)
  if (!category) {
    throw new Error('Invalid category')
  }

  await query(
    'UPDATE transactions SET category_id = ?, amount = ?, description = ?, transaction_date = ?, type = ? WHERE id = ? AND user_id = ?',
    [categoryId, amount, description, transactionDate, type, id, userId]
  )
}

export async function deleteTransaction(userId: number, id: number): Promise<void> {
  await query(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId]
  )
}

// App settings operations
export async function getAppSettings(userId: number): Promise<AppSettings | null> {
  const settings = await query<AppSettings[]>(
    'SELECT id, user_id, default_currency_id, last_backup_time, created_at, updated_at FROM app_settings WHERE user_id = ?',
    [userId]
  )
  return settings.length > 0 ? settings[0] : null
}

export async function updateAppSettings(userId: number, defaultCurrencyId: number): Promise<void> {
  const existing = await getAppSettings(userId)

  if (existing) {
    await query(
      'UPDATE app_settings SET default_currency_id = ? WHERE user_id = ?',
      [defaultCurrencyId, userId]
    )
  } else {
    await query(
      'INSERT INTO app_settings (user_id, default_currency_id) VALUES (?, ?)',
      [userId, defaultCurrencyId]
    )
  }
}

export async function getDefaultCurrency(userId: number): Promise<Currency | null> {
  const settings = await getAppSettings(userId)
  if (!settings) return null

  return await getCurrencyById(settings.default_currency_id)
}

// Analytics (exclude Opening Balance from calculations)
export async function getIncomeAndExpenseForPeriod(userId: number, startDate: string, endDate: string) {
  const results = await query<any[]>(
    `SELECT
      t.type,
      COALESCE(SUM(t.amount), 0) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
      AND c.name != 'Opening Balance'
    GROUP BY t.type`,
    [userId, startDate, endDate]
  )

  const income = results.find(r => r.type === 'income')?.total || 0
  const expense = results.find(r => r.type === 'expense')?.total || 0

  return { income, expense }
}

export async function getSpendingByCategory(userId: number, startDate: string, endDate: string) {
  return await query<{ name: string; amount: number }[]>(
    `SELECT
      c.name,
      SUM(t.amount) as amount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND t.transaction_date >= ? AND t.transaction_date <= ?
      AND c.name != 'Opening Balance'
    GROUP BY c.id, c.name
    ORDER BY amount DESC`,
    [userId, startDate, endDate]
  )
}

export async function getIncomeByCategory(userId: number, startDate: string, endDate: string) {
  return await query<{ name: string; amount: number }[]>(
    `SELECT
      c.name,
      SUM(t.amount) as amount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'income' AND t.transaction_date >= ? AND t.transaction_date <= ?
      AND c.name != 'Opening Balance'
    GROUP BY c.id, c.name
    ORDER BY amount DESC`,
    [userId, startDate, endDate]
  )
}

// Import mysql types
import type mysql from 'mysql2/promise'
