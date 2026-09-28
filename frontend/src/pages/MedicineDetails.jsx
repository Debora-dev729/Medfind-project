import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PharmacyCard from '../components/PharmacyCard'
import Loading from '../components/Loading'
import { getMedicineById } from '../services/medicineService'

function MedicineDetails() {
  const { id } = useParams()
  const [medicine, setMedicine] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getMedicineById(id).then(setMedicine).finally(() => setLoading(false)) }, [id])
  if (loading) return <div className="page-section"><div className="container"><Loading label="Loading medicine details" /></div></div>
  if (!medicine) return <div className="page-section"><div className="container message-state"><h2>Medicine not found.</h2><Link to="/search">Back to search</Link></div></div>

  return <div className="page-section detail-page"><div className="container"><Link className="back-link" to="/search">← Back to search</Link><div className="medicine-intro"><div className="medicine-symbol">+</div><div><p className="eyebrow">Medicine details</p><h1>{medicine.name} <span>{medicine.strength}</span></h1><p className="medicine-meta">{medicine.form} · {medicine.description}</p></div></div><div className="results-heading"><div><p className="eyebrow">Compare options</p><h2>Available at {medicine.availability.length} pharmacies</h2></div></div><div className="results-list">{medicine.availability.map(({ pharmacy, availability }) => <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} availability={{ ...availability, medicineName: medicine.name }} medicineId={medicine.id} />)}</div></div></div>
}

export default MedicineDetails
