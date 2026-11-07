import { describe, expect, it, vi } from 'vitest'
import { ApiError, StokApi, errorMessage } from './api'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('errorMessage', () => {
  it('reads every FastAPI error shape', () => {
    expect(errorMessage({ detail: 'Product 9 not found' }, 404)).toBe('Product 9 not found')
    expect(errorMessage({ detail: { message: 'Insufficient stock', items: ['Çekiç: 2 in stock'] } }, 409)).toBe(
      'Insufficient stock – Çekiç: 2 in stock',
    )
    expect(errorMessage({ detail: [{ msg: 'Field required' }] }, 422)).toBe('Field required')
    expect(errorMessage(null, 500)).toBe('İstek başarısız (500)')
  })
})

describe('StokApi', () => {
  it('logs in with a form body and sends the token afterwards', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'abc' }))
      .mockResolvedValueOnce(jsonResponse(201, { id: 1, total: '120.00', payment_type: 'cash' }))
    const api = new StokApi(null, fetcher)

    await api.login('demo', 'demo1234')
    const [, loginInit] = fetcher.mock.calls[0]
    expect(loginInit.body.toString()).toBe('username=demo&password=demo1234')

    await api.sale([{ product_id: 1, quantity: '1' }], 'cash')
    const [url, saleInit] = fetcher.mock.calls[1]
    expect(url).toMatch(/\/sales$/)
    expect(saleInit.headers.get('Authorization')).toBe('Bearer abc')
    expect(JSON.parse(saleInit.body)).toEqual({ items: [{ product_id: 1, quantity: '1' }], payment_type: 'cash', customer_id: null })
  })

  it('turns error responses into ApiError with a readable message', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'Wrong username or password' }))
    const api = new StokApi(null, fetcher)
    await expect(api.login('demo', 'yanlis')).rejects.toEqual(new ApiError(401, 'Wrong username or password'))
  })

  it('encodes Turkish search text', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(200, []))
    await new StokApi(null, fetcher).products('çek')
    expect(fetcher.mock.calls[0][0]).toMatch(/\/products\?search=%C3%A7ek$/)
  })
})
