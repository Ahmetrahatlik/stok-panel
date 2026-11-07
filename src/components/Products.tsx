import { useState } from 'react'
import type { Product } from '../api'
import { isLow, money, qty } from '../format'

interface Props {
  products: Product[]
  search: string
  onSearch: (value: string) => void
  canEdit: boolean
  onPurchase: (product: Product, quantity: string) => Promise<void>
}

export function Products({ products, search, onSearch, canEdit, onPurchase }: Props) {
  const [amounts, setAmounts] = useState<Record<number, string>>({})

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Ürünler</h2>
        <input aria-label="Ürün ara" placeholder="Ürün ara (ör. çekiç)" value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Stok</th>
            <th>Alış</th>
            <th>Satış</th>
            {canEdit && <th>Mal girişi</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={isLow(p.stock, p.min_stock) ? 'low' : undefined}>
              <td>{p.name}</td>
              <td>
                {qty(p.stock)} {p.unit}
                {isLow(p.stock, p.min_stock) && <span className="badge">kritik</span>}
              </td>
              <td>{money(p.purchase_price)}</td>
              <td>{money(p.sale_price)}</td>
              {canEdit && (
                <td className="inline">
                  <input
                    aria-label={`${p.name} giriş miktarı`}
                    type="number"
                    min="1"
                    value={amounts[p.id] ?? ''}
                    onChange={(e) => setAmounts({ ...amounts, [p.id]: e.target.value })}
                  />
                  <button
                    disabled={!amounts[p.id]}
                    onClick={async () => {
                      await onPurchase(p, amounts[p.id])
                      setAmounts({ ...amounts, [p.id]: '' })
                    }}
                  >
                    Ekle
                  </button>
                </td>
              )}
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                Ürün bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
