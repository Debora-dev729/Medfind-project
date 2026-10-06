import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { useAuth } from '../context/AuthContext'
import ReservationForm from './ReservationForm'

function PharmacyCard({ pharmacy, availability, medicineId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isStale = availability.ageInHours >= 24
  const medicine = { id: medicineId, name: availability.medicineName || 'Medicine', strength: availability.medicineStrength }

  return (
    <article className="pharmacy-card">
      <div className="pharmacy-card-topline">
        <div className="pharmacy-icon" aria-hidden="true">+</div>
        <div>
          <h3>{pharmacy.name}</h3>
          {pharmacy.verified && <span className="verified-label"><span aria-hidden="true">✓</span> Verified pharmacy</span>}
        </div>
        <span className="distance">{pharmacy.distance} km</span>
      </div>
      <div className="pharmacy-location"><span aria-hidden="true">⌖</span>{pharmacy.address}, {pharmacy.city}</div>
      {pharmacy.phone && <div className="pharmacy-location"><span aria-hidden="true">☎</span><a href={`tel:${pharmacy.phone}`}>{pharmacy.phone}</a></div>}
      <div className="pharmacy-status-row">
        <StatusBadge status={availability.status} />
        <strong>{availability.price ? `TSh ${availability.price.toLocaleString()}` : 'Price unavailable'}</strong>
      </div>
      <div className={`updated ${isStale ? 'updated-stale' : ''}`}><span aria-hidden="true">{isStale ? '!' : '↻'}</span> Updated {availability.updated}</div>
      {availability.status !== 'OUT_OF_STOCK' && <div className="stock-note">{availability.quantity ?? 'Limited'} units currently listed</div>}
      <div className="card-actions">
        <Link className="button button-secondary" to={`/pharmacies/${pharmacy.id}`}>View pharmacy</Link>
        {user?.role === 'PATIENT' ? <ReservationForm pharmacy={pharmacy} medicine={medicine} availability={availability} patient={user} /> : <button className="button button-primary" type="button" onClick={() => navigate('/login', { state: { from: `/search?query=${encodeURIComponent(medicine.name)}` } })} disabled={availability.status === 'OUT_OF_STOCK'}>Place Order</button>}
      </div>
      {medicineId && <span className="sr-only">Medicine ID: {medicineId}</span>}
    </article>
  )
}

export default PharmacyCard
