import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiError, type StokApi } from './api'

const products = [
  { id: 1, name: 'Çekiç', unit: 'adet', purchase_price: '80.00', sale_price: '120.00', stock: '23.000', min_stock: '5.000' },
  { id: 2, name: 'Silikon', unit: 'adet', purchase_price: '60.00', sale_price: '95.00', stock: '4.000', min_stock: '6.000' },
]
const customers = [{ id: 1, name: 'Mehmet Usta', phone: null, balance: '450.00' }]
const report = { sale_count: 1, revenue: '450.00', cost: '295.00', gross_profit: '155.00', receivables: '450.00' }

function fakeApi(token: string | null = null) {
  const api = {
    token,
    login: vi.fn(async (_u: string, password: string) => {
      if (password !== 'demo1234') throw new ApiError(401, 'Wrong username or password')
      api.token = 'abc'
      return 'abc'
    }),
    products: vi.fn(async (search = '') => (search ? products.filter((p) => p.name.toLowerCase().includes('çek')) : products)),
    lowStock: vi.fn(async () => [products[1]]),
    customers: vi.fn(async () => customers),
    profit: vi.fn(async () => report),
    purchase: vi.fn(async () => ({})),
    sale: vi.fn(async () => ({ id: 7, total: '240.00', payment_type: 'cash' })),
    payment: vi.fn(async () => customers[0]),
  }
  return api
}

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('shows the summary and products without login', async () => {
    render(<App api={fakeApi() as unknown as StokApi} />)

    expect(await screen.findByText('Çekiç')).toBeInTheDocument()
    expect(screen.getByLabelText('Özet')).toHaveTextContent('Kritik stok1')
    expect(screen.getByText('kritik')).toBeInTheDocument()
    expect(screen.queryByText('Satışı kaydet')).not.toBeInTheDocument()
  })

  it('shows the API error for a wrong password', async () => {
    render(<App api={fakeApi() as unknown as StokApi} />)
    await screen.findByText('Çekiç')

    await userEvent.type(screen.getByLabelText('Şifre'), 'yanlis')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password')
  })

  it('logs in and records a sale', async () => {
    const api = fakeApi()
    render(<App api={api as unknown as StokApi} />)
    await screen.findByText('Çekiç')

    await userEvent.type(screen.getByLabelText('Şifre'), 'demo1234')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
    await userEvent.selectOptions(await screen.findByLabelText('Ürün 1'), '1')
    await userEvent.clear(screen.getByLabelText('Miktar 1'))
    await userEvent.type(screen.getByLabelText('Miktar 1'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Satışı kaydet' }))

    expect(api.sale).toHaveBeenCalledWith([{ product_id: 1, quantity: '2' }], 'cash', undefined)
    expect(await screen.findByRole('status')).toHaveTextContent('Satış #7 kaydedildi')
    expect(localStorage.getItem('stok-panel-token')).toBe('abc')
  })

  it('asks for a customer before a credit sale', async () => {
    const api = fakeApi('abc')
    render(<App api={api as unknown as StokApi} />)

    await userEvent.selectOptions(await screen.findByLabelText('Ürün 1'), '1')
    await userEvent.click(screen.getByLabelText(/Veresiye/))
    await userEvent.click(screen.getByRole('button', { name: 'Satışı kaydet' }))

    expect(await screen.findByText('Veresiye satış için müşteri seçin')).toBeInTheDocument()
    expect(api.sale).not.toHaveBeenCalled()
  })

  it('searches on the server', async () => {
    const api = fakeApi()
    render(<App api={api as unknown as StokApi} />)
    await screen.findByText('Silikon')

    await userEvent.type(screen.getByLabelText('Ürün ara'), 'çek')

    const table = screen.getByRole('table')
    await vi.waitFor(() => expect(within(table).queryByText('Silikon')).not.toBeInTheDocument())
    expect(api.products).toHaveBeenLastCalledWith('çek')
  })
})
