import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Spinner, useToast } from '../ui'
import { initials } from '../utils'

const ROLES = [
  ['pending', 'Pending (no access)'],
  ['secretary', 'Secretary'],
  ['treasurer', 'Treasurer'],
  ['admin', 'Admin'],
]

export default function Staff({ me }) {
  const toast = useToast()
  const [rows, setRows] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    if (error) toast(error.message, 'err')
    else setRows(data)
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const change = async (row, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', row.id)
    if (error) return toast(error.message, 'err')
    toast('Role updated')
    load()
  }

  if (!rows) return <Spinner />

  return (
    <div className="page">
      <h1 className="page-title">Staff</h1>
      <p className="muted">
        New staff sign up in the app and wait here. Give them a role to let them in. Secretaries manage
        members; treasurers manage giving.
      </p>
      <ul className="rows">
        {rows.map((r) => (
          <li key={r.id} className="row static">
            <span className="avatar">{initials(r.full_name || '?')}</span>
            <span className="row-main">
              <strong>{r.full_name}</strong>
              <small>{r.id === me.id ? 'You' : r.role === 'pending' ? 'Waiting for a role' : ''}</small>
            </span>
            <select
              value={r.role}
              disabled={r.id === me.id}
              onChange={(e) => change(r, e.target.value)}
              aria-label={`Role for ${r.full_name}`}
            >
              {ROLES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}
