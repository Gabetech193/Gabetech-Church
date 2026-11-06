import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { money, label } from '../utils'
import { Spinner } from '../ui'

const pad = (n) => String(n).padStart(2, '0')

function lastSixMonths() {
  const now = new Date()
  const out = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: d.toLocaleString('en-GB', { month: 'short' }),
      start: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
    })
  }
  return out
}

export default function Dashboard({ profile, goto }) {
  const seeMoney = profile.role === 'admin' || profile.role === 'treasurer'
  const months = useMemo(lastSixMonths, [])
  const [members, setMembers] = useState(null)
  const [giving, setGiving] = useState([])

  useEffect(() => {
    ;(async () => {
      const m = await supabase
        .from('members')
        .select('id,full_name,phone,status,date_of_birth,join_date')
        .limit(5000)
      setMembers(m.data || [])
      if (seeMoney) {
        const g = await supabase
          .from('giving')
          .select('giving_date,amount,giving_type')
          .gte('giving_date', months[0].start)
          .limit(20000)
        setGiving(g.data || [])
      }
    })()
  }, [seeMoney, months])

  if (!members) return <Spinner />

  const active = members.filter((m) => m.status === 'active')
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const newMembers = members.filter((m) => m.join_date && m.join_date >= thirtyAgo).length

  const totals = months.map((mo) =>
    giving.filter((g) => g.giving_date.startsWith(mo.key)).reduce((s, g) => s + Number(g.amount), 0)
  )
  const thisMonth = totals[5]
  const lastMonth = totals[4]
  const max = Math.max(...totals, 1)
  const byType = {}
  giving
    .filter((g) => g.giving_date.startsWith(months[5].key))
    .forEach((g) => {
      byType[g.giving_type] = (byType[g.giving_type] || 0) + Number(g.amount)
    })
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const mm = pad(new Date().getMonth() + 1)
  const birthdays = members
    .filter((m) => m.status !== 'deceased' && m.date_of_birth && m.date_of_birth.slice(5, 7) === mm)
    .sort((a, b) => a.date_of_birth.slice(8) - b.date_of_birth.slice(8))
    .slice(0, 8)

  const first = (profile.full_name || '').split(' ')[0]

  return (
    <div className="page">
      <h1 className="page-title">Welcome, {first}</h1>

      {seeMoney ? (
        <section className="hero">
          <div className="hero-top">
            <div>
              <span className="hero-label">Given this month</span>
              <div className="hero-figure">{money(thisMonth)}</div>
              <span className="hero-sub">
                {lastMonth > 0
                  ? `${thisMonth >= lastMonth ? 'Up' : 'Down'} ${Math.abs(
                      Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
                    )}% on last month`
                  : 'No giving recorded last month'}
              </span>
            </div>
          </div>
          <div className="bars" role="img" aria-label="Giving over the last six months">
            {months.map((mo, i) => (
              <div className="bar-col" key={mo.key}>
                <div className="bar-track">
                  <div
                    className={`bar ${i === 5 ? 'now' : ''}`}
                    style={{ height: `${Math.max((totals[i] / max) * 100, totals[i] > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span>{mo.label}</span>
              </div>
            ))}
          </div>
          {topTypes.length > 0 && (
            <div className="hero-types">
              {topTypes.map(([t, v]) => (
                <div key={t}>
                  <small>{label(t)}</small>
                  <strong>{money(v)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="hero">
          <span className="hero-label">Active members</span>
          <div className="hero-figure">{active.length}</div>
          <span className="hero-sub">{newMembers} joined in the last 30 days</span>
        </section>
      )}

      <div className="stat-row">
        <button className="stat" onClick={() => goto('members')}>
          <small>Active members</small>
          <strong>{active.length}</strong>
        </button>
        <div className="stat">
          <small>Joined in 30 days</small>
          <strong>{newMembers}</strong>
        </div>
        <div className="stat">
          <small>Visitors</small>
          <strong>{members.filter((m) => m.status === 'visitor').length}</strong>
        </div>
      </div>

      <section className="panel">
        <h2>Birthdays this month</h2>
        {birthdays.length === 0 ? (
          <p className="muted">No birthdays recorded for this month.</p>
        ) : (
          <ul className="plain">
            {birthdays.map((m) => (
              <li key={m.id}>
                <span>{m.full_name}</span>
                <span className="muted">
                  {Number(m.date_of_birth.slice(8))}{' '}
                  {new Date(m.date_of_birth + 'T00:00:00').toLocaleString('en-GB', { month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
