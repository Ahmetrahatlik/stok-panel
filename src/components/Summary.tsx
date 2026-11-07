import type { Product, ProfitReport } from '../api'
import { money } from '../format'

interface Props {
  report: ProfitReport | null
  products: Product[]
  lowStock: Product[]
}

export function Summary({ report, products, lowStock }: Props) {
  const cards = [
    { label: 'Ürün çeşidi', value: String(products.length) },
    { label: 'Kritik stok', value: String(lowStock.length), warn: lowStock.length > 0 },
    { label: 'Ciro', value: report ? money(report.revenue) : '–' },
    { label: 'Brüt kâr', value: report ? money(report.gross_profit) : '–' },
    { label: 'Veresiye alacak', value: report ? money(report.receivables) : '–' },
  ]
  return (
    <section className="cards" aria-label="Özet">
      {cards.map((card) => (
        <div key={card.label} className={`card${card.warn ? ' warn' : ''}`}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </div>
      ))}
    </section>
  )
}
