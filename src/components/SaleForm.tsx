import { useState, type FormEvent } from 'react'
import type { Customer, Product, SaleItemIn } from '../api'
import { money } from '../format'

interface Props {
  products: Product[]
  customers: Customer[]
  onSale: (items: SaleItemIn[], paymentType: 'cash' | 'credit', customerId?: number) => Promise<string>
}

interface Line {
  productId: string
  quantity: string
}

export function SaleForm({ products, customers, onSale }: Props) {
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '1' }])
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')
  const [customerId, setCustomerId] = useState('')
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const total = lines.reduce((sum, line) => {
    const product = products.find((p) => String(p.id) === line.productId)
    return sum + (product ? Number(product.sale_price) * Number(line.quantity || 0) : 0)
  }, 0)

  function update(index: number, change: Partial<Line>) {
    setLines(lines.map((line, i) => (i === index ? { ...line, ...change } : line)))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const items = lines.filter((l) => l.productId && Number(l.quantity) > 0).map((l) => ({ product_id: Number(l.productId), quantity: l.quantity }))
    if (items.length === 0) return setResult({ ok: false, text: 'En az bir ürün seçin' })
    if (paymentType === 'credit' && !customerId) return setResult({ ok: false, text: 'Veresiye satış için müşteri seçin' })
    try {
      const text = await onSale(items, paymentType, customerId ? Number(customerId) : undefined)
      setResult({ ok: true, text })
      setLines([{ productId: '', quantity: '1' }])
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Satış yapılamadı' })
    }
  }

  return (
    <section className="panel">
      <h2>Satış</h2>
      <form onSubmit={submit} className="sale">
        {lines.map((line, index) => (
          <div className="row" key={index}>
            <select aria-label={`Ürün ${index + 1}`} value={line.productId} onChange={(e) => update(index, { productId: e.target.value })}>
              <option value="">Ürün seçin</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({money(p.sale_price)})
                </option>
              ))}
            </select>
            <input aria-label={`Miktar ${index + 1}`} type="number" min="1" value={line.quantity} onChange={(e) => update(index, { quantity: e.target.value })} />
          </div>
        ))}
        <button type="button" className="link" onClick={() => setLines([...lines, { productId: '', quantity: '1' }])}>
          + Kalem ekle
        </button>
        <div className="row">
          <label>
            <input type="radio" checked={paymentType === 'cash'} onChange={() => setPaymentType('cash')} /> Nakit
          </label>
          <label>
            <input type="radio" checked={paymentType === 'credit'} onChange={() => setPaymentType('credit')} /> Veresiye
          </label>
          {paymentType === 'credit' && (
            <select aria-label="Müşteri" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Müşteri seçin</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="row total">
          <span>Toplam: {money(total)}</span>
          <button type="submit">Satışı kaydet</button>
        </div>
        {result && (
          <p role={result.ok ? 'status' : 'alert'} className={result.ok ? 'ok' : 'error'}>
            {result.text}
          </p>
        )}
      </form>
    </section>
  )
}
