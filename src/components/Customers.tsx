import { useState } from 'react'
import type { Customer } from '../api'
import { money } from '../format'

interface Props {
  customers: Customer[]
  canEdit: boolean
  onPayment: (customer: Customer, amount: string) => Promise<void>
}

export function Customers({ customers, canEdit, onPayment }: Props) {
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const debtors = customers.filter((c) => Number(c.balance) > 0)

  return (
    <section className="panel">
      <h2>Veresiye defteri</h2>
      {debtors.length === 0 && <p className="empty">Borçlu müşteri yok</p>}
      <ul className="debtors">
        {debtors.map((c) => (
          <li key={c.id}>
            <span>{c.name}</span>
            <strong>{money(c.balance)}</strong>
            {canEdit && (
              <span className="inline">
                <input
                  aria-label={`${c.name} tahsilat`}
                  type="number"
                  min="1"
                  placeholder="Tahsilat"
                  value={amounts[c.id] ?? ''}
                  onChange={(e) => setAmounts({ ...amounts, [c.id]: e.target.value })}
                />
                <button
                  disabled={!amounts[c.id]}
                  onClick={async () => {
                    setError('')
                    try {
                      await onPayment(c, amounts[c.id])
                      setAmounts({ ...amounts, [c.id]: '' })
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Tahsilat kaydedilemedi')
                    }
                  }}
                >
                  Al
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="error">{error}</p>}
    </section>
  )
}
