import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [mode, setMode] = useState('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg({ kind: 'err', text: error.message })
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) setMsg({ kind: 'err', text: error.message })
      else if (!data.session)
        setMsg({
          kind: 'ok',
          text: 'Account created. Check your email to confirm it, then sign in.',
        })
    }
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="brand-mark big" />
        <h1>Gabetech Church Management</h1>
        <p>{mode === 'in' ? 'Sign in to continue.' : 'Create your staff account.'}</p>

        {mode === 'up' && (
          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          />
        </label>

        {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

        <button className="btn" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          className="link center"
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in')
            setMsg(null)
          }}
        >
          {mode === 'in' ? 'New staff member? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
