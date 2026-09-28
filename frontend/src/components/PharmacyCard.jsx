import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { useAuth } from '../context/AuthContext'
import { createReservation } from '../services/reservationService'

function PharmacyCard({ pharmacy, availability, medicineId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const isStale = availability.ageInHours >= 24
  const handleReserve = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'PATIENT') {
      setMessage('Only patient accounts can reserve medicine.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await createReservation({
        patientId: user.id,
        patientName: user.fullName,
        medicineId,
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        medicineName: availability.medicineName,
        price: availability.price,
      })
      setMessage('Reserved. The pharmacy will confirm your request.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

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
      <div className="pharmacy-status-row">
        <StatusBadge status={availability.status} />
        <strong>{availability.price ? `TSh ${availability.price.toLocaleString()}` : 'Price unavailable'}</strong>
      </div>
      <div className={`updated ${isStale ? 'updated-stale' : ''}`}><span aria-hidden="true">{isStale ? '!' : '↻'}</span> Updated {availability.updated}</div>
      {availability.status !== 'OUT_OF_STOCK' && <div className="stock-note">{availability.quantity ?? 'Limited'} units currently listed</div>}
      <div className="card-actions">
        <Link className="button button-secondary" to={`/pharmacies/${pharmacy.id}`}>View pharmacy</Link>
        <button className="button button-primary" type="button" onClick={handleReserve} disabled={availability.status === 'OUT_OF_STOCK' || saving}>{saving ? 'Reserving...' : 'Reserve'}</button>
      </div>
      {message && <p className="reservation-message" role="status">{message}</p>}
      {medicineId && <span className="sr-only">Medicine ID: {medicineId}</span>}
    </article>
  )
}

export default PharmacyCard
