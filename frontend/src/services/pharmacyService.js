import api from './api'
import { mapAvailability, mapPharmacy } from './dataMappers'

export const getPharmacyById = async (id) => {
  const [pharmacyResponse, medicineResponse] = await Promise.all([
    api.get(`/pharmacies/${id}`),
    api.get('/medicines'),
  ])
  const { pharmacy, inventory } = pharmacyResponse.data
  const medicines = new Map(
    medicineResponse.data.map(({ medicine }) => [medicine.id, medicine]),
  )

  return {
    ...mapPharmacy(pharmacy),
    medicines: inventory.flatMap((item) => {
      const medicine = medicines.get(item.medicineId)
      return medicine && item.quantity > 0 && item.status !== 'OUT_OF_STOCK'
        ? [{ medicine, availability: mapAvailability(item) }]
        : []
    }),
  }
}

export const getNearbyPharmacies = async () => {
  const [pharmacyResponse, medicineResponse] = await Promise.all([
    api.get('/pharmacies'),
    api.get('/medicines'),
  ])
  const medicinesByPharmacy = new Map()

  medicineResponse.data.forEach(({ medicine, availability }) => {
    availability.forEach((item) => {
      if (!medicinesByPharmacy.has(item.pharmacyId)) {
        medicinesByPharmacy.set(item.pharmacyId, {})
      }
      medicinesByPharmacy.get(item.pharmacyId)[medicine.id] = mapAvailability(item)
    })
  })

  return pharmacyResponse.data.map((pharmacy) => ({
    ...mapPharmacy(pharmacy),
    medicines: medicinesByPharmacy.get(pharmacy.id) || {},
  }))
}
