import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { getInventory, updateInventoryItem } from '../services/inventoryService'
import './PharmacyStaff.css'

function PharmacyInventory() {
  const { user } = useAuth()
  const pharmacyId = user.pharmacyId || 'afya-pharmacy'
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getInventory(pharmacyId).then(setInventory).finally(() => setLoading(false))
  }, [pharmacyId])

  const handleChange = (medicineId, field, value) => {
    setInventory((current) => current.map((item) => item.medicine.id === medicineId
      ? { ...item, availability: { ...item.availability, [field]: field === 'price' || field === 'quantity' ? (value === '' ? null : Number(value)) : value } }
      : item))
    setMessage('')
  }

  const saveItem = async (item) => {
    setSavingId(item.medicine.id)
    const savedInventory = await updateInventoryItem(pharmacyId, item.medicine.id, {
      status: item.availability.status,
      quantity: item.availability.quantity,
      price: item.availability.price,
    })
    setInventory(savedInventory)
    setMessage(`${item.medicine.name} updated.`)
    setSavingId('')
  }

  if (loading) return <div className="page-section"><div className="container"><Loading label="Loading inventory" /></div></div>

  return (
    <section className="page-section staff-inventory-page">
      <div className="container">
        <Link className="back-link" to="/pharmacy/dashboard">← Back to pharmacy workspace</Link>
        <div className="staff-page-heading">
          <div>
            <p className="eyebrow"><span /> Inventory management</p>
            <h1>Update your pharmacy stock.</h1>
            <p>Keep availability and prices current so patients can make informed choices.</p>
          </div>
          <span className="role-chip">Afya Pharmacy</span>
        </div>
        {message && <div className="auth-message" role="status">{message}</div>}
        <div className="staff-inventory-list">
          {inventory.map((item) => (
            <div className="staff-inventory-row" key={item.medicine.id}>
              <div>
                <h2>{item.medicine.name} <span>{item.medicine.strength}</span></h2>
                <p>{item.medicine.form} · Updated {item.availability.updated}</p>
              </div>
              <label>Stock quantity<input type="number" min="0" step="1" value={item.availability.quantity ?? ''} onChange={(event) => handleChange(item.medicine.id, 'quantity', event.target.value)} /></label>
              <label>Price (TSh)<input type="number" min="0" step="50" value={item.availability.price ?? ''} onChange={(event) => handleChange(item.medicine.id, 'price', event.target.value)} /></label>
              <StatusBadge status={item.availability.status} />
              <button className="button button-primary" type="button" onClick={() => saveItem(item)} disabled={savingId === item.medicine.id}>{savingId === item.medicine.id ? 'Saving...' : 'Save update'}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PharmacyInventory
