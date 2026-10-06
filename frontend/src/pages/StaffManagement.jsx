import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { createPharmacyStaff, deletePharmacyStaff, getPharmacyStaff, resetPharmacyStaffPassword, setPharmacyStaffActive, updatePharmacyStaff } from '../services/staffService'
import './StaffManagement.css'

const blankForm = { fullName: '', email: '', phone: '', pharmacyId: '' }

function StaffManagement() {
  const [searchParams] = useSearchParams()
  const requestedPharmacyId = searchParams.get('pharmacyId') || ''
  const [staff, setStaff] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [form, setForm] = useState({ ...blankForm, pharmacyId: requestedPharmacyId })
  const [credentials, setCredentials] = useState(null)
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
    setCredentials(null)
    setEditingId(person.id)
    setForm({ fullName: person.fullName, email: person.email, phone: person.phone || '', pharmacyId: person.pharmacyId })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setCredentials(null)
    try {
      if (editingId) {
        await updatePharmacyStaff(editingId, form)
        setMessage('Staff account updated.')
      } else {
        const result = await createPharmacyStaff(form)
        setCredentials({ staff: result.staff, temporaryPassword: result.temporaryPassword })
        setMessage('Staff account created. Copy the temporary credentials now; they will not be shown again.')
      }
      reset()
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this account.')
    } finally {
      setSaving(false)
    }
  }

  const generatePassword = async (person) => {
    setError('')
    setMessage('')
    setCredentials(null)
    try {
      const result = await resetPharmacyStaffPassword(person.id)
      setCredentials({ staff: person, temporaryPassword: result.temporaryPassword })
      setMessage('New temporary password generated. Copy it now; it will not be shown again.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset this staff password.')
    }
  }

  const copyCredentials = async () => {
    if (!credentials) return
    try {
      await navigator.clipboard.writeText(`Email: ${credentials.staff.email}\nTemporary password: ${credentials.temporaryPassword}`)
      setMessage('Credentials copied to clipboard.')
    } catch {
      setError('Clipboard access is unavailable. Select and copy the credentials manually.')
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
        {credentials && <section className="staff-credentials" aria-label="One-time staff credentials">
          <div><p className="eyebrow">Shown once</p><h2>Temporary staff credentials</h2></div>
          <dl><dt>Email</dt><dd>{credentials.staff.email}</dd><dt>Temporary password</dt><dd><code>{credentials.temporaryPassword}</code></dd></dl>
          <div className="staff-admin-form-actions"><button className="button button-primary" type="button" onClick={copyCredentials}>Copy credentials</button><button className="button button-secondary" type="button" onClick={() => setCredentials(null)}>Dismiss</button></div>
        </section>}
        <div className="staff-admin-layout">
          <form className="staff-admin-form" onSubmit={save}>
            <h2>{editingId ? 'Edit staff account' : 'Create staff account'}</h2>
            <label>Full name<input name="fullName" value={form.fullName} onChange={change} autoComplete="name" required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required /></label>
            <label>Phone number <span>(optional)</span><input name="phone" type="tel" value={form.phone} onChange={change} autoComplete="tel" /></label>
            <label>Assigned pharmacy<select name="pharmacyId" value={form.pharmacyId} onChange={change} required><option value="">Choose a pharmacy</option>{pharmacies.map((pharmacy) => <option value={pharmacy.id} key={pharmacy.id}>{pharmacy.name} · {pharmacy.city}{pharmacy.status !== 'ACTIVE' ? ` · ${pharmacy.status.replaceAll('_', ' ')}` : ''}</option>)}</select></label>
            {!editingId && <p className="staff-admin-note">A secure temporary password is generated when you create the account. Staff can log in after the assigned pharmacy is active.</p>}
            <div className="staff-admin-form-actions"><button className="button button-primary" type="submit" disabled={saving || pharmacies.length === 0}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create Staff Account'}</button>{editingId && <button className="button button-secondary" type="button" onClick={reset}>Cancel</button>}</div>
          </form>
          <div className="staff-admin-list"><div className="staff-admin-list-heading"><h2>Staff accounts</h2><button className="button button-secondary" type="button" onClick={load} disabled={loading}>Refresh</button></div>
            {loading ? <p className="dashboard-empty">Loading staff accounts...</p> : staff.length === 0 ? <p className="dashboard-empty">No pharmacy staff accounts yet.</p> : staff.map((person) => {
              const pharmacy = pharmacies.find((item) => item.id === person.pharmacyId)
              return <article className="staff-admin-row" key={person.id}>
                <div className="staff-admin-member"><strong>{person.fullName}</strong><span>{person.email}</span><span>{person.phone || 'No phone listed'}</span><small>{pharmacy?.name || person.pharmacyId}</small></div>
                <span className={`staff-admin-status ${person.active ? 'is-active' : 'is-inactive'}`}>{person.active ? 'Active' : 'Deactivated'}</span>
                <div className="staff-admin-actions"><button className="button button-secondary" type="button" onClick={() => edit(person)}>Edit</button><button className="button button-secondary" type="button" onClick={() => toggle(person)}>{person.active ? 'Deactivate' : 'Reactivate'}</button><button className="button button-secondary" type="button" onClick={() => generatePassword(person)}>Generate New Temporary Password</button><button className="button button-secondary" type="button" onClick={() => remove(person)}>Delete</button></div>
              </article>
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default StaffManagement