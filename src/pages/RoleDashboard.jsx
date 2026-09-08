import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { getMyReservations, getPharmacyReservations, updateReservationStatus } from '../services/reservationService'

const dashboardContent = {
  PATIENT: { eyebrow: 'Patient space', title: 'Find care with less waiting.', description: 'Search for medicine, compare nearby pharmacies and keep your reservations in one place.', cards: [['Search medicines', 'Find availability and compare prices.', '/search']] },
  PHARMACY_STAFF: { eyebrow: 'Pharmacy workspace', title: 'Keep your inventory visible.', description: 'Manage medicine availability and help patients find the care they need.', cards: [['Inventory', 'Update medicine availability and pricing.', '/pharmacy/inventory']] },
  ADMIN: { eyebrow: 'Administration', title: 'Keep MediFind trustworthy.', description: 'Review platform activity, pharmacies and the quality of medicine availability data.', cards: [['Pharmacies', 'Review participating pharmacy accounts.', '#'], ['Reports', 'Monitor platform activity and trends.', '#']] },
}

function RoleDashboard({ role }) {
  const { user, logout } = useAuth()
  const content = dashboardContent[role]
  const [reservations, setReservations] = useState([])
  const [loadingReservations, setLoadingReservations] = useState(role !== 'ADMIN')

  useEffect(() => {
    if (role === 'ADMIN') return undefined
    const loadReservations = role === 'PATIENT'
      ? getMyReservations(user.id)
      : getPharmacyReservations(user.pharmacyId || 'afya-pharmacy')
    loadReservations.then(setReservations).finally(() => setLoadingReservations(false))
    return undefined
  }, [role, user.id, user.pharmacyId])

  const changeReservationStatus = async (reservationId, status) => {
    await updateReservationStatus(reservationId, status)
    setReservations((current) => current.map((reservation) => reservation.id === reservationId ? { ...reservation, status } : reservation))
  }

  const nextStatus = { PENDING: 'CONFIRMED', CONFIRMED: 'READY_FOR_COLLECTION', READY_FOR_COLLECTION: 'COLLECTED' }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header container"><div><p className="eyebrow"><span /> {content.eyebrow}</p><h1>{content.title}</h1><p>{content.description}</p></div><button className="button button-secondary" type="button" onClick={logout}>Log out</button></div>
      <div className="container dashboard-welcome"><div><span className="dashboard-avatar">{user.fullName.charAt(0).toUpperCase()}</span><div><small>Signed in as</small><strong>{user.fullName}</strong><span>{user.email}</span></div></div><span className="role-chip">{role === 'PHARMACY_STAFF' ? 'Pharmacy staff' : role.charAt(0) + role.slice(1).toLowerCase()}</span></div>
      <div className="container dashboard-cards">{content.cards.map(([title, description, path]) => <Link className="dashboard-card" to={path} key={title}><span className="dashboard-card-icon">+</span><h2>{title}</h2><p>{description}</p><span className="dashboard-card-link">Open workspace →</span></Link>)}</div>
      {role !== 'ADMIN' && <section className="container reservations-section">
        <div className="section-heading-inline"><div><p className="eyebrow"><span /> {role === 'PATIENT' ? 'Your reservations' : 'Reservation queue'}</p><h2>{role === 'PATIENT' ? 'Track your medicine requests.' : 'Respond to patient requests.'}</h2></div><span className="reservation-count">{reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}</span></div>
        {loadingReservations ? <p className="dashboard-empty">Loading reservations...</p> : reservations.length === 0 ? <p className="dashboard-empty">{role === 'PATIENT' ? 'Your reservations will appear here after you reserve medicine.' : 'New patient reservations will appear here.'}</p> : <div className="reservation-list">{reservations.map((reservation) => <article className="reservation-row" key={reservation.id}><div><h3>{reservation.medicineName}</h3><p>{role === 'PATIENT' ? reservation.pharmacyName : reservation.patientName} · TSh {reservation.price?.toLocaleString() || 'Price unavailable'}</p><small>Requested {new Date(reservation.createdAt).toLocaleDateString('en-TZ')}</small></div><StatusBadge status={reservation.status} /><div className="reservation-actions">{role === 'PHARMACY_STAFF' && nextStatus[reservation.status] && <button className="button button-primary" type="button" onClick={() => changeReservationStatus(reservation.id, nextStatus[reservation.status])}>{nextStatus[reservation.status].replaceAll('_', ' ')}</button>}{['PENDING', 'CONFIRMED'].includes(reservation.status) && <button className="button button-secondary" type="button" onClick={() => changeReservationStatus(reservation.id, 'CANCELLED')}>Cancel</button>}</div></article>)}</div>}
      </section>}
    </section>
  )
}

export default RoleDashboard
