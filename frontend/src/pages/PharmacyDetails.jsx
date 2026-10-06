import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import ReservationForm from '../components/ReservationForm'
import { useAuth } from '../context/AuthContext'
import { getPharmacyById } from '../services/pharmacyService'

function PharmacyDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPharmacyById(id).then(setPharmacy).finally(() => setLoading(false)) }, [id])
  if (loading) return <div className="page-section"><div className="container"><Loading label="Loading pharmacy details" /></div></div>
  if (!pharmacy) return <div className="page-section"><div className="container message-state"><h2>Pharmacy not found.</h2><Link to="/search">Back to search</Link></div></div>

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.name}, ${pharmacy.address}, ${pharmacy.city}`)}`

  return <div className="page-section detail-page"><div className="container"><Link className="back-link" to="/search">← Back to search</Link><div className="pharmacy-detail-hero"><div className="pharmacy-icon large" aria-hidden="true">+</div><div><p className="eyebrow">Pharmacy details</p><h1>{pharmacy.name}</h1><span className="verified-label"><span aria-hidden="true">✓</span> Verified pharmacy</span></div></div><div className="pharmacy-info-grid"><div><span>Location</span><strong>{pharmacy.address}, {pharmacy.city}</strong><a className="directions-link" href={directionsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></div><div><span>Phone</span><strong>{pharmacy.phone || 'Not listed'}</strong></div><div><span>Opening hours</span><strong>{pharmacy.hours}</strong></div></div><div className="results-heading"><div><p className="eyebrow">Current inventory</p><h2>Medicines available here</h2></div></div><div className="inventory-list">{pharmacy.medicines.map(({ medicine, availability }) => <div className="inventory-row" key={medicine.id}><div><h3>{medicine.name} <span>{medicine.strength}</span></h3><p>{medicine.form}</p></div><StatusBadge status={availability.status} /><strong>{availability.price == null ? 'Price unavailable' : `TSh ${availability.price.toLocaleString()}`}</strong><span className="updated">{availability.quantity} units listed</span><ReservationForm pharmacy={pharmacy} medicine={medicine} availability={availability} patient={user} /></div>)}</div></div></div>
}

export default PharmacyDetails
