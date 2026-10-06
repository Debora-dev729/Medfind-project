import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import api from '../services/api'
import { cancelReservation, getMyReservations, getPharmacyReservations, updateReservationStatus } from '../services/reservationService'

const dashboardContent = {
  PATIENT: { eyebrow: 'Patient space', title: 'Find care with less waiting.', description: 'Search for medicine, compare nearby pharmacies and keep your reservations in one place.', cards: [['Search medicines', 'Find availability and compare prices.', '/search']] },
  PHARMACY_STAFF: { eyebrow: 'Pharmacy workspace', title: 'Keep your inventory visible.', description: 'Manage medicine availability and help patients find the care they need.', cards: [['Inventory', 'Update medicine availability and pricing.', '/pharmacy/inventory']] },
  ADMIN: { eyebrow: 'Administration', title: 'Keep MediFind trustworthy.', description: 'Review pharmacy applications, payments, and participating pharmacy teams.', cards: [['Pharmacies', 'Review applications and manage pharmacy access.', '/admin/pharmacies'], ['Pharmacy staff', 'Create accounts and assign pharmacy access.', '/admin/pharmacy-staff'], ['Payments', 'Review submitted payments and activate eligible pharmacies.', '/admin/payments']] },
}

function RoleDashboard({ role }) {
  const { user, logout } = useAuth()
  const content = dashboardContent[role]
  const [reservations, setReservations] = useState([])
  const [loadingReservations, setLoadingReservations] = useState(role !== 'ADMIN')
  const [reservationsError, setReservationsError] = useState('')
  const [medicineNames, setMedicineNames] = useState({})
  const [pharmacyNames, setPharmacyNames] = useState({})
  const [updatingId, setUpdatingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [clock, setClock] = useState(null)
  const [orderMessage, setOrderMessage] = useState('')

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setClock(Date.now()), 0)
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (role === 'ADMIN') return undefined
    let cancelled = false
    const loadReservations = role === 'PATIENT'
      ? getMyReservations(user.id)
      : getPharmacyReservations(user.pharmacyId || 'afya-pharmacy')
    loadReservations
      .then(async (data) => {
        if (cancelled) return
        setReservations(data)
        const [medicines, pharmacies] = await Promise.all([
          api.get('/medicines').then((response) => response.data).catch(() => []),
          api.get('/pharmacies').then((response) => response.data).catch(() => []),
        ])
        if (cancelled) return
        setMedicineNames(Object.fromEntries(medicines.map((item) => [item.medicine ? item.medicine.id : item.id, item.medicine ? item.medicine.name : item.name])))
        setPharmacyNames(Object.fromEntries(pharmacies.map((item) => [item.id, item.name])))
      })
      .catch((error) => {
        if (!cancelled) setReservationsError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingReservations(false)
      })
    return () => {
      cancelled = true
    }
  }, [role, user.id, user.pharmacyId])

  useEffect(() => {
    const hasPendingOrders = reservations.some((reservation) => reservation.status === 'PENDING' && reservation.expiresAt)
    if (!hasPendingOrders || role === 'ADMIN') return undefined

    const refreshExpiredOrders = () => {
      const hasExpiredPending = reservations.some((reservation) =>
        reservation.status === 'PENDING' && reservation.expiresAt && Date.parse(reservation.expiresAt) <= Date.now(),
      )
      if (!hasExpiredPending) return

      const refresh = role === 'PATIENT'
        ? getMyReservations(user.id)
        : getPharmacyReservations(user.pharmacyId)
      refresh.then(setReservations).catch((error) => setReservationsError(error.message))
    }

    const timer = window.setInterval(refreshExpiredOrders, 5000)
    return () => window.clearInterval(timer)
  }, [role, user.id, user.pharmacyId, reservations])

  const changeReservationStatus = async (reservationId, status) => {
    try {
      setReservationsError('')
      setUpdatingId(reservationId)
      const updated = await updateReservationStatus(reservationId, status)
      setReservations((current) => current.map((reservation) => reservation.id === reservationId ? updated : reservation))
      setOrderMessage(status === 'CONFIRMED'
        ? 'Your order has been confirmed by the pharmacy.'
        : status === 'CANCELLED'
          ? 'The order has been cancelled successfully.'
          : '')
    } catch (error) {
      setReservationsError(error.message)
      const reload = role === 'PATIENT' ? getMyReservations(user.id) : getPharmacyReservations(user.pharmacyId || 'afya-pharmacy')
      reload.then((data) => {
        setReservations(data)
        setReservationsError('')
      }).catch(() => {})
    } finally {
      setUpdatingId(null)
    }
  }

  const cancelPatientOrder = async (reservationId) => {
    setCancellingId(reservationId)
    setOrderMessage('')
    setReservationsError('')
    try {
      const updated = await cancelReservation(reservationId)
      setReservations((current) => current.map((reservation) => reservation.id === updated.id ? updated : reservation))
      setOrderMessage('Your order has been cancelled successfully.')
    } catch (error) {
      setReservationsError(error.message)
      const refreshed = await getMyReservations(user.id).catch(() => null)
      if (refreshed) {
        setReservations(refreshed)
        setReservationsError('')
      }
    } finally {
      setCancellingId(null)
    }
  }

  // UI-level action hints only. The backend remains the authority on valid transitions.
  const staffActions = {
    PENDING: [
      { status: 'CONFIRMED', label: 'Confirm Order', primary: true },
      { status: 'CANCELLED', label: 'Reject/Cancel', primary: false },
    ],
    CONFIRMED: [
      { status: 'READY_FOR_COLLECTION', label: 'Ready for Collection', primary: true },
      { status: 'CANCELLED', label: 'Cancel', primary: false },
    ],
    READY_FOR_COLLECTION: [
      { status: 'COLLECTED', label: 'Mark Collected', primary: true },
    ],
  }

  const patientStatusMessages = {
    PENDING: 'Waiting for pharmacy confirmation',
    CONFIRMED: 'Order Confirmed. The pharmacy has confirmed your order.',
    READY_FOR_COLLECTION: 'Ready for collection',
    COLLECTED: 'Collected',
    CANCELLED: 'Order Cancelled. You can find another pharmacy.',
    EXPIRED: 'Order Expired. The pharmacy did not confirm within 15 minutes.',
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header container"><div><p className="eyebrow"><span /> {content.eyebrow}</p><h1>{content.title}</h1><p>{content.description}</p></div><button className="button button-secondary" type="button" onClick={logout}>Log out</button></div>
      <div className="container dashboard-welcome"><div><span className="dashboard-avatar">{user.fullName.charAt(0).toUpperCase()}</span><div><small>Signed in as</small><strong>{user.fullName}</strong><span>{user.email}</span></div></div><span className="role-chip">{role === 'PHARMACY_STAFF' ? 'Pharmacy staff' : role.charAt(0) + role.slice(1).toLowerCase()}</span></div>
      <div className="container dashboard-cards">{content.cards.map(([title, description, path]) => <Link className="dashboard-card" to={path} key={title}><span className="dashboard-card-icon">+</span><h2>{title}</h2><p>{description}</p><span className="dashboard-card-link">Open workspace →</span></Link>)}</div>
      {role !== 'ADMIN' && <section className="container reservations-section">
        <div className="section-heading-inline"><div><p className="eyebrow"><span /> {role === 'PATIENT' ? 'Your reservations' : 'Reservation queue'}</p><h2>{role === 'PATIENT' ? 'Track your medicine requests.' : 'Respond to patient requests.'}</h2></div><span className="reservation-count">{reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}</span></div>
        {orderMessage && <p className="auth-message" role="status">{orderMessage}</p>}
        {loadingReservations ? <p className="dashboard-empty">Loading reservations...</p> : reservationsError ? <p className="dashboard-empty">{reservationsError}</p> : reservations.length === 0 ? <p className="dashboard-empty">{role === 'PATIENT' ? 'Your orders will appear here after you place one.' : 'New patient orders will appear here.'}</p> : <div className="reservation-list">{reservations.map((reservation) => {
          const deadline = reservation.expiresAt ? Date.parse(reservation.expiresAt) : 0
          const remainingSeconds = clock === null ? null : Math.max(0, Math.ceil((deadline - clock) / 1000))
          const shownStatus = reservation.status === 'PENDING' && deadline > 0 && remainingSeconds === 0 ? 'EXPIRED' : reservation.status
          const medicineName = medicineNames[reservation.medicineId] || reservation.medicineId
          const canActOnPending = reservation.status === 'PENDING' && (remainingSeconds === null || remainingSeconds > 0)
          return <article className="reservation-row" key={reservation.id}>
            <div>
              <h3>{medicineNames[reservation.medicineId] || 'Medicine unavailable'}</h3>
              <p>{role === 'PATIENT' ? pharmacyNames[reservation.pharmacyId] || reservation.pharmacyId : reservation.patientName} · {reservation.quantity || 1} unit{(reservation.quantity || 1) === 1 ? '' : 's'} · Total TSh {(reservation.totalPrice ?? ((reservation.price ?? 0) * (reservation.quantity || 1))).toLocaleString()}</p>
              <small>Requested {new Date(reservation.createdAt).toLocaleDateString('en-TZ')}</small>
              {role === 'PATIENT' && <small className="reservation-status-note">{patientStatusMessages[shownStatus]}</small>}
              {role === 'PATIENT' && shownStatus === 'PENDING' && deadline > 0 && <small className="reservation-status-note">{remainingSeconds === null ? 'Checking order deadline...' : `${formatCountdown(remainingSeconds)} remaining`}</small>}
              {role === 'PHARMACY_STAFF' && shownStatus === 'PENDING' && deadline > 0 && <small className="reservation-status-note">{remainingSeconds === null ? 'Checking order deadline...' : `Expires in ${formatCountdown(remainingSeconds)}`}</small>}
            </div>
            <StatusBadge status={shownStatus} />
            <div className="reservation-actions">
              {role === 'PATIENT' && canActOnPending && <button className="button button-secondary" type="button" disabled={cancellingId === reservation.id} onClick={() => cancelPatientOrder(reservation.id)}>{cancellingId === reservation.id ? 'Cancelling...' : 'Cancel Order'}</button>}
              {role === 'PHARMACY_STAFF' && canActOnPending && (staffActions[reservation.status] || []).map((action) => <button key={action.status} className={action.primary ? 'button button-primary' : 'button button-secondary'} type="button" disabled={updatingId === reservation.id} onClick={() => changeReservationStatus(reservation.id, action.status)}>{action.label}</button>)}
              {role === 'PATIENT' && ['CANCELLED', 'EXPIRED'].includes(shownStatus) && <Link className="button button-primary" to={`/search?query=${encodeURIComponent(medicineName)}`}>Find Another Pharmacy</Link>}
            </div>
          </article>
        })}</div>}
      </section>}
    </section>
  )
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

export default RoleDashboard
