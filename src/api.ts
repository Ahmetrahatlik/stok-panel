// Small typed client for the Stok API.

export const API_URL = (import.meta.env.VITE_API_URL ?? 'https://stok-api-demo.onrender.com').replace(/\/$/, '')

export interface Product {
  id: number
  name: string
  unit: string
  purchase_price: string
  sale_price: string
  stock: string
  min_stock: string
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  balance: string
}

export interface ProfitReport {
  sale_count: number
  revenue: string
  cost: string
  gross_profit: string
  receivables: string
}

export interface SaleItemIn {
  product_id: number
  quantity: string
}

export interface Sale {
  id: number
  total: string
  payment_type: 'cash' | 'credit'
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// FastAPI errors come as {"detail": "..."} or {"detail": {"message", "items"}} or a list of validation errors.
export function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => (d as { msg?: string }).msg ?? '').filter(Boolean).join(', ')
  if (detail && typeof detail === 'object') {
    const { message, items } = detail as { message?: string; items?: string[] }
    return [message, ...(items ?? [])].filter(Boolean).join(' – ')
  }
  return `İstek başarısız (${status})`
}

export class StokApi {
  token: string | null
  private fetcher: typeof fetch

  constructor(token: string | null = null, fetcher: typeof fetch = (...args) => fetch(...args)) {
    this.token = token
    this.fetcher = fetcher
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`)
    if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json')
    const response = await this.fetcher(`${API_URL}${path}`, { ...init, headers })
    const body = await response.json().catch(() => null)
    if (!response.ok) throw new ApiError(response.status, errorMessage(body, response.status))
    return body as T
  }

  async login(username: string, password: string): Promise<string> {
    const form = new URLSearchParams({ username, password })
    const result = await this.request<{ access_token: string }>('/auth/token', { method: 'POST', body: form })
    this.token = result.access_token
    return result.access_token
  }

  products(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return this.request<Product[]>(`/products${query}`)
  }

  lowStock() {
    return this.request<Product[]>('/products/low-stock')
  }

  customers(withDebt = false) {
    return this.request<Customer[]>(`/customers${withDebt ? '?with_debt=true' : ''}`)
  }

  profit() {
    return this.request<ProfitReport>('/reports/profit')
  }

  purchase(productId: number, quantity: string) {
    return this.request('/stock/purchases', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) })
  }

  sale(items: SaleItemIn[], paymentType: 'cash' | 'credit', customerId?: number) {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify({ items, payment_type: paymentType, customer_id: customerId ?? null }),
    })
  }

  payment(customerId: number, amount: string) {
    return this.request<Customer>(`/customers/${customerId}/payments`, { method: 'POST', body: JSON.stringify({ amount }) })
  }
}
