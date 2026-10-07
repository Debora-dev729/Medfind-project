import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { getInventory, updateInventoryItem } from '../services/inventoryService'
import api from '../services/api'
import './PharmacyStaff.css'

function PharmacyInventory() {
  const { user } = useAuth()
  const pharmacyId = user?.pharmacyId
  const [pharmacy, setPharmacy] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pharmacyId) {
      setError('This account is not assigned to a pharmacy.')
      setLoading(false)
      return
    }

    Promise.all([
      getInventory(pharmacyId),
      api.get('/pharmacies'),
    ])
      .then(([inventoryData, pharmacyResponse]) => {
        setInventory(inventoryData)
        const assignedPharmacy = pharmacyResponse.data.find(
          (item) => item.id === pharmacyId,
        )
        setPharmacy(assignedPharmacy || null)
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message ||
          requestError.message ||
          'Unable to load pharmacy inventory.',
        )
      })
      .finally(() => setLoading(false))
  }, [pharmacyId])

  const handleChange = (medicineId, field, value) => {
    setInventory((current) =>
      current.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              [field]: value === '' ? null : Number(value),
            }
          : item,
      ),
    )
    setMessage('')
    setError('')
  }

  const saveItem = async (item) => {
    setSavingId(item.medicineId)
    setMessage('')
    setError('')

    try {
      const savedItem = await updateInventoryItem(
        pharmacyId,
        item.medicineId,
        {
          quantity: item.quantity,
          price: item.price,
        },
      )

      setInventory((current) =>
        current.map((currentItem) =>
          currentItem.medicineId === savedItem.medicineId
            ? { ...currentItem, ...savedItem }
            : currentItem,
        ),
      )

      setMessage('Inventory updated successfully.')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        requestError.message ||
        'Unable to update inventory.',
      )
    } finally {
      setSavingId('')
    }
  }

  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <Loading label="Loading inventory" />
        </div>
      </div>
    )
  }

  return (
    <section className="page-section staff-inventory-page">
      <div className="container">
        <Link className="back-link" to="/pharmacy/dashboard">
          ← Back to pharmacy workspace
        </Link>

        <div className="staff-page-heading">
          <div>
            <p className="eyebrow">
              <span /> Inventory management
            </p>
            <h1>Update your pharmacy stock.</h1>
            <p>
              Keep availability and prices current so patients can make
              informed choices.
            </p>
          </div>

          {pharmacy && (
            <span className="role-chip">{pharmacy.name}</span>
          )}
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}

        {inventory.length === 0 ? (
          <p className="dashboard-empty">
            No inventory items are currently assigned to this pharmacy.
          </p>
        ) : (
          <div className="staff-inventory-list">
            {inventory.map((item) => (
              <div className="staff-inventory-row" key={item.medicineId}>
                <div>
                  <h2>
                    {item.medicine?.name || item.medicineId}
                    {item.medicine?.strength && (
                      <span> {item.medicine.strength}</span>
                    )}
                  </h2>
                  <p>
                    {item.medicine?.form || 'Medicine'}
                    {item.updatedAt
                      ? ` · Updated ${new Date(item.updatedAt).toLocaleString('en-TZ')}`
                      : ''}
                  </p>
                </div>

                <label>
                  Stock quantity
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity ?? ''}
                    onChange={(event) =>
                      handleChange(
                        item.medicineId,
                        'quantity',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Price (TSh)
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={item.price ?? ''}
                    onChange={(event) =>
                      handleChange(
                        item.medicineId,
                        'price',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <StatusBadge status={item.status} />

                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => saveItem(item)}
                  disabled={savingId === item.medicineId}
                >
                  {savingId === item.medicineId
                    ? 'Saving...'
                    : 'Save update'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PharmacyInventory
