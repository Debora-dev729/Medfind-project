import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { createPharmacyStaff, deletePharmacyStaff, getPharmacyStaff, setPharmacyStaffActive, updatePharmacyStaff } from '../services/staffService'
import './StaffManagement.css'

const blankForm = { fullName: '', email: '', phone: '', password: '', pharmacyId: '' }

function StaffManagement() {
  const [searchParams] = useSearchParams()
  const requestedPharmacyId = searchParams.get('pharmacyId') || ''
  const [staff, setStaff] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [form, setForm] = useState({ ...blankForm, pharmacyId: requestedPharmacyId })
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [members, pharmacyResponse] = await Promise.all([getPharmacyStaff(), api.get('/admin/pharmacies')])
      setStaff(members)
      setPharmacies(pharmacyResponse.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load pharmacy staff.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([getPharmacyStaff(), api.get('/admin/pharmacies')])
      .then(([members, pharmacyResponse]) => {
        if (!active) return
        setStaff(members)
        setPharmacies(pharmacyResponse.data)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load pharmacy staff.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const reset = () => {
    setEditingId('')
    setForm({ ...blankForm, pharmacyId: requestedPharmacyId || pharmacies.find((pharmacy) => pharmacy.status === 'ACTIVE')?.id || '' })
  }

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setMessage('')
  }

  const edit = (person) => {
    setEditingId(person.id)
    setForm({ fullName: person.fullName, email: person.email, phone: person.phone || '', password: '', pharmacyId: person.pharmacyId })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const details = { ...form, password: form.password || undefined }
      if (editingId) await updatePharmacyStaff(editingId, details)
      else await createPharmacyStaff(details)
      setMessage(editingId ? 'Staff account updated.' : 'Staff account created.')
      reset()
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this account.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (person) => {
    setError('')
    try {
      const updated = await setPharmacyStaffActive(person.id, !person.active)
      setStaff((current) => current.map((item) => item.id === person.id ? updated : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this account.')
    }
  }

  const remove = async (person) => {
    if (!window.confirm(`Delete the account for ${person.fullName}?`)) return
    setError('')
    try {
      await deletePharmacyStaff(person.id)
      setStaff((current) => current.filter((item) => item.id !== person.id))
      if (editingId === person.id) reset()
      setMessage('Staff account deleted.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this account.')
    }
  }

  return (
    <section className="staff-admin-page page-section">
      <div className="container">
        <Link className="back-link" to="/admin/dashboard">← Back to administration</Link>
        <header className="staff-admin-heading"><div><p className="eyebrow">Admin workspace</p><h1>Pharmacy staff</h1><p>Create staff accounts and control their pharmacy access.</p></div><span>{staff.length} accounts</span></header>
        {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
        <div className="staff-admin-layout">
          <form className="staff-admin-form" onSubmit={save}>
            <h2>{editingId ? 'Edit staff account' : 'Create staff account'}</h2>
            <label>Full name<input name="fullName" value={form.fullName} onChange={change} autoComplete="name" required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required /></label>
            <label>Phone number <span>(optional)</span><input name="phone" type="tel" value={form.phone} onChange={change} autoComplete="tel" /></label>
            <label>{editingId ? 'New password (optional)' : 'Temporary password'}<input name="password" type="password" value={form.password} onChange={change} autoComplete="new-password" minLength="8" required={!editingId} /></label>
            <label>Assigned pharmacy<select name="pharmacyId" value={form.pharmacyId} onChange={change} required><option value="">Choose an active pharmacy</option>{pharmacies.filter((pharmacy) => pharmacy.status === 'ACTIVE' || pharmacy.id === form.pharmacyId).map((pharmacy) => <option value={pharmacy.id} key={pharmacy.id}>{pharmacy.name} · {pharmacy.city}{pharmacy.status !== 'ACTIVE' ? ' · Not active' : ''}</option>)}</select></label>
            <div className="staff-admin-form-actions"><button className="button button-primary" type="submit" disabled={saving || pharmacies.length === 0}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create staff account'}</button>{editingId && <button className="button button-secondary" type="button" onClick={reset}>Cancel</button>}</div>
          </form>
          <div className="staff-admin-list"><div className="staff-admin-list-heading"><h2>Staff accounts</h2><button className="button button-secondary" type="button" onClick={load} disabled={loading}>Refresh</button></div>
            {loading ? <p className="dashboard-empty">Loading staff accounts...</p> : staff.length === 0 ? <p className="dashboard-empty">No pharmacy staff accounts yet.</p> : staff.map((person) => {
              const pharmacy = pharmacies.find((item) => item.id === person.pharmacyId)
              return <article className="staff-admin-row" key={person.id}>
                <div className="staff-admin-member"><strong>{person.fullName}</strong><span>{person.email}</span><span>{person.phone || 'No phone listed'}</span><small>{pharmacy?.name || person.pharmacyId}</small></div>
                <span className={`staff-admin-status ${person.active ? 'is-active' : 'is-inactive'}`}>{person.active ? 'Active' : 'Deactivated'}</span>
                <div className="staff-admin-actions"><button className="button button-secondary" type="button" onClick={() => edit(person)}>Edit</button><button className="button button-secondary" type="button" onClick={() => toggle(person)}>{person.active ? 'Deactivate' : 'Reactivate'}</button><button className="button button-secondary" type="button" onClick={() => remove(person)}>Delete</button></div>
              </article>
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default StaffManagement