const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 })

export const money = (value: string | number) => tl.format(Number(value))
export const qty = (value: string | number) => number.format(Number(value))
export const isLow = (stock: string, minStock: string) => Number(stock) <= Number(minStock)
