import { useCallback, useEffect, useState } from 'react'
import { supabase, configured } from './supabase'
import { ToastProvider, Icon, Spinner } from './ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Giving from './pages/Giving'
import Staff from './pages/Staff'

const NAV = [
  { id: 'home', label: 'Home', icon: 'home', roles: ['admin', 'treasurer', 'secretary'] },
  { id: 'members', label: 'Members', icon: 'users', roles: ['admin', 'treasurer', 'secretary'] },
  { id: 'giving', label: 'Giving', icon: 'heart', roles: ['admin', 'treasurer'] },
  { id: 'staff', label: 'Staff', icon: 'shield', roles: ['admin'] },
]

function SetupNotice() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Almost there</h1>
        <p>
          This app needs your Supabase details. Add <b>VITE_SUPABASE_URL</b> and{' '}
          <b>VITE_SUPABASE_ANON_KEY</b> as environment variables, then redeploy.
        </p>
      </div>
    </div>
  )
}

function Shell() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)
  const [page, setPage] = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) {
      setProfile(undefined)
      return
    }
    loadProfile(session.user.id)
  }, [session, loadProfile])

  const signOut = () => supabase.auth.signOut()

  if (session === undefined) return <Spinner />
  if (!session) return <Login />
  if (profile === undefined) return <Spinner />

  if (!profile || profile.role === 'pending') {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Waiting for access</h1>
          <p>
            {profile
              ? 'Your account is created. The church admin needs to give you a role before you can continue.'
              : 'Your account has no staff profile yet. Ask the admin to check your account.'}
          </p>
          <button className="btn ghost" onClick={signOut}>
            Sign out
          </button>
          <button className="btn" onClick={() => loadProfile(session.user.id)}>
            Check again
          </button>
        </div>
      </div>
    )
  }

  const role = profile.role
  const items = NAV.filter((n) => n.roles.includes(role))
  const current = items.find((n) => n.id === page) ? page : 'home'

  let view = null
  if (current === 'home') view = <Dashboard profile={profile} goto={setPage} />
  if (current === 'members') view = <Members role={role} />
  if (current === 'giving') view = <Giving role={role} />
  if (current === 'staff') view = <Staff me={profile} />

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <strong>Gabetech</strong>
            <small>Church Management</small>
          </div>
        </div>
        <nav>
          {items.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${current === n.id ? 'on' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <Icon name={n.icon} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div>
            <strong>{profile.full_name}</strong>
            <small>{profile.role}</small>
          </div>
          <button className="link" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" />
            <strong>Gabetech Church</strong>
          </div>
          <button className="link light" onClick={signOut}>
            Sign out
          </button>
        </header>
        <main className="content">{view}</main>
      </div>

      <nav className="tabs" aria-label="Main">
        {items.map((n) => (
          <button
            key={n.id}
            className={`tab ${current === n.id ? 'on' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return <ToastProvider>{configured ? <Shell /> : <SetupNotice />}</ToastProvider>
}
