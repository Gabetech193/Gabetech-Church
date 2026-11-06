import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { Modal, Field, Spinner, Empty, useToast } from '../ui'
import { initials, label } from '../utils'

const STATUSES = ['active', 'inactive', 'visitor', 'transferred', 'deceased']
const BLANK = {
  full_name: '',
  phone: '',
  email: '',
  gender: '',
  date_of_birth: '',
  marital_status: '',
  occupation: '',
  address: '',
  group_id: '',
  status: 'active',
  baptized: false,
  join_date: '',
  anniversary_date: '',
  notes: '',
}

function MemberForm({ member, groups, canWrite, canDelete, onSaved, onClose }) {
  const toast = useToast()
  const isNew = !member.id
  const [form, setForm] = useState(() => {
    const f = { ...BLANK }
    Object.keys(BLANK).forEach((k) => {
      if (member[k] !== undefined && member[k] !== null) f[k] = member[k]
    })
    return f
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = { ...form, full_name: form.full_name.trim() }
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null
    })
    const q = isNew
      ? supabase.from('members').insert(payload)
      : supabase.from('members').update(payload).eq('id', member.id)
    const { error } = await q
    setBusy(false)
    if (error) return toast(error.message, 'err')
    toast(isNew ? 'Member added' : 'Member updated')
    onSaved()
  }

  const remove = async () => {
    if (!window.confirm(`Delete ${member.full_name}? This cannot be undone.`)) return
    const { error } = await supabase.from('members').delete().eq('id', member.id)
    if (error) return toast(error.message, 'err')
    toast('Member deleted')
    onSaved()
  }

  return (
    <Modal
      title={isNew ? 'Add member' : member.full_name}
      onClose={onClose}
      footer={
        canWrite ? (
          <>
            {!isNew && canDelete && (
              <button type="button" className="btn danger ghost" onClick={remove}>
                Delete
              </button>
            )}
            <button type="submit" form="member-form" className="btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save member'}
            </button>
          </>
        ) : (
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        )
      }
    >
      <form id="member-form" onSubmit={save}>
        <fieldset disabled={!canWrite} className="grid">
          <Field label="Full name" wide>
            <input value={form.full_name} onChange={set('full_name')} required />
          </Field>
          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07…" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={set('gender')}>
              <option value="">Not set</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
          </Field>
          <Field label="Marital status">
            <select value={form.marital_status} onChange={set('marital_status')}>
              <option value="">Not set</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </select>
          </Field>
          <Field label="Occupation">
            <input value={form.occupation} onChange={set('occupation')} />
          </Field>
          <Field label="Group">
            <select value={form.group_id} onChange={set('group_id')}>
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date joined">
            <input type="date" value={form.join_date} onChange={set('join_date')} />
          </Field>
          <Field label="Wedding anniversary">
            <input type="date" value={form.anniversary_date} onChange={set('anniversary_date')} />
          </Field>
          <Field label="Address" wide>
            <input value={form.address} onChange={set('address')} />
          </Field>
          <label className="check wide">
            <input type="checkbox" checked={form.baptized} onChange={set('baptized')} />
            <span>Baptized</span>
          </label>
          <Field label="Notes" wide>
            <textarea rows="3" value={form.notes} onChange={set('notes')} />
          </Field>
        </fieldset>
      </form>
    </Modal>
  )
}

function GroupsModal({ groups, canDelete, onClose, onChanged }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState('department')

  const add = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('groups').insert({ name: name.trim(), group_type: type })
    if (error) return toast(error.message, 'err')
    setName('')
    toast('Group added')
    onChanged()
  }
  const remove = async (g) => {
    if (!window.confirm(`Delete group "${g.name}"? Members stay, but lose this group.`)) return
    const { error } = await supabase.from('groups').delete().eq('id', g.id)
    if (error) return toast(error.message, 'err')
    toast('Group deleted')
    onChanged()
  }

  return (
    <Modal title="Groups" onClose={onClose}>
      <form className="inline-form" onSubmit={add}>
        <input placeholder="e.g. Youth, Choir, Cell Group A" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="department">Department</option>
          <option value="cell_group">Cell group</option>
          <option value="ministry">Ministry</option>
          <option value="other">Other</option>
        </select>
        <button className="btn">Add</button>
      </form>
      {groups.length === 0 ? (
        <p className="muted">No groups yet. Add your first one above.</p>
      ) : (
        <ul className="plain">
          {groups.map((g) => (
            <li key={g.id}>
              <span>
                {g.name} <small className="muted">{label(g.group_type)}</small>
              </span>
              {canDelete && (
                <button className="link danger" onClick={() => remove(g)}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export default function Members({ role }) {
  const toast = useToast()
  const canWrite = role === 'admin' || role === 'secretary'
  const canDelete = role === 'admin'
  const [members, setMembers] = useState(null)
  const [groups, setGroups] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')
  const [editing, setEditing] = useState(null)
  const [showGroups, setShowGroups] = useState(false)

  const load = useCallback(async () => {
    const [m, g] = await Promise.all([
      supabase.from('members').select('*').order('full_name').limit(5000),
      supabase.from('groups').select('*').order('name'),
    ])
    if (m.error) toast(m.error.message, 'err')
    else setMembers(m.data)
    if (!g.error) setGroups(g.data)
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const groupName = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.name])), [groups])

  const list = useMemo(() => {
    if (!members) return []
    const s = q.trim().toLowerCase()
    return members.filter(
      (m) =>
        (status === 'all' || m.status === status) &&
        (!s ||
          m.full_name.toLowerCase().includes(s) ||
          (m.phone || '').includes(s) ||
          (m.member_no || '').toLowerCase().includes(s))
    )
  }, [members, q, status])

  if (!members) return <Spinner />

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Members</h1>
        <div className="actions">
          <button className="btn ghost" onClick={() => setShowGroups(true)}>
            Groups
          </button>
          {canWrite && (
            <button className="btn" onClick={() => setEditing({})}>
              Add member
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search name, phone or member no."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      <p className="muted count">
        {list.length} {list.length === 1 ? 'member' : 'members'}
      </p>

      {list.length === 0 ? (
        <Empty
          title={members.length === 0 ? 'No members yet' : 'No members match'}
          hint={members.length === 0 ? 'Add your first member to get started.' : 'Try a different search or status.'}
        />
      ) : (
        <ul className="rows">
          {list.map((m) => (
            <li key={m.id}>
              <button className="row" onClick={() => setEditing(m)}>
                <span className="avatar">{initials(m.full_name)}</span>
                <span className="row-main">
                  <strong>{m.full_name}</strong>
                  <small>
                    {[m.member_no, m.phone, groupName[m.group_id]].filter(Boolean).join('  |  ')}
                  </small>
                </span>
                {m.status !== 'active' && <span className={`chip ${m.status}`}>{label(m.status)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <MemberForm
          member={editing}
          groups={groups}
          canWrite={canWrite}
          canDelete={canDelete}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
      {showGroups && (
        <GroupsModal groups={groups} canDelete={canDelete} onClose={() => setShowGroups(false)} onChanged={load} />
      )}
    </div>
  )
}
