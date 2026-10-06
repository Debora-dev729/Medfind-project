import api from './api'

export const getPharmacyById = async (id) => {
  const [pharmacyResponse, medicineResponse] = await Promise.all([
    api.get(`/pharmacies/${id}`),
    api.get('/medicines'),
  ])
  const medicineById = new Map(
    medicineResponse.data.map(({ medicine }) => [medicine.id, medicine]),
  )
  const { pharmacy, inventory } = pharmacyResponse.data

  return {
    ...pharmacy,
    medicines: inventory
      .filter((item) => item.quantity > 0 && item.status !== 'OUT_OF_STOCK')
      .map((item) => ({
        medicine: medicineById.get(item.medicineId) || { id: item.medicineId, name: item.medicineId },
        availability: item,
      })),
  }
}
