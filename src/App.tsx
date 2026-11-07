import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_URL, StokApi, type Customer, type Product, type ProfitReport } from './api'
import { Customers } from './components/Customers'
import { Login } from './components/Login'
import { Products } from './components/Products'
import { SaleForm } from './components/SaleForm'
import { Summary } from './components/Summary'
import { money } from './format'
import './App.css'

const TOKEN_KEY = 'stok-panel-token'

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

interface AppProps {
  api?: StokApi
}

export default function App({ api: injected }: AppProps) {
  const api = useMemo(() => injected ?? new StokApi(readToken()), [injected])
  const [loggedIn, setLoggedIn] = useState(Boolean(api.token))
  const [products, setProducts] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [report, setReport] = useState<ProfitReport | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const refresh = useCallback(async () => {
    try {
      const [all, low, people, profit] = await Promise.all([api.products(), api.lowStock(), api.customers(), api.profit()])
      setProducts(all)
      setLowStock(low)
      setCustomers(people)
      setReport(profit)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [api])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Search runs on the server, so Turkish letters (Ç, İ) match the API's own rules.
  const [visible, setVisible] = useState<Product[]>([])
  useEffect(() => {
    if (!search) return setVisible(products)
    const timer = setTimeout(() => {
      api.products(search).then(setVisible).catch(() => setVisible([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [api, search, products])

  async function login(username: string, password: string) {
    const token = await api.login(username, password)
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Private mode: stay logged in for this tab only.
    }
    setLoggedIn(true)
  }

  function logout() {
    api.token = null
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // ignore
    }
    setLoggedIn(false)
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Stok Paneli</h1>
          <p className="sub">Hırdavat dükkânı için stok, satış ve veresiye takibi</p>
        </div>
        {loggedIn ? (
          <button className="link" onClick={logout}>
            Çıkış yap
          </button>
        ) : (
          <Login onLogin={login} />
        )}
      </header>

      {status === 'loading' && <p className="notice">Sunucu uyanıyor olabilir, ilk açılış 50 saniyeyi bulabilir…</p>}
      {status === 'error' && (
        <p className="notice error">
          API'ye ulaşılamadı ({API_URL}). <button onClick={refresh}>Tekrar dene</button>
        </p>
      )}

      {status === 'ready' && (
        <>
          <Summary report={report} products={products} lowStock={lowStock} />
          {!loggedIn && <p className="notice">Görüntülemek serbest. Satış ve mal girişi için giriş yapın.</p>}
          <div className="grid">
            <Products
              products={visible}
              search={search}
              onSearch={setSearch}
              canEdit={loggedIn}
              onPurchase={async (product, quantity) => {
                await api.purchase(product.id, quantity)
                await refresh()
              }}
            />
            <div className="side">
              {loggedIn && (
                <SaleForm
                  products={products}
                  customers={customers}
                  onSale={async (items, paymentType, customerId) => {
                    const sale = await api.sale(items, paymentType, customerId)
                    await refresh()
                    return `Satış #${sale.id} kaydedildi: ${money(sale.total)}`
                  }}
                />
              )}
              <Customers
                customers={customers}
                canEdit={loggedIn}
                onPayment={async (customer, amount) => {
                  await api.payment(customer.id, amount)
                  await refresh()
                }}
              />
            </div>
          </div>
        </>
      )}
      <footer>
        <a href="https://github.com/Ahmetrahatlik/stok-panel">Kaynak kod</a> · <a href={`${API_URL}/docs`}>API dokümantasyonu</a>
      </footer>
    </div>
  )
}
