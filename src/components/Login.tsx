import { useState, type FormEvent } from 'react'

interface Props {
  onLogin: (username: string, password: string) => Promise<void>
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <input aria-label="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input aria-label="Şifre" type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={busy}>
        {busy ? 'Giriliyor…' : 'Giriş yap'}
      </button>
      <span className="hint">Demo: demo / demo1234</span>
      {error && <span role="alert" className="error">{error}</span>}
    </form>
  )
}
