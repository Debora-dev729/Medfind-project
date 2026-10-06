import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  createAdminPharmacy,
  decidePharmacyApplication,
  getAdminPharmacies,
  getAdminPharmacy,
  updatePharmacyPayment,
  updatePharmacyStatus,
  updateAdminPharmacy,
} from '../services/pharmacyAdminService'
import './PharmacyManagement.css'

const filters = [
  ['all', 'All Pharmacies'],
  ['pending', 'Pending Applications / Payment'],
  ['payments', 'Payment Review'],
  ['active', 'Active Pharmacies'],
  ['suspended', 'Suspended Pharmacies'],
  ['rejected', 'Rejected Applications'],
]

const emptyPharmacy = {
  name: '',
  ownerName: '',
  registrationNumber: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  hours: '',
  latitude: '',
  longitude: '',
  subscriptionPlan: 'BASIC',
}

function PharmacyManagement({ initialFilter = 'pending' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isNewRoute = location.pathname.endsWith('/new')
  const [filter, setFilter] = useState(initialFilter)
  const [pharmacies, setPharmacies] = useState([])
  const [selected, setSelected] = useState(null)
  const [createdPharmacy, setCreatedPharmacy] = useState(null)
  const [form, setForm] = useState(emptyPharmacy)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadList = async () => {
    setLoading(true)
    try {
      setPharmacies(await getAdminPharmacies(filter))
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load pharmacy applications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getAdminPharmacies(filter)
      .then((data) => {
        if (!active) return
        setPharmacies(data)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load pharmacy applications.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [filter])

  const refreshSelected = async (id) => {
    const details = await getAdminPharmacy(id)
    setSelected(details)
    await loadList()
  }

  const runAction = async (id, action, successMessage) => {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(successMessage)
      if (selected?.pharmacy.id === id) await refreshSelected(id)
      else await loadList()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this pharmacy.')
    } finally {
      setBusyId('')
    }
  }

  const viewDetails = async (id) => {
    setBusyId(id)
    setError('')
    try {
      setSelected(await getAdminPharmacy(id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load pharmacy details.')
    } finally {
      setBusyId('')
    }
  }

  const editPharmacy = (pharmacy) => {
    setForm({
      name: pharmacy.name || '',
      ownerName: pharmacy.ownerName || '',
      registrationNumber: pharmacy.registrationNumber || '',
      email: pharmacy.email || '',
      phone: pharmacy.phone || '',
      address: pharmacy.address || '',
      city: pharmacy.city || '',
      hours: pharmacy.hours || '',
      latitude: pharmacy.latitude ?? '',
      longitude: pharmacy.longitude ?? '',
      subscriptionPlan: pharmacy.subscriptionPlan || 'BASIC',
    })
    setEditingId(pharmacy.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const savePharmacy = async (event) => {
    event.preventDefault()
    setBusyId('form')
    setError('')
    setMessage('')
    const details = {
      ...form,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
    }
    try {
      if (editingId) {
        await updateAdminPharmacy(editingId, details)
        setMessage('Pharmacy details updated.')
      } else {
        const pharmacy = await createAdminPharmacy(details)
        setCreatedPharmacy({ id: pharmacy.id, name: pharmacy.name })
        setMessage('Pharmacy created. Verify payment before staff access and activation.')
      }
      setForm(emptyPharmacy)
      setEditingId('')
      if (isNewRoute) navigate('/admin/pharmacies', { replace: true })
      await loadList()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this pharmacy.')
    } finally {
      setBusyId('')
    }
  }

  const cancelForm = () => {
    setForm(emptyPharmacy)
    setEditingId('')
    if (isNewRoute) navigate('/admin/pharmacies', { replace: true })
  }

  const pharmacyActionLabel = (pharmacy) => {
    if (pharmacy.status === 'ACTIVE') return ['SUSPENDED', 'Suspend']
    if (pharmacy.status === 'SUSPENDED') return ['ACTIVE', 'Reactivate']
    return null
  }

  return (
    <section className="pharmacy-admin-page page-section">
      <div className="container">
        <Link className="back-link" to="/admin/dashboard">← Back to administration</Link>
        <header className="pharmacy-admin-heading">
          <div><p className="eyebrow">Admin workspace</p><h1>{initialFilter === 'payments' ? 'Payments' : 'Pharmacies'}</h1><p>{initialFilter === 'payments' ? 'Review submitted pharmacy payments and activate eligible pharmacies.' : 'Review applications, verify payments, and manage active pharmacy access.'}</p></div>
          <div className="pharmacy-admin-heading-actions"><Link className="button button-secondary" to="/admin/staff">Manage Staff</Link><Link className="button button-primary" to="/admin/pharmacies/new">+ Add Pharmacy</Link></div>
        </header>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        {createdPharmacy && <p className="auth-message">Next, <Link to={`/admin/staff?pharmacyId=${encodeURIComponent(createdPharmacy.id)}`}>create staff for {createdPharmacy.name}</Link>. Staff can sign in after the pharmacy is activated.</p>}

        {(isNewRoute || editingId) && <form className="pharmacy-admin-form" onSubmit={savePharmacy}>
          <div className="pharmacy-admin-form-heading"><div><p className="eyebrow">Admin workspace</p><h2>{editingId ? 'Edit pharmacy' : 'Add pharmacy'}</h2></div><button className="button button-secondary" type="button" onClick={cancelForm}>Cancel</button></div>
          <div className="pharmacy-admin-form-fields">
            <label>Pharmacy name<input name="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label>Owner / manager<input name="ownerName" value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></label>
            <label>Phone<input name="phone" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required /></label>
            <label>Region / city<input name="city" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required /></label>
            <label>License / registration number<input name="registrationNumber" value={form.registrationNumber} onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))} /></label>
            <label className="pharmacy-admin-form-wide">Address<input name="address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} required /></label>
            <label>Opening hours<input name="hours" value={form.hours} onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} /></label>
            <label>Subscription plan<select name="subscriptionPlan" value={form.subscriptionPlan} onChange={(event) => setForm((current) => ({ ...current, subscriptionPlan: event.target.value }))}><option value="BASIC">Basic · TSh 20,000/month</option><option value="STANDARD">Standard · TSh 50,000/month</option><option value="PREMIUM">Premium · TSh 100,000/month</option></select></label>
            <label>Latitude <span>(optional)</span><input name="latitude" type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} /></label>
            <label>Longitude <span>(optional)</span><input name="longitude" type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} /></label>
          </div>
          {!editingId && <p className="pharmacy-admin-form-note">New pharmacies remain inactive until payment is submitted and verified. Add staff after activation.</p>}
          <div className="pharmacy-admin-form-actions"><button className="button button-primary" type="submit" disabled={busyId === 'form'}>{busyId === 'form' ? 'Saving...' : editingId ? 'Save changes' : 'Create Pharmacy'}</button></div>
        </form>}

        <nav className="pharmacy-admin-filters" aria-label="Filter pharmacies">
          {filters.map(([value, label]) => <button className={filter === value ? 'is-selected' : ''} type="button" key={value} onClick={() => { setFilter(value); setSelected(null) }}>{label}</button>)}
        </nav>

        {loading ? <p className="dashboard-empty">Loading pharmacies...</p> : pharmacies.length === 0 ? <p className="dashboard-empty">No pharmacies in this section.</p> : (
          <div className="pharmacy-admin-list">
            {pharmacies.map((pharmacy) => <article className="pharmacy-admin-row" key={pharmacy.id}>
              <div className="pharmacy-admin-main">
                <div><h2>{pharmacy.name}</h2><p>{pharmacy.ownerName || 'Owner not provided'} · {pharmacy.city}</p></div>
                <div className="pharmacy-admin-contact"><a href={`tel:${pharmacy.phone}`}>{pharmacy.phone || 'No phone'}</a><a href={`mailto:${pharmacy.email}`}>{pharmacy.email || 'No email'}</a></div>
                <div className="pharmacy-admin-badges"><span>{pharmacy.applicationStatus?.replaceAll('_', ' ')}</span><span>{pharmacy.status?.replaceAll('_', ' ')}</span><span>{pharmacy.paymentStatus?.replaceAll('_', ' ')}</span></div>
              </div>
              <div className="pharmacy-admin-meta"><span>{pharmacy.address}</span><span>License: {pharmacy.registrationNumber || 'Not provided'}</span><span>Applied: {pharmacy.submittedAt ? new Date(pharmacy.submittedAt).toLocaleDateString('en-TZ') : 'Existing pharmacy'}</span><span>{pharmacy.subscriptionPlan} · TSh {Number(pharmacy.subscriptionAmount || 0).toLocaleString()}/month</span></div>
              <div className="pharmacy-admin-actions">
                <button className="button button-secondary" type="button" onClick={() => viewDetails(pharmacy.id)} disabled={busyId === pharmacy.id}>View Details</button>
                <button className="button button-secondary" type="button" onClick={() => editPharmacy(pharmacy)}>Edit</button>
                {pharmacy.applicationStatus === 'PENDING_APPROVAL' && <>
                  <button className="button button-primary" type="button" disabled={busyId === pharmacy.id} onClick={() => runAction(pharmacy.id, () => decidePharmacyApplication(pharmacy.id, 'APPROVE'), 'Application approved. Payment verification is still required before activation.')}>Approve</button>
                  <button className="button button-secondary" type="button" disabled={busyId === pharmacy.id} onClick={() => runAction(pharmacy.id, () => decidePharmacyApplication(pharmacy.id, 'REJECT'), 'Application rejected.')}>Reject</button>
                </>}
                {pharmacy.applicationStatus === 'APPROVED' && pharmacy.paymentStatus !== 'PAYMENT_VERIFIED' && <>
                  {pharmacy.paymentStatus !== 'PAYMENT_SUBMITTED' && <button className="button button-secondary" type="button" disabled={busyId === pharmacy.id} onClick={() => runAction(pharmacy.id, () => updatePharmacyPayment(pharmacy.id, 'PAYMENT_SUBMITTED', pharmacy.paymentReference), 'Payment marked as submitted.')}>Mark Payment Submitted</button>}
                  {pharmacy.paymentStatus === 'PAYMENT_SUBMITTED' && <button className="button button-primary" type="button" disabled={busyId === pharmacy.id} onClick={() => runAction(pharmacy.id, () => updatePharmacyPayment(pharmacy.id, 'PAYMENT_VERIFIED', pharmacy.paymentReference), 'Payment verified. Pharmacy is active.')}>Verify Payment</button>}
                  <button className="button button-secondary" type="button" disabled={busyId === pharmacy.id} onClick={() => runAction(pharmacy.id, () => updatePharmacyPayment(pharmacy.id, 'PAYMENT_REJECTED', pharmacy.paymentReference), 'Payment rejected.')}>Reject Payment</button>
                </>}
                {pharmacyActionLabel(pharmacy) && <button className="button button-secondary" type="button" disabled={busyId === pharmacy.id} onClick={() => runAction(pharmacy.id, () => updatePharmacyStatus(pharmacy.id, pharmacyActionLabel(pharmacy)[0]), `${pharmacy.name} status updated.`)}>{pharmacyActionLabel(pharmacy)[1]}</button>}
              </div>
              {selected?.pharmacy.id === pharmacy.id && <PharmacyDetails details={selected} />}
            </article>)}
          </div>
        )}
      </div>
    </section>
  )
}

function PharmacyDetails({ details }) {
  const { pharmacy, staff } = details
  return (
    <div className="pharmacy-admin-details">
      <div><h3>Application and subscription</h3><dl>
        <dt>Owner / manager</dt><dd>{pharmacy.ownerName || 'Not provided'}</dd>
        <dt>Email</dt><dd>{pharmacy.email || 'Not provided'}</dd>
        <dt>Phone</dt><dd>{pharmacy.phone || 'Not provided'}</dd>
        <dt>Address</dt><dd>{pharmacy.address}, {pharmacy.city}</dd>
        <dt>Registration/license</dt><dd>{pharmacy.registrationNumber || 'Not provided'}</dd>
        <dt>Coordinates</dt><dd>{pharmacy.latitude ?? '—'}, {pharmacy.longitude ?? '—'}</dd>
        <dt>Payment reference</dt><dd>{pharmacy.paymentReference || 'Not provided'}</dd>
        <dt>Payment date</dt><dd>{pharmacy.paymentDate ? new Date(pharmacy.paymentDate).toLocaleDateString('en-TZ') : 'Not verified'}</dd>
        <dt>Subscription expires</dt><dd>{pharmacy.subscriptionExpiresAt ? new Date(pharmacy.subscriptionExpiresAt).toLocaleDateString('en-TZ') : 'Not started'}</dd>
      </dl></div>
      <div className="pharmacy-admin-staff"><div><h3>Pharmacy staff</h3><Link className="button button-secondary" to={`/admin/staff?pharmacyId=${encodeURIComponent(pharmacy.id)}`}>Add Staff</Link></div>
        {staff.length ? staff.map((person) => <p key={person.id}><strong>{person.fullName}</strong><span>{person.email} · {person.active ? 'ACTIVE' : 'DEACTIVATED'}</span></p>) : <p>No staff accounts assigned.</p>}
      </div>
    </div>
  )
}

export default PharmacyManagement