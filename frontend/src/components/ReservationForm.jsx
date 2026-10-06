import { useState } from 'react'
import './ReservationForm.css'
import { createReservation } from '../services/reservationService'

function ReservationForm({ pharmacy, medicine, availability, patient }) {
  const stockQuantity = Number(availability.quantity) || 0
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [ordered, setOrdered] = useState(false)
  const unitPrice = availability.price
  const orderTotal = unitPrice == null ? null : unitPrice * quantity

  const submitOrder = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createReservation({ pharmacyId: pharmacy.id, medicineId: medicine.id, quantity })
      setOrdered(true)
      setOpen(false)
      setMessage('Your order has been placed. Please wait for the pharmacy to confirm within 15 minutes.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        className="button button-primary"
        type="button"
        onClick={() => { setQuantity(1); setError(''); setOpen(true) }}
        disabled={ordered || stockQuantity < 1 || availability.status === 'OUT_OF_STOCK'}
      >
        {ordered ? 'Order requested' : 'Place Order'}
      </button>
      {message && <p className="reservation-message" role="status">{message}</p>}
      {open && (
        <div className="order-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
            <button className="order-modal-close" type="button" aria-label="Close order form" onClick={() => setOpen(false)}>×</button>
            <p className="eyebrow">Order request</p>
            <h2 id="order-title">Confirm your medicine</h2>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <form onSubmit={submitOrder}>
              <dl className="order-summary">
                <div><dt>Medicine</dt><dd>{medicine.name} {medicine.strength || ''}</dd></div>
                <div><dt>Pharmacy</dt><dd>{pharmacy.name}</dd></div>
                <div><dt>Patient</dt><dd>{patient.fullName}{patient.phone ? ` · ${patient.phone}` : ''}</dd></div>
                <div><dt>Available</dt><dd>{stockQuantity} units</dd></div>
                <div><dt>Unit price</dt><dd>{unitPrice == null ? 'Not listed' : `TSh ${unitPrice.toLocaleString()}`}</dd></div>
              </dl>
              <label className="order-quantity-label" htmlFor={`order-quantity-${medicine.id}`}>Quantity
                <input
                  id={`order-quantity-${medicine.id}`}
                  type="number"
                  min="1"
                  max={stockQuantity}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Math.min(stockQuantity, Number(event.target.value) || 1)))}
                  required
                />
              </label>
              <div className="order-total"><span>Order total</span><strong>{orderTotal == null ? 'Not listed' : `TSh ${orderTotal.toLocaleString()}`}</strong></div>
              <button className="button button-primary" type="submit" disabled={saving || quantity < 1 || quantity > stockQuantity}>
                {saving ? 'Submitting...' : 'Confirm Order'}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

export default ReservationForm