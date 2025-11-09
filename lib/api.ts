// Frontend API client for communicating with the backend

const API_BASE = '/api'

// Helper for making authenticated API calls
async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  async signIn(token: string) {
    return apiCall('/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  async signOut() {
    return apiCall('/auth/signout', { method: 'POST' })
  },

  async getCurrentUser() {
    return apiCall('/auth/me')
  },
}

// Transactions API
export const transactionsApi = {
  async getAll(limit = 50, offset = 0) {
    return apiCall(`/transactions?limit=${limit}&offset=${offset}`)
  },

  async getById(id: number) {
    return apiCall(`/transactions/${id}`)
  },

  async create(data: {
    category_id: number
    amount: number
    description?: string
    transaction_date: string
    type: 'income' | 'expense'
  }) {
    return apiCall('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(
    id: number,
    data: {
      category_id: number
      amount: number
      description?: string
      transaction_date: string
      type: 'income' | 'expense'
    }
  ) {
    return apiCall(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: number) {
    return apiCall(`/transactions/${id}`, { method: 'DELETE' })
  },
}

// Categories API
export const categoriesApi = {
  async getAll(type?: 'income' | 'expense') {
    const query = type ? `?type=${type}` : ''
    return apiCall(`/categories${query}`)
  },

  async getById(id: number) {
    return apiCall(`/categories/${id}`)
  },

  async create(data: {
    name: string
    type: 'income' | 'expense'
    is_default?: boolean
  }) {
    return apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(
    id: number,
    data: {
      name: string
      type: 'income' | 'expense'
      is_default?: boolean
    }
  ) {
    return apiCall(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: number) {
    return apiCall(`/categories/${id}`, { method: 'DELETE' })
  },
}

// Currencies API
export const currenciesApi = {
  async getAll() {
    return apiCall('/currencies')
  },
}

// Settings API
export const settingsApi = {
  async get() {
    return apiCall('/settings')
  },

  async update(data: { default_currency_id?: number; is_hidden?: boolean }) {
    return apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// Analytics API
export const analyticsApi = {
  async get(startDate: string, endDate: string) {
    return apiCall(`/analytics?start_date=${startDate}&end_date=${endDate}`)
  },

  async getDetailed(startDate: string, endDate: string) {
    return apiCall(`/analytics/detailed?start_date=${startDate}&end_date=${endDate}`)
  },
}

// Re-export for backward compatibility
export {
  transactionsApi as transactions,
  categoriesApi as categories,
  currenciesApi as currencies,
  settingsApi as settings,
  analyticsApi as analytics,
}
